from agents.tester import test_code
from agents.coder import fix_code


problem = """
Write a Python program to find the second largest distinct number
in an array of integers.

Input:
The first line contains n.
The second line contains n integers.

Output:
Print the second largest distinct number.
If there is no second largest distinct number, print:
No second largest element
"""


# We intentionally provide BAD code.
# This code incorrectly treats duplicate maximum values
# as the second largest value.

bad_code = """
import sys

def solve():
    data = sys.stdin.read().strip().split()

    if not data:
        return

    n = int(data[0])
    arr = list(map(int, data[1:1+n]))

    if n < 2:
        print("No second largest element")
        return

    arr.sort(reverse=True)

    # BUG:
    # This incorrectly returns the second element,
    # even when it is equal to the maximum.
    print(arr[1])


if __name__ == "__main__":
    solve()
"""


print("=" * 60)
print("INITIAL CODE")
print("=" * 60)

print(bad_code)


print("\n" + "=" * 60)
print("AGENT 3 — TESTING INITIAL CODE")
print("=" * 60)

initial_report = test_code(problem, bad_code)

print(
    f"Passed: {initial_report['passed_tests']}/"
    f"{initial_report['total_tests']}"
)

for result in initial_report["results"]:
    print(
        f"\nTest {result['test_number']}: "
        f"{'PASS ✅' if result['passed'] else 'FAIL ❌'}"
    )

    if not result["passed"]:
        print("Input:")
        print(result["input"])

        print("Expected:")
        print(result["expected_output"])

        print("Actual:")
        print(result["actual_output"])


# ------------------------------------------------------------
# If Agent 3 finds a failure, send that feedback to Agent 2.
# ------------------------------------------------------------

if not initial_report["all_passed"]:

    feedback_parts = []

    for result in initial_report["results"]:

        if not result["passed"]:

            feedback_parts.append(
                f"""
Test {result['test_number']} FAILED

Input:
{result['input']}

Expected Output:
{result['expected_output']}

Actual Output:
{result['actual_output']}

Error:
{result['error']}
"""
            )

    feedback = "\n".join(feedback_parts)

    print("\n" + "=" * 60)
    print("AGENT 2 — FIXING CODE")
    print("=" * 60)

    fixed_code = fix_code(
        problem=problem,
        previous_code=bad_code,
        test_feedback=feedback
    )

    print(fixed_code)


    print("\n" + "=" * 60)
    print("AGENT 3 — TESTING FIXED CODE")
    print("=" * 60)

    final_report = test_code(problem, fixed_code)

    for result in final_report["results"]:

        print(
            f"\nTest {result['test_number']}: "
            f"{'PASS ✅' if result['passed'] else 'FAIL ❌'}"
        )

        print("Expected:")
        print(result["expected_output"])

        print("Actual:")
        print(result["actual_output"])


    print("\n" + "=" * 60)
    print("FINAL REPORT")
    print("=" * 60)

    print(f"Total tests : {final_report['total_tests']}")
    print(f"Passed      : {final_report['passed_tests']}")
    print(f"Failed      : {final_report['failed_tests']}")

    if final_report["all_passed"]:
        print("STATUS      : FIXED — ALL TESTS PASSED ✅")
    else:
        print("STATUS      : STILL FAILING ❌")

else:
    print("\nAll initial tests passed.")