import { useCallback, useState } from "react";
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


function CrawlGraph({ initialNodes = [], initialEdges = [] }) {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [selectedNode, setSelectedNode] = useState(null);

  const onNodeClick = useCallback((event, node) => {
  setSelectedNode(node);
   }, []);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState(initialEdges);

  const nodeTypes = {
    page: PageNode,
  };


  const onConnect = useCallback(
    (connection) => {
      setEdges((currentEdges) =>
        addEdge(connection, currentEdges)
      );
    },
    [setEdges]
  );


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
      onClose={() => setSelectedNode(null)}
    />
  </div>
);
}


export default CrawlGraph;