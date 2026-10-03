import { useEffect, useState } from "react";

import CrawlGraph from "./components/CrawlGraph";
import CrawlControls from "./components/CrawlControls";


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


        if (
          data.status === "completed"
        ) {
          clearInterval(intervalId);

          await fetchGraph(crawlId);
        }


        if (
          data.status === "failed"
        ) {
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


  let nodes = [];
  let edges = [];


  if (graphData) {

    nodes = graphData.nodes.map(
      (node, index) => ({
        id: node.id,

        type: "page",

        position: {
          x: (index % 3) * 300,
          y: Math.floor(index / 3) * 200,
        },

        data: {
          label: node.label,
          url: node.url,
          depth: node.depth,
          status: node.status,
        },
      })
    );


    edges = graphData.edges.map(
      (edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      })
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


  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
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


      {loading &&
        progress && (

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


            <div
              style={{
                fontSize: "13px",
                color: "#9ca3af",
                wordBreak:
                  "break-all",
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
        )
      }


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


      {graphData &&
        !loading && (

          <CrawlGraph
            key={crawlId}
            initialNodes={nodes}
            initialEdges={edges}
          />

        )
      }

    </div>
  );
}


export default App;