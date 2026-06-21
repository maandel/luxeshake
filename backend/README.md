# LuxeShake Backend API

FastAPI backend application providing REST endpoints for user authentication, product catalog management, order fulfillment, support desk tickets, and store-wide administration settings.

---

## Local Development Setup

### Prerequisites
*   Python 3.12+
*   Poetry package manager

### Steps
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies using Poetry:
    ```bash
    poetry install
    ```
3.  Activate the virtual environment:
    ```bash
    poetry shell
    ```
4.  Start the development server with hot-reload enabled:
    ```bash
    poetry run uvicorn app.main:app --reload
    ```
    The Swagger interactive documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs).

---

## Database Initialization & Seeding

On startup, the application automatically runs schema migrations and seeds default data.

### Migrations
Database tables are initialized using SQLAlchemy `create_all` inside [db_init.py](file:///backend/app/db_init.py). Custom incremental column upgrades are also run automatically (e.g. adding `driver_phone` or `must_reset_password` columns if not already present).

### Default Seed Credentials
If the users table is empty, the database initializer provisions a default administrator account. Please refer to the seeding logic inside [db_init.py](file:///backend/app/db_init.py) for the default credentials.

> [!WARNING]
> **Change the default credentials immediately** after your first login via the LuxeControl user dropdown.

---

## Key Service Workflows

### 1. Authentication & Silent Refresh
*   **Sign In:** POSTing to `/api/v1/auth/login` returns a short-lived JSON Web Token (JWT) `access_token` (in-memory) and sets a secure, HTTP-only `refresh_token` cookie.
*   **Token Refresh:** The frontend automatically calls `/api/v1/auth/refresh` on page reload or token expiry. The backend validates the cookie and issues a fresh `access_token`.

### 2. Password Reset Desk
*   **Self-Service Reset:** Users can request a password reset via `/auth/forgot-password-request`, which dispatches a 6-digit OTP to their email.
*   **Administrative Reset:** A superadmin can reset any staff member's password via `POST /api/v1/admin/users/{id}/reset-password`. This:
    1.  Generates a secure, random 12-character password.
    2.  Flags `must_reset_password = True` in the database.
    3.  Dispatches a transactional email to the user with their temporary credentials.
    4.  Forces the user to update their credentials on `/luxe-control/change-password` before any further admin actions are allowed.

### 3. File Uploads & Local Image Serving
*   Uploads are handled by `POST /api/v1/admin/products/{id}/image`.
*   If `STORAGE_BACKEND` is set to `local` (default), uploaded files are saved to `backend/uploads/` and served as static files on the `/static/uploads/...` path.
*   If `STORAGE_BACKEND` is set to `cloudinary`, files are uploaded directly to your Cloudinary storage catalog.
