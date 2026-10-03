import { useState } from "react";

function CrawlControls({ onCrawlComplete }) {
  const [url, setUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(10);
  const [strategy, setStrategy] = useState("BFS");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function startCrawl() {
    if (!url.trim()) {
      setError("Please enter a URL.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/crawls",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: url.trim(),
            max_depth: Number(maxDepth),
            max_pages: Number(maxPages),
            strategy: strategy,
            include_external: false,
            keywords: [],
            verbose: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}`
        );
      }

      const crawl = await response.json();

      onCrawlComplete(crawl.id);
    } catch (err) {
      console.error("Crawl error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "#111827",
        borderRadius: "12px",
        marginBottom: "20px",
      }}
    >
      <h2>Start New Crawl</h2>

      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "12px",
          boxSizing: "border-box",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <input
          type="number"
          min="0"
          value={maxDepth}
          onChange={(event) =>
            setMaxDepth(event.target.value)
          }
          placeholder="Max Depth"
        />

        <input
          type="number"
          min="1"
          value={maxPages}
          onChange={(event) =>
            setMaxPages(event.target.value)
          }
          placeholder="Max Pages"
        />

        <select
          value={strategy}
          onChange={(event) =>
            setStrategy(event.target.value)
          }
        >
          <option value="BFS">BFS</option>
          <option value="DFS">DFS</option>
          <option value="BestFirst">BestFirst</option>
        </select>
      </div>

      <button
        onClick={startCrawl}
        disabled={loading}
        style={{
          padding: "10px 18px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Crawling..." : "Start Crawl"}
      </button>

      {error && (
        <p style={{ color: "#f87171" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default CrawlControls;