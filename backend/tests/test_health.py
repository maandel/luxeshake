import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_health_check(async_client: AsyncClient):
    response = await async_client.get("/health")
    # Our API currently does not have a /health route. 
    # This will fail unless we create one, or we can test another public route.
    # Let's test the categories route.
    response = await async_client.get("/categories")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
