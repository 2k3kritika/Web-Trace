import { useEffect, useState } from "react";

import CrawlGraph from "./components/CrawlGraph";
import CrawlControls from "./components/CrawlControls";


function App() {
  const [crawlId, setCrawlId] = useState(null);
  const [graphData, setGraphData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  async function fetchGraph(id) {
    setLoading(true);
    setError(null);

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
    } catch (err) {
      console.error("Graph fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  function handleCrawlComplete(id) {
    setCrawlId(id);
  }


  useEffect(() => {
    if (crawlId) {
      fetchGraph(crawlId);
    }
  }, [crawlId]);


  let nodes = [];
  let edges = [];


  if (graphData) {
    nodes = graphData.nodes.map((node, index) => ({
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
    }));


    edges = graphData.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));
  }


  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <h1>Web Trace</h1>

      <CrawlControls
        onCrawlComplete={handleCrawlComplete}
      />


      {loading && (
        <h3>
          Loading crawl graph...
        </h3>
      )}


      {error && (
        <p style={{ color: "#f87171" }}>
          {error}
        </p>
      )}


      {graphData && !loading && (
        <CrawlGraph
          initialNodes={nodes}
          initialEdges={edges}
        />
      )}
    </div>
  );
}


export default App;