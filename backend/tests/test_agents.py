from app.agents import get_model, load_agent_prompt

def test_load_agent_prompt_returns_string():
    prompt = load_agent_prompt("business-analyst")
    assert isinstance(prompt, str)
    assert len(prompt) > 100
    assert "moat" in prompt.lower() or "business" in prompt.lower()

def test_get_model_quality_analyst():
    assert get_model("business-analyst", "quality") == "claude-opus-4-6"

def test_get_model_balanced_macro():
    assert get_model("macro-correlation-analyst", "balanced") == "claude-haiku-4-5"

def test_get_model_budget_synthesis():
    assert get_model("synthesis", "budget") == "claude-sonnet-4-6"
