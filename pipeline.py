from agents.reasoner import reason_about_problem, reasoner_llm
from agents.coder import generate_code, fix_code
from agents.compiler import compile_code
from agents.tester import test_code, run_tests, format_failures


MAX_COMPILE_ATTEMPTS = 3
MAX_TEST_ATTEMPTS = 3


ROUTER_PROMPT = """
You are the router of a multi-agent coding system.

Decide whether the user's message is a PROGRAMMING TASK that requires
generating or fixing a program, or a GENERAL QUESTION that should be
answered directly in text.

Programming tasks include: writing a program, implementing an algorithm,
fixing or debugging code, writing a solution for a problem statement.

General questions include: explanations of concepts, comparisons,
opinions, facts, small talk, follow-up questions about a previous answer.

Reply with exactly one word: "code" or "answer".
Do not add anything else.
"""


ANSWER_PROMPT = """
You are Koda, the assistant inside Rida, a coding-agent workspace.

The user asked a general question that does NOT require building a
program. Answer it directly, concisely, and correctly in markdown.

If the question is about a programming concept, explain it in prose and
use a small code snippet only when it genuinely helps.

Do not generate a full program or solution file.
"""


def classify_question(question: str) -> str:
    """
    Route the user's message before any agent spins up.

    Returns "code" for programming tasks and "answer" for general
    questions, so that non-code questions never reach Agents 2-4.
    """

    response = reasoner_llm.invoke(
        [
            ("system", ROUTER_PROMPT),
            ("human", question),
        ]
    )

    verdict = response.content.strip().lower()

    return "code" if verdict.startswith("code") else "answer"


def answer_question(question: str, history=None) -> str:
    """
    Answer a general question directly, using the conversation
    history for context on follow-ups.
    """

    messages = [("system", ANSWER_PROMPT)]

    for turn in history or []:
        content = turn.get("content")
        if not content:
            continue
        role = "assistant" if turn.get("role") == "assistant" else "human"
        messages.append((role, content))

    messages.append(("human", question))

    response = reasoner_llm.invoke(messages)

    return response.content.strip()


def extract_language(reasoning: str) -> str:
    """
    Extract the programming language identified by Agent 1.

    Supports formats such as:

    LANGUAGE:
    Python

    or:

    LANGUAGE: Python
    """

    lines = reasoning.splitlines()

    for i, line in enumerate(lines):
        if line.strip().upper().startswith("LANGUAGE:"):

            # Case 1: LANGUAGE: Python
            value = line.split(":", 1)[1].strip()

            if value:
                return value

            # Case 2:
            # LANGUAGE:
            # Python
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()

                if next_line:
                    return next_line

    raise ValueError(
        "Agent 1 did not specify a programming language."
    )


def _trim_report(report: dict) -> dict:
    """
    Compact a test report for transport over the event stream.
    """

    results = [
        {
            "test_number": r["test_number"],
            "passed": r["passed"],
            "input": r["input"],
            "expected_output": r["expected_output"],
            "actual_output": r["actual_output"],
            "error": r["error"],
        }
        for r in report.get("results", [])
    ]

    return {
        "total": report["total_tests"],
        "passed": report["passed_tests"],
        "failed": report["failed_tests"],
        "all_passed": report["all_passed"],
        "results": results,
    }


def run_pipeline(problem: str, history=None):
    """
    Run the full Agent 1 -> 2 -> 4 -> 3 pipeline and yield
    structured events as the run progresses.

    The question is classified first: general questions are answered
    directly by the reasoning model and never reach Agents 2-4.

    Every event is a dict with a "type" key:

    mode       {"mode": "code" | "answer"}
    answer     {"content": str}
    phase      {"name": "reasoning" | "coding" | "compiling" | "testing"}
    reasoning  {"content": str}
    language   {"language": str}
    code       {"content": str}
    compile    {"success": bool, "detail": str, "attempt": int}
    tests      {"total": int, "passed": int, "failed": int,
                "all_passed": bool, "results": [...]}
    fix        {"stage": "compile" | "tests", "attempt": int, "max": int}
    done       {"success": bool, "language": str, "code": str}
    error      {"message": str}
    """

    # ========================================================
    # ROUTER — CODE TASK OR GENERAL QUESTION
    # ========================================================

    mode = classify_question(problem)

    yield {"type": "mode", "mode": mode}

    if mode == "answer":

        yield {"type": "phase", "name": "answering"}

        answer = answer_question(problem, history)

        yield {"type": "answer", "content": answer}
        yield {
            "type": "done",
            "success": True,
            "language": None,
            "code": None,
        }
        return

    # ========================================================
    # AGENT 1 — REASONING
    # ========================================================

    yield {"type": "phase", "name": "reasoning"}

    reasoning = reason_about_problem(problem)

    yield {"type": "reasoning", "content": reasoning}

    # ========================================================
    # IDENTIFY LANGUAGE
    # ========================================================

    language = extract_language(reasoning)

    yield {"type": "language", "language": language}

    # ========================================================
    # AGENT 2 — CODE GENERATION
    # ========================================================

    yield {"type": "phase", "name": "coding"}

    code = generate_code(problem, reasoning)

    yield {"type": "code", "content": code}

    # ========================================================
    # AGENT 4 — COMPILE + FIX LOOP
    # ========================================================

    compile_attempt = 0

    while True:

        yield {"type": "phase", "name": "compiling"}

        compile_result = compile_code(code, language)

        yield {
            "type": "compile",
            "success": compile_result["success"],
            "detail": compile_result.get("error", ""),
            "attempt": compile_attempt,
        }

        if compile_result["success"]:
            break

        if compile_attempt >= MAX_COMPILE_ATTEMPTS:
            yield {
                "type": "done",
                "success": False,
                "language": language,
                "code": code,
            }
            return

        compile_attempt += 1

        yield {
            "type": "fix",
            "stage": "compile",
            "attempt": compile_attempt,
            "max": MAX_COMPILE_ATTEMPTS,
        }

        code = fix_code(
            problem=problem,
            previous_code=code,
            reasoning=reasoning,
            test_feedback=compile_result["error"],
        )

        yield {"type": "code", "content": code}

    # ========================================================
    # AGENT 3 — TESTS (GENERATED ONCE) + FIX LOOP
    # ========================================================

    yield {"type": "phase", "name": "testing"}

    test_result = test_code(problem, code, language, reasoning)

    yield {"type": "tests", **_trim_report(test_result)}

    tests = test_result["tests"]

    test_attempt = 0

    while not test_result["all_passed"] and test_attempt < MAX_TEST_ATTEMPTS:

        test_attempt += 1

        yield {
            "type": "fix",
            "stage": "tests",
            "attempt": test_attempt,
            "max": MAX_TEST_ATTEMPTS,
        }

        code = fix_code(
            problem=problem,
            previous_code=code,
            reasoning=reasoning,
            test_feedback=format_failures(test_result),
        )

        yield {"type": "code", "content": code}

        # Agent 4 recompiles.

        yield {"type": "phase", "name": "compiling"}

        compile_result = compile_code(code, language)

        yield {
            "type": "compile",
            "success": compile_result["success"],
            "detail": compile_result.get("error", ""),
            "attempt": compile_attempt,
        }

        if not compile_result["success"]:
            continue

        # Agent 3 retests the SAME test set.

        yield {"type": "phase", "name": "testing"}

        test_result = run_tests(code=code, language=language, tests=tests)

        yield {"type": "tests", **_trim_report(test_result)}

    yield {
        "type": "done",
        "success": compile_result["success"] and test_result["all_passed"],
        "language": language,
        "code": code,
    }