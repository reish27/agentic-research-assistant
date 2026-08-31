from agents.reasoner import reason_about_problem


print("=" * 60)
print("TEST 1 — PYTHON")
print("=" * 60)

problem = """
Write a Python program to find the second largest distinct
number in an array.
"""

reasoning = reason_about_problem(problem)

print(reasoning)


print("\n" + "=" * 60)
print("TEST 2 — C++")
print("=" * 60)

problem = """
Write a C++ program to check whether a given number is prime.
"""

reasoning = reason_about_problem(problem)

print(reasoning)


print("\n" + "=" * 60)
print("TEST 3 — JAVA")
print("=" * 60)

problem = """
Write a Java program to perform binary search on a sorted array.
"""

reasoning = reason_about_problem(problem)

print(reasoning)