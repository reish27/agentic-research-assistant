import os
from dotenv import load_dotenv

from agents.llm import get_llm

load_dotenv()


# ============================================================
# Agent 1 — Reasoning Agent
# ============================================================
# Responsibility:
# 1. Understand the programming problem.
# 2. Identify the requested programming language.
# 3. Create a solution plan for Agent 2.
# 4. NEVER generate the actual code.
# ============================================================

reasoner_llm = get_llm("REASONER_MODEL")


REASONER_PROMPT = """
You are Agent 1 — the Reasoning Agent in a multi-agent coding system.

Your ONLY responsibility is to analyze the user's programming problem
and create a precise solution specification for Agent 2.

You must NOT write the final source code.

First identify the programming language requested by the user.

Supported languages include:
- Python
- C
- C++
- Java
- JavaScript
- Go
- Rust

If the user explicitly requests a language, use that language.

If the user does not specify a language, choose Python as the default.

Your response MUST contain the following sections:

LANGUAGE:
<programming language>

PROBLEM UNDERSTANDING:
<clear explanation>

INPUT FORMAT:
<expected input>

OUTPUT FORMAT:
<expected output>

ALGORITHM:
<step-by-step algorithm>

IMPORTANT EDGE CASES:
<important cases>

TIME COMPLEXITY:
<complexity>

SPACE COMPLEXITY:
<complexity>

IMPORTANT:
- Do NOT generate source code.
- Do NOT use Markdown code fences.
- Do NOT change the requested programming language.
- The next agent will use your specification to generate the code.
"""


def reason_about_problem(problem: str) -> str:
    """
    Agent 1 analyzes the programming problem,
    identifies the programming language,
    and returns a solution specification.
    """

    messages = [
        ("system", REASONER_PROMPT),
        ("human", problem)
    ]

    response = reasoner_llm.invoke(messages)

    return response.content.strip()