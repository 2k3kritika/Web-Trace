import { Handle, Position } from "@xyflow/react";

function PageNode({ data }) {
  return (
    <div
      style={{
        width: "220px",
        padding: "14px",
        border: "1px solid #444",
        borderRadius: "10px",
        background: "#111827",
        color: "#ffffff",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
      />

      <div
        style={{
          fontSize: "15px",
          fontWeight: "600",
          marginBottom: "8px",
        }}
      >
        🌐 {data.label}
      </div>

      <div
        style={{
          fontSize: "11px",
          color: "#9ca3af",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {data.url}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
          fontSize: "11px",
        }}
      >
        <span>
          Depth: {data.depth}
        </span>

        <span>
          {data.status === "success" ? "✓ success" : "✕ failed"}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
      />
    </div>
  );
}

export default PageNode;