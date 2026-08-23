from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import app as agent_app

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Question(BaseModel):
    question: str


@app.post("/ask")
def ask(q: Question):
    try:
        result = agent_app.invoke({"messages": [{"role": "user", "content": q.question}]})
        return {"answer": result["messages"][-1].content, "error": None}
    except Exception as e:
        return {"answer": None, "error": str(e)}