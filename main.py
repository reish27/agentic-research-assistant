from agents.reasoner import reason_about_problem
from agents.coder import generate_code, fix_code
from agents.compiler import compile_code
from agents.tester import test_code


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


def main():

    print("=" * 60)
    print("AGENTIC CODING SYSTEM")
    print("=" * 60)

    problem = input(
        "\nEnter your programming problem:\n> "
    )


    # ========================================================
    # AGENT 1 — REASONING
    # ========================================================

    print("\n" + "=" * 60)
    print("AGENT 1 — REASONING")
    print("=" * 60)

    reasoning = reason_about_problem(problem)

    print(reasoning)


    # ========================================================
    # IDENTIFY LANGUAGE
    # ========================================================

    language = extract_language(reasoning)

    print("\nDetected Language:", language)


    # ========================================================
    # AGENT 2 — CODE GENERATION
    # ========================================================

    print("\n" + "=" * 60)
    print("AGENT 2 — CODE GENERATION")
    print("=" * 60)

    code = generate_code(
        problem,
        reasoning
    )

    print(code)


    # ========================================================
    # AGENT 4 — COMPILER
    # ========================================================

    print("\n" + "=" * 60)
    print("AGENT 4 — COMPILER")
    print("=" * 60)

    compile_result = compile_code(
        code,
        language
    )

    print(compile_result)


    # ========================================================
    # FIX COMPILATION ERRORS
    # ========================================================

    compile_attempts = 0
    max_compile_attempts = 3

    while (
        not compile_result["success"]
        and compile_attempts < max_compile_attempts
    ):

        compile_attempts += 1

        print(
            f"\nCompilation failed."
            f"\nAgent 2 fixing code..."
            f"\nAttempt {compile_attempts}/{max_compile_attempts}"
        )

        code = fix_code(
            problem=problem,
            previous_code=code,
            reasoning=reasoning,
            test_feedback=compile_result["error"]
        )

        print("\nCorrected Code:")
        print(code)

        print("\nAgent 4 — Recompiling...")

        compile_result = compile_code(
            code,
            language
        )

        print(compile_result)


    if not compile_result["success"]:

        print("\n" + "=" * 60)
        print("❌ COMPILATION FAILED")
        print("=" * 60)

        return


    # ========================================================
    # AGENT 3 — TESTING
    # ========================================================

    print("\n" + "=" * 60)
    print("AGENT 3 — TESTING")
    print("=" * 60)

    test_result = test_code(
        problem,
        code,
        language
    )

    print(test_result)


    # ========================================================
    # FIX TEST FAILURES
    # ========================================================

    test_attempts = 0
    max_test_attempts = 3

    while (
        not test_result["all_passed"]
        and test_attempts < max_test_attempts
    ):

        test_attempts += 1

        print(
            f"\nTests failed."
            f"\nAgent 2 fixing code..."
            f"\nAttempt {test_attempts}/{max_test_attempts}"
        )

        code = fix_code(
            problem=problem,
            previous_code=code,
            reasoning=reasoning,
            test_feedback=str(test_result)
        )

        print("\nCorrected Code:")
        print(code)


        # ----------------------------------------------------
        # AGENT 4 RECOMPILES
        # ----------------------------------------------------

        print("\nAgent 4 — Recompiling...")

        compile_result = compile_code(
            code,
            language
        )

        print(compile_result)


        if not compile_result["success"]:
            continue


        # ----------------------------------------------------
        # AGENT 3 RETESTS
        # ----------------------------------------------------

        print("\nAgent 3 — Retesting...")

        test_result = test_code(
            problem,
            code,
            language
        )

        print(test_result)


    # ========================================================
    # FINAL RESULT
    # ========================================================

    print("\n" + "=" * 60)
    print("FINAL RESULT")
    print("=" * 60)


    if (
        compile_result["success"]
        and test_result["all_passed"]
    ):

        print("✅ SUCCESS")
        print("\nLanguage:", language)

        print("\nFinal Generated Code:")
        print("-" * 60)
        print(code)
        print("-" * 60)

    else:

        print("❌ FAILED")
        print(
            "The system could not produce "
            "a fully working solution."
        )


if __name__ == "__main__":
    main()