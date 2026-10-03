import { useEffect, useState } from "react";

import CrawlGraph from "./components/CrawlGraph";
import CrawlControls from "./components/CrawlControls";

import buildHierarchy from "./utils/buildHierarchy";


function App() {
  const [crawlId, setCrawlId] = useState(null);
  const [graphData, setGraphData] = useState(null);

  const [progress, setProgress] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  function handleCrawlComplete(id) {
    setCrawlId(id);
    setGraphData(null);
    setProgress(null);
    setError(null);
    setLoading(true);
  }


  async function fetchGraph(id) {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/crawls/${id}/graph`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch graph: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Graph data:", data);

      setGraphData(data);
      setLoading(false);

    } catch (err) {
      console.error(
        "Graph fetch error:",
        err
      );

      setError(err.message);
      setLoading(false);
    }
  }


  useEffect(() => {
    if (!crawlId) {
      return;
    }

    let intervalId;


    async function checkProgress() {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/crawls/${crawlId}/progress`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch progress: ${response.status}`
          );
        }

        const data = await response.json();

        console.log("Progress:", data);

        setProgress(data);


        if (data.status === "completed") {
          clearInterval(intervalId);

          await fetchGraph(crawlId);
        }


        if (data.status === "failed") {
          clearInterval(intervalId);

          setLoading(false);

          setError(
            data.error || "Crawl failed."
          );
        }

      } catch (err) {
        console.error(
          "Progress fetch error:",
          err
        );

        clearInterval(intervalId);

        setLoading(false);

        setError(err.message);
      }
    }


    checkProgress();

    intervalId = setInterval(
      checkProgress,
      1000
    );


    return () => {
      clearInterval(intervalId);
    };

  }, [crawlId]);


  /*
   * Convert backend graph data into
   * React Flow nodes and edges.
   *
   * The nodes are then passed through
   * buildHierarchy() so their positions
   * are based on the actual page
   * relationships.
   */

  let nodes = [];
  let edges = [];


  if (graphData) {

    // Convert backend edges
    edges = graphData.edges.map(
      (edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })
    );


    // Create base React Flow nodes
    const baseNodes = graphData.nodes.map(
      (node) => ({
        id: node.id,

        type: "page",

        position: {
          x: 0,
          y: 0,
        },

        data: {
          label: node.label,
          url: node.url,
          depth: node.depth,
          status: node.status,
        },
      })
    );


    // Arrange nodes into hierarchy
    nodes = buildHierarchy(
      baseNodes,
      edges
    );
  }


  const progressPercent =
    progress && progress.max_pages > 0
      ? Math.min(
          (progress.current /
            progress.max_pages) *
            100,
          100
        )
      : 0;


  // Crawl statistics

  const pageCount = graphData
    ? graphData.nodes.length
    : 0;


  const linkCount = graphData
    ? graphData.edges.length
    : 0;


  const maxDepth = graphData
    ? graphData.nodes.reduce(
        (max, node) =>
          Math.max(
            max,
            node.depth || 0
          ),
        0
      )
    : 0;


  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
        background: "#080b14",
        color: "#ffffff",
      }}
    >

      <h1>
        Web Trace
      </h1>


      <CrawlControls
        onCrawlComplete={
          handleCrawlComplete
        }
      />


      {/* Live crawl progress */}

      {loading && progress && (

        <div
          style={{
            padding: "20px",
            marginBottom: "20px",
            background: "#111827",
            borderRadius: "12px",
            color: "#ffffff",
          }}
        >

          <h2
            style={{
              marginTop: 0,
            }}
          >
            Crawling...
          </h2>


          <div
            style={{
              marginBottom: "10px",
              color: "#9ca3af",
            }}
          >
            Pages crawled:{" "}

            <strong
              style={{
                color: "#ffffff",
              }}
            >
              {progress.current}
            </strong>

            {" / "}

            {progress.max_pages}
          </div>


          {/* Progress bar */}

          <div
            style={{
              width: "100%",
              height: "10px",
              background: "#374151",
              borderRadius: "10px",
              overflow: "hidden",
              marginBottom: "14px",
            }}
          >

            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "#2563eb",
                transition:
                  "width 0.4s ease",
              }}
            />

          </div>


          {/* Current page */}

          <div
            style={{
              fontSize: "13px",
              color: "#9ca3af",
              wordBreak: "break-all",
            }}
          >
            Current page:{" "}

            <span
              style={{
                color: "#d1d5db",
              }}
            >
              {progress.url}
            </span>

          </div>

        </div>

      )}


      {/* Error */}

      {error && (

        <div
          style={{
            padding: "14px",
            marginBottom: "20px",
            background: "#3f1d1d",
            color: "#f87171",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>

      )}


      {/* Crawl Summary */}

      {graphData && !loading && (

        <div
          style={{
            marginBottom: "20px",
          }}
        >

          <h2
            style={{
              marginBottom: "14px",
            }}
          >
            Crawl Summary
          </h2>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4, 1fr)",
              gap: "14px",
            }}
          >

            {/* Pages */}

            <div
              style={{
                padding: "18px",
                background: "#111725",
                borderRadius: "12px",
                border:
                  "1px solid #1f2937",
              }}
            >

              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "8px",
                }}
              >
                Pages
              </div>


              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "600",
                }}
              >
                {pageCount}
              </div>

            </div>


            {/* Links */}

            <div
              style={{
                padding: "18px",
                background: "#111725",
                borderRadius: "12px",
                border:
                  "1px solid #1f2937",
              }}
            >

              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "8px",
                }}
              >
                Links
              </div>


              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "600",
                }}
              >
                {linkCount}
              </div>

            </div>


            {/* Depth */}

            <div
              style={{
                padding: "18px",
                background: "#111725",
                borderRadius: "12px",
                border:
                  "1px solid #1f2937",
              }}
            >

              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "8px",
                }}
              >
                Max Depth
              </div>


              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "600",
                }}
              >
                {maxDepth}
              </div>

            </div>


            {/* Status */}

            <div
              style={{
                padding: "18px",
                background: "#111725",
                borderRadius: "12px",
                border:
                  "1px solid #1f2937",
              }}
            >

              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginBottom: "8px",
                }}
              >
                Status
              </div>


              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#4ade80",
                }}
              >
                ✓ Completed
              </div>

            </div>

          </div>


          {/* Crawl information */}

          <div
            style={{
              marginTop: "14px",
              padding: "14px 18px",
              background: "#111725",
              borderRadius: "12px",
              border:
                "1px solid #1f2937",
              fontSize: "13px",
              color: "#9ca3af",
            }}
          >

            <strong
              style={{
                color: "#ffffff",
              }}
            >
              Target:
            </strong>{" "}

            {graphData.crawl_id}

          </div>

        </div>

      )}


      {/* Graph */}

      {graphData && !loading && (

        <CrawlGraph
          key={crawlId}
          initialNodes={nodes}
          initialEdges={edges}
        />

      )}

    </div>
  );
}


export default App;