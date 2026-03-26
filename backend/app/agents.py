"""Agent prompt loader and model selection."""

from pathlib import Path

AGENTS_DIR = Path(__file__).parent / "agents"

MODEL_MAP = {
    "quality":  {"synthesis": "claude-opus-4-6",   "analyst": "claude-opus-4-6",   "macro": "claude-sonnet-4-6"},
    "balanced": {"synthesis": "claude-sonnet-4-6",  "analyst": "claude-sonnet-4-6",  "macro": "claude-haiku-4-5"},
    "budget":   {"synthesis": "claude-sonnet-4-6",  "analyst": "claude-haiku-4-5",   "macro": "claude-haiku-4-5"},
}

MACRO_TIER_AGENTS = {"macro-analyst", "macro-correlation-analyst"}


def load_agent_prompt(agent_name: str) -> str:
    """Load agent prompt from .md file. Strips YAML frontmatter."""
    path = AGENTS_DIR / f"{agent_name}.md"
    if not path.exists():
        raise FileNotFoundError(f"Agent prompt not found: {path}")
    content = path.read_text(encoding="utf-8")
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            return parts[2].strip()
    return content.strip()


def load_skill_prompt() -> str:
    """Load the b3-analysis skill for synthesis context."""
    path = AGENTS_DIR / "skill.md"
    if not path.exists():
        return ""
    content = path.read_text(encoding="utf-8")
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            return parts[2].strip()
    return content.strip()


def get_model(agent_name: str, profile: str) -> str:
    """Return the correct Claude model for this agent and profile."""
    if profile not in MODEL_MAP:
        profile = "balanced"
    tier = (
        "synthesis" if agent_name == "synthesis"
        else "macro" if agent_name in MACRO_TIER_AGENTS
        else "analyst"
    )
    return MODEL_MAP[profile][tier]
