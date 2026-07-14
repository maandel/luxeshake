import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.database import Base, get_db

# Use an in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session() -> AsyncSession:
    async with TestingSessionLocal() as session:
        yield session


@pytest.fixture
async def async_client(db_session: AsyncSession):
    # Override the get_db dependency to use the test session
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(app=app, base_url="http://testserver") as client:
        yield client
    app.dependency_overrides.clear()
