from agents.reasoner import reason_about_problem
from agents.coder import generate_code
from agents.tester import test_code


problem = """
Write a Python program to find the second largest number
in an array of integers.
"""


print("=" * 60)
print("AGENT 1 — REASONING")
print("=" * 60)

reasoning = reason_about_problem(problem)

print(reasoning)


print("\n" + "=" * 60)
print("AGENT 2 — CODE GENERATION")
print("=" * 60)

code = generate_code(problem, reasoning)

print(code)


print("\n" + "=" * 60)
print("AGENT 3 — TESTING")
print("=" * 60)

report = test_code(problem, code)


for result in report["results"]:

    print(f"\nTEST {result['test_number']}")
    print("-" * 40)

    print("Input:")
    print(result["input"])

    print("Expected:")
    print(result["expected_output"])

    print("Actual:")
    print(result["actual_output"])

    if result["passed"]:
        print("RESULT: PASS ✅")
    else:
        print("RESULT: FAIL ❌")

        if result["error"]:
            print("Error:")
            print(result["error"])


print("\n" + "=" * 60)
print("FINAL TEST REPORT")
print("=" * 60)

print(f"Total tests : {report['total_tests']}")
print(f"Passed      : {report['passed_tests']}")
print(f"Failed      : {report['failed_tests']}")

if report["all_passed"]:
    print("STATUS      : ALL TESTS PASSED ✅")
else:
    print("STATUS      : TESTS FAILED ❌")