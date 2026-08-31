from agents.reasoner import reason_about_problem
from agents.coder import generate_code


problems = [
    """
    Write a Python program to find the second largest distinct
    number in an array.
    """,

    """
    Write a C++ program to check whether a given number is prime.
    """,

    """
    Write a Java program to perform binary search on a sorted array.
    """
]


for i, problem in enumerate(problems, start=1):

    print("=" * 60)
    print(f"TEST {i}")
    print("=" * 60)

    print("\nUSER PROBLEM:")
    print(problem.strip())

    # --------------------------------------------------------
    # Agent 1
    # --------------------------------------------------------

    reasoning = reason_about_problem(problem)

    print("\n" + "-" * 60)
    print("AGENT 1 — REASONING")
    print("-" * 60)

    print(reasoning)

    # --------------------------------------------------------
    # Agent 2
    # --------------------------------------------------------

    code = generate_code(
        problem=problem,
        reasoning=reasoning
    )

    print("\n" + "-" * 60)
    print("AGENT 2 — GENERATED CODE")
    print("-" * 60)

    print(code)

    print()