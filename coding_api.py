import json
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.responses import StreamingResponse

from pipeline import run_pipeline


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Problem(BaseModel):
    question: str
    language: Optional[str] = None
    history: Optional[List[dict]] = None


def sse_format(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


def solve(q: Problem) -> dict:
    """
    Run the full pipeline and return the result in the shape the
    Rida UI consumes (see PipelineResult in src/modules/agent/types.ts):

    {
      "mode": "code",
      "status": "success" | "failed" | "error",
      "language": "Python",
      "answer": str,
      "reasoning": str,
      "code": str,
      "compile": {"success", "message", "error"},
      "test": {"all_passed", "total_tests", "passed_tests",
               "failed_tests", "results": [...]},
      "error": str | None
    }
    """

    result = {
        "mode": "code",
        "status": "error",
        "language": None,
        "answer": None,
        "reasoning": None,
        "code": None,
        "compile": None,
        "test": None,
        "error": None,
    }

    try:
        for event in run_pipeline(q.question, history=q.history):

            kind = event["type"]

            if kind == "mode":
                result["mode"] = event["mode"]

            elif kind == "answer":
                result["answer"] = event["content"]

            elif kind == "reasoning":
                result["reasoning"] = event["content"]

            elif kind == "language":
                result["language"] = event["language"]

            elif kind == "code":
                result["code"] = event["content"]

            elif kind == "compile":
                result["compile"] = {
                    "success": event["success"],
                    "message": (
                        "Compilation passed."
                        if event["success"]
                        else "Compilation failed."
                    ),
                    "error": event["detail"] or None,
                }

            elif kind == "tests":
                result["test"] = {
                    "all_passed": event["all_passed"],
                    "total_tests": event["total"],
                    "passed_tests": event["passed"],
                    "failed_tests": event["failed"],
                    "results": event["results"],
                }

            elif kind == "done":
                result["status"] = (
                    "success" if event["success"] else "failed"
                )
                result["code"] = event["code"]

            elif kind == "error":
                result["status"] = "error"
                result["error"] = event["message"]

    except Exception as e:
        result["status"] = "error"
        result["error"] = str(e)

    if result["mode"] == "answer":
        result["status"] = "success"
        return result

    if result["status"] == "success":
        test = result["test"] or {}
        result["answer"] = (
            f"Solved in {result['language']}. "
            f"Compilation passed and "
            f"{test.get('passed_tests', 0)}/{test.get('total_tests', 0)} "
            f"tests passed. The final code is below."
        )
    elif result["status"] == "failed":
        result["answer"] = (
            "The pipeline could not produce a fully working solution. "
            "See the compile and test details below."
        )
    else:
        result["answer"] = None

    return result


@app.post("/solve")
def solve_json(q: Problem):
    return solve(q)


@app.post("/solve/stream")
def solve_stream(q: Problem):
    def generate():
        try:
            for event in run_pipeline(q.question):
                yield sse_format(event)
        except Exception as e:
            yield sse_format({"type": "error", "message": str(e)})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )