from unittest.mock import AsyncMock, patch

import pytest

from app.orchestrator import AgentOrchestrator


@pytest.fixture
def orchestrator():
    return AgentOrchestrator(api_key="sk-ant-test", profile="balanced")


@pytest.mark.asyncio
async def test_call_agent_uses_correct_model(orchestrator):
    mock_response = AsyncMock()
    mock_response.content = [AsyncMock(text="test output")]
    orchestrator.client.messages.create = AsyncMock(return_value=mock_response)

    result = await orchestrator.call_agent("business-analyst", "test data")

    assert result == "test output"
    call_kwargs = orchestrator.client.messages.create.call_args.kwargs
    assert call_kwargs["model"] == "claude-sonnet-4-6"  # balanced -> analyst tier
