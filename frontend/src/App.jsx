import { useEffect, useState } from "react";

import CrawlGraph from "./components/CrawlGraph";
import CrawlControls from "./components/CrawlControls";
import buildHierarchy from "./utils/buildHierarchy";


const API_URL = "http://127.0.0.1:8000";


function App() {
  const [crawlId, setCrawlId] = useState(null);

  const [graphData, setGraphData] = useState({
    crawl_id: null,
    nodes: [],
    edges: [],
  });

  const [progress, setProgress] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);


  // ---------------------------------------------------------
  // Start a new crawl
  // ---------------------------------------------------------

  function handleCrawlComplete(id) {
    setCrawlId(id);

    setGraphData({
      crawl_id: id,
      nodes: [],
      edges: [],
    });

    setProgress({
      current: 0,
      max_pages: 0,
      url: "",
      status: "pending",
    });

    setError(null);
    setLoading(true);
  }


  // ---------------------------------------------------------
  // Fetch graph data
  // ---------------------------------------------------------

  async function fetchGraph(id) {
    try {
      const response = await fetch(
        `${API_URL}/api/crawls/${id}/graph`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setGraphData(data);

    } catch (err) {
      console.error(
        "Graph fetch error:",
        err
      );
    }
  }


  // ---------------------------------------------------------
  // Monitor crawl progress + graph
  // ---------------------------------------------------------

  useEffect(() => {
    if (!crawlId) {
      return;
    }

    let stopped = false;
    let interval = null;


    async function updateCrawl() {
      try {

        // ---------------------------------------------
        // Fetch progress
        // ---------------------------------------------

        const progressResponse =
          await fetch(
            `${API_URL}/api/crawls/${crawlId}/progress`
          );

        if (!progressResponse.ok) {
          return;
        }

        const progressData =
          await progressResponse.json();


        if (stopped) {
          return;
        }


        setProgress(progressData);


        // ---------------------------------------------
        // Fetch latest graph
        // ---------------------------------------------

        await fetchGraph(crawlId);


        if (stopped) {
          return;
        }


        // ---------------------------------------------
        // Crawl completed
        // ---------------------------------------------

        if (
          progressData.status ===
          "completed"
        ) {
          setLoading(false);

          stopped = true;

          if (interval) {
            clearInterval(interval);
            interval = null;
          }

          return;
        }


        // ---------------------------------------------
        // Crawl failed
        // ---------------------------------------------

        if (
          progressData.status ===
          "failed"
        ) {
          setLoading(false);

          setError(
            progressData.error ||
              "Crawl failed."
          );

          stopped = true;

          if (interval) {
            clearInterval(interval);
            interval = null;
          }

          return;
        }

      } catch (err) {

        console.error(
          "Progress fetch error:",
          err
        );

      }
    }


    // ---------------------------------------------
    // Run immediately
    // ---------------------------------------------

    updateCrawl();


    // ---------------------------------------------
    // Continue checking while crawl is active
    // ---------------------------------------------

    interval = setInterval(
      updateCrawl,
      500
    );


    // ---------------------------------------------
    // Cleanup
    // ---------------------------------------------

    return () => {
      stopped = true;

      if (interval) {
        clearInterval(interval);
      }
    };

  }, [crawlId]);


  // ---------------------------------------------------------
  // Build hierarchy layout
  // ---------------------------------------------------------

  let nodes = [];
  let edges = [];


  if (graphData) {

    // ---------------------------------------------
    // Convert edges
    // ---------------------------------------------

    edges = (
      graphData.edges || []
    ).map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));


    // ---------------------------------------------
    // Convert backend nodes
    // ---------------------------------------------

    const baseNodes = (
      graphData.nodes || []
    ).map((node) => ({
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
    }));


    // ---------------------------------------------
    // Build hierarchical layout
    // ---------------------------------------------

    nodes = buildHierarchy(
      baseNodes,
      edges
    );
  }


  // ---------------------------------------------------------
  // Download ZIP
  // ---------------------------------------------------------

  function downloadCrawl() {
    if (!crawlId) {
      return;
    }

    window.open(
      `${API_URL}/api/crawls/${crawlId}/download`,
      "_blank"
    );
  }


  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080B14",
        color: "#ffffff",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >

      {/* Header */}

      <div
        style={{
          marginBottom: "25px",
        }}
      >

        <h1
          style={{
            margin: 0,
            marginBottom: "8px",
          }}
        >
          Web Trace
        </h1>


        <p
          style={{
            margin: 0,
            color: "#9ca3af",
          }}
        >
          Website crawler and visual site map
        </p>

      </div>


      {/* Crawl controls */}

      <CrawlControls
        onCrawlComplete={
          handleCrawlComplete
        }
      />


      {/* Error */}

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "20px",
            background: "#3f1d1d",
            border: "1px solid #7f1d1d",
            borderRadius: "8px",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}


      {/* Crawl progress */}

      {progress && (
        <div
          style={{
            padding: "18px",
            background: "#111725",
            borderRadius: "12px",
            marginBottom: "20px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >

            <strong>
              {progress.status ===
              "completed"
                ? "Crawl Completed"
                : progress.status ===
                  "failed"
                ? "Crawl Failed"
                : "Crawling..."}
            </strong>


            <span
              style={{
                color: "#9ca3af",
              }}
            >
              {progress.current || 0}
              {" / "}
              {progress.max_pages || 0}
              {" pages"}
            </span>

          </div>


          {/* Progress bar */}

          <div
            style={{
              width: "100%",
              height: "8px",
              background: "#1f2937",
              borderRadius: "999px",
              overflow: "hidden",
              marginBottom: "12px",
            }}
          >

            <div
              style={{
                width:
                  progress.max_pages > 0
                    ? `${Math.min(
                        100,
                        (
                          progress.current /
                          progress.max_pages
                        ) * 100
                      )}%`
                    : "0%",

                height: "100%",

                background:
                  "#6366f1",

                transition:
                  "width 0.3s ease",
              }}
            />

          </div>


          {/* Current URL */}

          {progress.url && (
            <div
              style={{
                fontSize: "13px",
                color: "#9ca3af",
                overflow: "hidden",
                textOverflow:
                  "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Current page:{" "}
              {progress.url}
            </div>
          )}

        </div>
      )}


      {/* Live graph */}

      {graphData.nodes &&
        graphData.nodes.length > 0 && (
          <div
            style={{
              background: "#0D111C",
              borderRadius: "12px",
              padding: "10px",
              marginBottom: "20px",
            }}
          >

            <div
              style={{
                padding:
                  "10px 14px",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >

              <h2
                style={{
                  margin: 0,
                }}
              >
                Crawl Graph
              </h2>


              <span
                style={{
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                {nodes.length} pages
                {" • "}
                {edges.length} links
              </span>

            </div>


            <CrawlGraph
              initialNodes={nodes}
              initialEdges={edges}
            />

          </div>
        )}


      {/* Empty state */}

      {!loading &&
        (!graphData.nodes ||
          graphData.nodes.length ===
            0) &&
        !error && (
          <div
            style={{
              padding: "50px 20px",
              textAlign: "center",
              color: "#6b7280",
              background: "#0D111C",
              borderRadius: "12px",
            }}
          >
            Enter a URL above to start
            crawling.
          </div>
        )}


      {/* Summary */}

      {graphData.nodes &&
        graphData.nodes.length > 0 &&
        !loading && (
          <div
            style={{
              padding: "20px",
              background: "#111725",
              borderRadius: "12px",
              marginBottom: "20px",
            }}
          >

            <h2
              style={{
                marginTop: 0,
              }}
            >
              Crawl Summary
            </h2>


            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "12px",
              }}
            >

              {/* Pages */}

              <div>
                <strong>
                  Pages
                </strong>

                <div
                  style={{
                    color: "#9ca3af",
                    marginTop: "4px",
                  }}
                >
                  {graphData.nodes.length}
                </div>
              </div>


              {/* Links */}

              <div>
                <strong>
                  Links
                </strong>

                <div
                  style={{
                    color: "#9ca3af",
                    marginTop: "4px",
                  }}
                >
                  {graphData.edges.length}
                </div>
              </div>


              {/* Max Depth */}

              <div>
                <strong>
                  Max Depth
                </strong>

                <div
                  style={{
                    color: "#9ca3af",
                    marginTop: "4px",
                  }}
                >
                  {graphData.nodes.length > 0
                    ? Math.max(
                        ...graphData.nodes.map(
                          (node) =>
                            node.depth || 0
                        )
                      )
                    : 0}
                </div>
              </div>


              {/* Status */}

              <div>
                <strong>
                  Status
                </strong>

                <div
                  style={{
                    color:
                      progress?.status ===
                      "completed"
                        ? "#4ade80"
                        : progress?.status ===
                          "failed"
                        ? "#f87171"
                        : "#facc15",

                    marginTop: "4px",
                  }}
                >
                  {progress?.status ===
                  "completed"
                    ? "Completed"
                    : progress?.status ===
                      "failed"
                    ? "Failed"
                    : "In Progress"}
                </div>
              </div>

            </div>


            {/* Download */}

            <button
              onClick={downloadCrawl}
              style={{
                marginTop: "20px",
                padding: "10px 18px",
                border: "none",
                borderRadius: "8px",
                background: "#4f46e5",
                color: "#ffffff",
                cursor: "pointer",
              }}
            >
              Download Crawl ZIP
            </button>

          </div>
        )}

    </div>
  );
}

export default App;