import os
import json
import subprocess
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()


# ============================================================
# Agent 3 — Multi-Language Testing Agent
# ============================================================
# Responsibility:
#
# 1. Analyze the programming problem.
# 2. Generate exactly 3 test cases.
# 3. Execute the generated program.
# 4. Compare actual output with expected output.
# 5. Return a structured testing report.
#
# Supported languages:
# - Python
# - C++
# - Java
#
# Agent 4 handles compilation.
# Agent 3 handles execution and testing.
# ============================================================


tester_llm = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0
)


TESTER_PROMPT = """
You are Agent 3 — the Testing Agent in a multi-agent coding system.

Your job is to create test cases for a programming problem and its
generated source code.

The programming language is specified by Agent 1.

Generate EXACTLY 3 test cases.

The tests should cover:
1. A normal/basic case.
2. An edge case.
3. A different or challenging case.

Return ONLY valid JSON.

The JSON must have this exact structure:

{
    "tests": [
        {
            "input": "complete stdin input as a string",
            "expected_output": "complete expected stdout as a string"
        },
        {
            "input": "complete stdin input as a string",
            "expected_output": "complete expected stdout as a string"
        },
        {
            "input": "complete stdin input as a string",
            "expected_output": "complete expected stdout as a string"
        }
    ]
}

Do not use Markdown.
Do not include ```json.
Do not include explanations.

IMPORTANT:
- Expected output must follow the exact output format required by the problem.
- Do not invent requirements that are not present in the problem.
"""


def generate_test_cases(
    problem: str,
    code: str,
    language: str
) -> list:
    """
    Ask the LLM to generate exactly three test cases
    for the specified programming language.
    """

    prompt = f"""
Programming Problem:
{problem}

Programming Language:
{language}

Generated Source Code:
{code}

Generate exactly 3 test cases following the required JSON format.
"""

    response = tester_llm.invoke([
        ("system", TESTER_PROMPT),
        ("human", prompt)
    ])

    content = response.content.strip()

    # Remove accidental Markdown fences.
    if content.startswith("```"):
        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

    data = json.loads(content)

    tests = data.get("tests", [])

    if len(tests) < 3:
        raise ValueError(
            "Tester generated fewer than 3 test cases."
        )

    return tests[:3]


def execute_program(
    code: str,
    language: str,
    test_input: str
) -> dict:
    """
    Execute source code according to its programming language.

    Agent 4 is responsible for compilation.
    Agent 3 is responsible for execution/testing.

    Python:
        python solution.py

    C++:
        g++ compilation is performed first,
        then ./main.exe

    Java:
        javac compilation is performed first,
        then java Main
    """

    language = language.strip().lower()

    try:
        with tempfile.TemporaryDirectory() as temp_dir:

            temp_path = Path(temp_dir)

            # ==================================================
            # PYTHON
            # ==================================================

            if language in ["python", "python3"]:

                source_file = temp_path / "solution.py"

                source_file.write_text(
                    code,
                    encoding="utf-8"
                )

                process = subprocess.run(
                    [
                        "python",
                        str(source_file)
                    ],
                    input=test_input,
                    text=True,
                    capture_output=True,
                    timeout=10,
                    cwd=temp_dir
                )

                return {
                    "returncode": process.returncode,
                    "stdout": process.stdout.strip(),
                    "stderr": process.stderr.strip()
                }


            # ==================================================
            # C++
            # ==================================================

            elif language in ["c++", "cpp", "cplusplus"]:

                source_file = temp_path / "main.cpp"
                executable_file = temp_path / "main.exe"

                source_file.write_text(
                    code,
                    encoding="utf-8"
                )

                # Compile
                compile_process = subprocess.run(
                    [
                        "g++",
                        str(source_file),
                        "-o",
                        str(executable_file)
                    ],
                    capture_output=True,
                    text=True,
                    timeout=15
                )

                if compile_process.returncode != 0:
                    return {
                        "returncode": compile_process.returncode,
                        "stdout": "",
                        "stderr": compile_process.stderr.strip()
                    }

                # Execute
                process = subprocess.run(
                    [str(executable_file)],
                    input=test_input,
                    text=True,
                    capture_output=True,
                    timeout=10,
                    cwd=temp_dir
                )

                return {
                    "returncode": process.returncode,
                    "stdout": process.stdout.strip(),
                    "stderr": process.stderr.strip()
                }


            # ==================================================
            # JAVA
            # ==================================================

            elif language == "java":

                source_file = temp_path / "Main.java"

                source_file.write_text(
                    code,
                    encoding="utf-8"
                )

                # Compile
                compile_process = subprocess.run(
                    [
                        "javac",
                        str(source_file)
                    ],
                    capture_output=True,
                    text=True,
                    timeout=15
                )

                if compile_process.returncode != 0:
                    return {
                        "returncode": compile_process.returncode,
                        "stdout": "",
                        "stderr": compile_process.stderr.strip()
                    }

                # Execute
                process = subprocess.run(
                    [
                        "java",
                        "-cp",
                        temp_dir,
                        "Main"
                    ],
                    input=test_input,
                    text=True,
                    capture_output=True,
                    timeout=10,
                    cwd=temp_dir
                )

                return {
                    "returncode": process.returncode,
                    "stdout": process.stdout.strip(),
                    "stderr": process.stderr.strip()
                }


            # ==================================================
            # UNSUPPORTED LANGUAGE
            # ==================================================

            else:

                return {
                    "returncode": -1,
                    "stdout": "",
                    "stderr": (
                        f"Unsupported language: {language}"
                    )
                }

    except subprocess.TimeoutExpired:

        return {
            "returncode": -1,
            "stdout": "",
            "stderr": "Execution timed out."
        }

    except Exception as e:

        return {
            "returncode": -1,
            "stdout": "",
            "stderr": str(e)
        }


def run_test(
    code: str,
    language: str,
    test_input: str,
    expected_output: str
) -> dict:
    """
    Execute one test case and compare the output.
    """

    result = execute_program(
        code=code,
        language=language,
        test_input=test_input
    )

    actual_output = result["stdout"].strip()
    expected_output = expected_output.strip()

    passed = (
        result["returncode"] == 0
        and actual_output == expected_output
    )

    return {
        "passed": passed,
        "input": test_input,
        "expected_output": expected_output,
        "actual_output": actual_output,
        "error": result["stderr"]
    }


def test_code(
    problem: str,
    code: str,
    language: str
) -> dict:
    """
    Complete Agent 3 pipeline:

    Problem + Code + Language
              ↓
       Generate 3 tests
              ↓
        Execute tests
              ↓
       Compare outputs
              ↓
        Return report
    """

    tests = generate_test_cases(
        problem=problem,
        code=code,
        language=language
    )

    results = []

    for i, test in enumerate(tests, start=1):

        result = run_test(
            code=code,
            language=language,
            test_input=test["input"],
            expected_output=test["expected_output"]
        )

        result["test_number"] = i

        results.append(result)

    passed_count = sum(
        1
        for result in results
        if result["passed"]
    )

    return {
        "language": language,
        "total_tests": len(results),
        "passed_tests": passed_count,
        "failed_tests": len(results) - passed_count,
        "all_passed": passed_count == len(results),
        "results": results
    }