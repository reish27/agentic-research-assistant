import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph.message import add_messages
from typing import Annotated, TypedDict
from tavily import TavilyClient

load_dotenv()

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


@tool
def search_web(query: str) -> str:
    """Search the web for current information on a topic. Use this when you need up-to-date facts."""
    try:
        results = tavily.search(query=query, max_results=3)
    except Exception as e:
        return f"Search failed with error: {str(e)}. Try answering with general knowledge, or tell the user you couldn't retrieve live results."

    if not results.get("results"):
        return "No search results found for this query."

    combined = ""
    for r in results["results"]:
        combined += f"Source: {r['url']}\nContent: {r['content']}\n\n"
    return combined


tools = [search_web]

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=os.getenv("GROQ_API_KEY")
)
llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are a research assistant. When answering:
1. Decide if you need to search the web, or if you can answer from general knowledge (e.g. simple facts, math, definitions).
2. If you search, use the results to write a clear, well-organized answer.
3. At the END of your answer, add a "Sources:" section listing each URL you used, one per line.
4. If a search fails or returns nothing useful, say so honestly instead of making up an answer.
5. Keep the main answer concise — a few short paragraphs, not a wall of text."""


class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


def call_model(state: AgentState):
    messages = state["messages"]
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


graph = StateGraph(AgentState)
graph.add_node("agent", call_model)
graph.add_node("tools", ToolNode(tools))
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", tools_condition)
graph.add_edge("tools", "agent")
app = graph.compile()


if __name__ == "__main__":
    print("Agentic AI Research Assistant — type 'exit' or 'quit' to stop.\n")

    while True:
        user_input = input("You: ")
        if user_input.lower() in ["exit", "quit"]:
            print("Goodbye!")
            break

        try:
            result = app.invoke({"messages": [{"role": "user", "content": user_input}]})
            print(f"\nAgent: {result['messages'][-1].content}\n")
        except Exception as e:
            print(f"\n⚠️ Something went wrong: {e}\n")