import { useState } from "react";

function CrawlControls({ onCrawlComplete }) {
  const [url, setUrl] = useState("");
  const [maxDepth, setMaxDepth] = useState(2);
  const [maxPages, setMaxPages] = useState(10);
  const [strategy, setStrategy] = useState("BFS");

  const [keywords, setKeywords] = useState("");
  const [includeExternal, setIncludeExternal] = useState(false);
  const [verbose, setVerbose] = useState(false);

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
      const keywordList = keywords
        .split(",")
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 0);

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
            include_external: includeExternal,
            keywords:
              strategy === "BestFirst"
                ? keywordList
                : [],
            verbose: verbose,
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

      {/* URL */}
      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(event) =>
          setUrl(event.target.value)
        }
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "12px",
          boxSizing: "border-box",
        }}
      />

      {/* Main crawl settings */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "12px",
          flexWrap: "wrap",
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
          <option value="BestFirst">
            BestFirst
          </option>
        </select>
      </div>

      {/* Best First keywords */}
      {strategy === "BestFirst" && (
        <input
          type="text"
          placeholder="Keywords (comma separated)"
          value={keywords}
          onChange={(event) =>
            setKeywords(event.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            boxSizing: "border-box",
          }}
        />
      )}

      {/* Extra options */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "15px",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={includeExternal}
            onChange={(event) =>
              setIncludeExternal(
                event.target.checked
              )
            }
          />{" "}
          Include External Sites
        </label>

        <label>
          <input
            type="checkbox"
            checked={verbose}
            onChange={(event) =>
              setVerbose(event.target.checked)
            }
          />{" "}
          Verbose Mode
        </label>
      </div>

      {/* Start button */}
      <button
        onClick={startCrawl}
        disabled={loading}
        style={{
          padding: "10px 18px",
          cursor: loading
            ? "not-allowed"
            : "pointer",
        }}
      >
        {loading
          ? "Starting..."
          : "Start Crawl"}
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