from agents.reasoner import reason_about_problem
from agents.coder import generate_code


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

print("=" * 60)
print("END OF AGENT 2")
print("=" * 60)