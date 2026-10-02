import os
from dotenv import load_dotenv

from agents.llm import get_llm

load_dotenv()


# ============================================================
# Agent 2 — Code Generation Agent
# ============================================================
# Responsibility:
# 1. Read Agent 1's reasoning.
# 2. Identify the required programming language.
# 3. Generate executable source code in that language.
# 4. Fix previously generated code when Agent 3 reports failures.
# ============================================================


coder_llm = get_llm("CODER_MODEL")


CODER_PROMPT = """
You are Agent 2 — the Code Generation Agent in a multi-agent coding system.

Your job is to generate the actual source code based on:
1. The original programming problem.
2. The reasoning and specification provided by Agent 1.

IMPORTANT RULES:

- Generate ONLY source code.
- Do NOT provide explanations.
- Do NOT use Markdown code fences.
- Do NOT repeat the reasoning.
- Follow Agent 1's algorithm.
- Follow Agent 1's identified programming language EXACTLY.
- Do not change the programming language.
- Handle the edge cases identified by Agent 1.
- The generated program must be directly executable.
- Use standard libraries unless the problem specifically requires otherwise.
"""


def generate_code(problem: str, reasoning: str) -> str:
    """
    Agent 2 receives the original problem and Agent 1's reasoning
    and generates source code in the requested programming language.
    """

    prompt = f"""
Original Programming Problem:
{problem}

Agent 1 — Reasoning and Specification:
{reasoning}

Generate the complete solution in the programming language
specified by Agent 1.

Return ONLY the source code.
Do NOT use Markdown code fences.
"""

    response = coder_llm.invoke([
        ("system", CODER_PROMPT),
        ("human", prompt)
    ])

    return response.content.strip()


def fix_code(
    problem: str,
    previous_code: str,
    reasoning: str = "",
    test_feedback: str = ""
) -> str:
    """
    Agent 2 receives failed test information from Agent 3
    and generates a corrected version of the code.
    """

    reasoning_block = (
        f"""
Agent 1 — Reasoning and Specification:
{reasoning}
"""
        if reasoning.strip()
        else ""
    )

    prompt = f"""
Original Programming Problem:
{problem}
{reasoning_block}
Previous Generated Code:
{previous_code}

Agent 3 — Test Feedback:
{test_feedback}

The previous code failed one or more tests.

The test feedback is the authoritative description of the failure.
The expected outputs in the feedback were derived from the problem
statement, not from the previous code.

Analyze the failure and generate a corrected solution.

IMPORTANT:
- Fix the actual problem identified by the test feedback.
- Preserve the original requirements.
- Preserve the programming language specified by Agent 1.
- Handle the relevant edge cases.
- Return ONLY the complete corrected source code.
- Do NOT use Markdown code fences.
- Do NOT provide explanations.
"""

    response = coder_llm.invoke([
        ("system", CODER_PROMPT),
        ("human", prompt)
    ])

    return response.content.strip()