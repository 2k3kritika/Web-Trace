import {
  useCallback,
  useEffect,
  useState,
} from "react";

import PageDetails from "./PageDetails";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import PageNode from "./PageNode";

function CrawlGraph({
  initialNodes = [],
  initialEdges = [],
}) {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const [selectedNode, setSelectedNode] =
    useState(null);

  /*
   * Update React Flow whenever new crawl
   * nodes arrive from the backend.
   */
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  /*
   * Update React Flow whenever new crawl
   * edges arrive from the backend.
   */
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const onNodeClick = useCallback(
    (event, node) => {
      setSelectedNode(node);
    },
    []
  );

  const onConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) =>
        addEdge(connection, currentEdges)
      );
    },
    [setEdges]
  );

  const nodeTypes = {
    page: PageNode,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "700px",
        position: "relative",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <PageDetails
        node={selectedNode}
        onClose={() =>
          setSelectedNode(null)
        }
      />
    </div>
  );
}

export default CrawlGraph;