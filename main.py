from pipeline import run_pipeline


def main():
    print("=" * 60)
    print("AGENTIC CODING SYSTEM")
    print("=" * 60)

    problem = input("\nEnter your programming problem:\n> ")

    for event in run_pipeline(problem):

        kind = event["type"]

        if kind == "phase":
            name = event["name"].upper()
            print("\n" + "=" * 60)
            print(f"AGENT — {name}")
            print("=" * 60)

        elif kind == "mode":
            if event["mode"] == "answer":
                print("\n" + "=" * 60)
                print("MODE — DIRECT ANSWER")
                print("=" * 60)

        elif kind == "answer":
            print(event["content"])

        elif kind == "reasoning":
            print(event["content"])

        elif kind == "language":
            print("\nDetected Language:", event["language"])

        elif kind == "code":
            print("\nGenerated Code:")
            print("-" * 60)
            print(event["content"])
            print("-" * 60)

        elif kind == "compile":
            status = "OK" if event["success"] else "FAILED"
            print(f"\nAgent 4 — Compile attempt {event['attempt']}: {status}")
            if event["detail"]:
                print(event["detail"])

        elif kind == "tests":
            print(
                f"\nAgent 3 — Tests: {event['passed']}/{event['total']} passed"
            )
            for result in event["results"]:
                mark = "PASS" if result["passed"] else "FAIL"
                print(f"  Test {result['test_number']}: {mark}")
                if not result["passed"] and result["error"]:
                    print(f"    error: {result['error']}")

        elif kind == "fix":
            print(
                f"\nAgent 2 — fixing code "
                f"({event['stage']} failure) "
                f"attempt {event['attempt']}/{event['max']}"
            )

        elif kind == "done":
            print("\n" + "=" * 60)
            print("FINAL RESULT")
            print("=" * 60)

            if event["success"]:
                print("SUCCESS")
                print("\nLanguage:", event["language"])
                print("\nFinal Generated Code:")
                print("-" * 60)
                print(event["code"])
                print("-" * 60)
            else:
                print("FAILED")
                print(
                    "The system could not produce "
                    "a fully working solution."
                )

        elif kind == "error":
            print(f"\nERROR: {event['message']}")


if __name__ == "__main__":
    main()