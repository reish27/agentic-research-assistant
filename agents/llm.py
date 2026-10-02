import os

from dotenv import load_dotenv

load_dotenv()


# ============================================================
# Shared LLM factory for all agents
# ============================================================
# Provider selection:
# 1. LLM_PROVIDER=groq|openrouter wins if set (and its key exists).
# 2. Otherwise, whichever API key is present in the env decides:
#    GROQ_API_KEY -> Groq, OPENROUTER_API_KEY -> OpenRouter.
#    If both are present, Groq is used.
#
# Per-agent models (each falls back to DEFAULT_MODEL when unset):
#   REASONER_MODEL  — Agent 1 (also the router / direct answers)
#   CODER_MODEL     — Agent 2
#   TESTER_MODEL    — Agent 3
# ============================================================


DEFAULT_MODEL = "openai/gpt-oss-120b"

_SETUP_HINT = """
No LLM provider is configured.

Add ONE of the following to your .env file:
  GROQ_API_KEY=...          (provider: Groq)
  OPENROUTER_API_KEY=...    (provider: OpenRouter)

Optional:
  LLM_PROVIDER=groq|openrouter   (forces a provider when both keys exist)
  REASONER_MODEL=...             (default: openai/gpt-oss-120b)
  CODER_MODEL=...                (default: openai/gpt-oss-120b)
  TESTER_MODEL=...               (default: openai/gpt-oss-120b)
"""


def _select_provider() -> str:
    explicit = os.getenv("LLM_PROVIDER", "").strip().lower()
    has_groq = bool(os.getenv("GROQ_API_KEY", "").strip())
    has_openrouter = bool(os.getenv("OPENROUTER_API_KEY", "").strip())

    if explicit:
        if explicit not in ("groq", "openrouter"):
            raise ValueError(
                f"Unsupported LLM_PROVIDER: {explicit}. "
                f"Use 'groq' or 'openrouter'."
            )
        if explicit == "groq" and not has_groq:
            raise ValueError(
                "LLM_PROVIDER=groq but GROQ_API_KEY is missing."
            )
        if explicit == "openrouter" and not has_openrouter:
            raise ValueError(
                "LLM_PROVIDER=openrouter but OPENROUTER_API_KEY is missing."
            )
        return explicit

    if has_groq:
        return "groq"

    if has_openrouter:
        return "openrouter"

    raise RuntimeError(_SETUP_HINT)


def _build(env_var: str, default_model: str):
    provider = _select_provider()

    model = os.getenv(env_var, "").strip() or default_model

    if provider == "groq":
        from langchain_groq import ChatGroq

        return ChatGroq(
            model=model,
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0,
        )

    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=model,
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        temperature=0,
    )


class _LazyLLM:
    """
    Wraps the provider-specific client and defers construction (and
    any provider/model errors) until the first .invoke() call, so that
    importing an agent module never crashes on a missing key.
    """

    def __init__(self, env_var: str, default_model: str):
        self._env_var = env_var
        self._default_model = default_model
        self._llm = None

    def _instance(self):
        if self._llm is None:
            self._llm = _build(self._env_var, self._default_model)
        return self._llm

    def invoke(self, messages):
        return self._instance().invoke(messages)


def get_llm(env_var: str, default_model: str = DEFAULT_MODEL) -> _LazyLLM:
    return _LazyLLM(env_var, default_model)