import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

const LOADING_STEPS = [
  "Understanding your question",
  "Searching the web",
  "Reading sources",
  "Synthesizing answer",
];

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer("");
    setActiveStep(0);

    // Advance through visual steps every ~1.2s while the real request runs
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setAnswer(data.answer);
      }
    } catch (err) {
      setError("Could not reach the agent. Is the API server running?");
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAsk();
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Research Agent</h1>
        <p className="subtitle">Ask anything — it searches the web when it needs to</p>
      </div>

      <div className="input-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something..."
          disabled={loading}
        />
        <button onClick={handleAsk} disabled={loading}>
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

      {!answer && !loading && (
        <div className="empty-state">
          <p>Try asking about something current, or a quick fact</p>
          <div className="examples">
            {["What's new in agentic AI?", "Capital of Japan?", "Latest LangGraph updates"].map((ex) => (
              <span key={ex} className="example-chip" onClick={() => setQuestion(ex)}>
                {ex}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          {LOADING_STEPS.map((step, i) => (
            <div
              key={step}
              className={`loading-step ${i === activeStep ? "active" : ""} ${i < activeStep ? "done" : ""}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className="dot"></span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="error">⚠️ {error}</p>}

      {answer && (
        <div className="answer-card">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default App;