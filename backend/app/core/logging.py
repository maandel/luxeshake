"""
Structured logging configuration using structlog.
Outputs JSON-formatted logs with request IDs, timestamps, and log levels.
PII must NEVER be logged — mask emails and phones before logging.
"""

import logging
import sys

import structlog


def configure_logging(log_level: str = "INFO") -> None:
    """Configure structlog for JSON-formatted structured logging."""
    level = getattr(logging, log_level.upper(), logging.INFO)

    # Configure stdlib logging to output to stdout
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )
    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.make_filtering_bound_logger(level),
        cache_logger_on_first_use=True,
    )


def mask_email(email: str) -> str:
    """Mask PII: john.doe@example.com → jo**@example.com"""
    if not email or "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    masked_local = local[:2] + "**" if len(local) > 2 else "**"
    return f"{masked_local}@{domain}"


def mask_phone(phone: str) -> str:
    """Mask PII: +2348012345678 → ***5678"""
    if not phone:
        return "***"
    return "***" + phone[-4:]


def get_logger(name: str = __name__):
    """Get a structlog logger bound to the given module name."""
    return structlog.get_logger(name)
