function PageDetails({ node, onClose }) {
  if (!node) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        width: "320px",
        padding: "20px",
        background: "#111827",
        color: "#ffffff",
        border: "1px solid #374151",
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
          }}
        >
          Page Details
        </h2>

        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#9ca3af",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <strong>Title</strong>

        <div
          style={{
            marginTop: "4px",
            color: "#d1d5db",
          }}
        >
          {node.data.label}
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <strong>URL</strong>

        <div
          style={{
            marginTop: "4px",
            color: "#9ca3af",
            fontSize: "13px",
            wordBreak: "break-word",
          }}
        >
          {node.data.url}
        </div>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <strong>Depth</strong>

        <div
          style={{
            marginTop: "4px",
            color: "#d1d5db",
          }}
        >
          {node.data.depth}
        </div>
      </div>

      <div style={{ marginBottom: "18px" }}>
        <strong>Status</strong>

        <div
          style={{
            marginTop: "4px",
            color:
              node.data.status === "success"
                ? "#4ade80"
                : "#f87171",
          }}
        >
          {node.data.status}
        </div>
      </div>

      <a
        href={node.data.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          textAlign: "center",
          padding: "10px",
          background: "#2563eb",
          color: "#ffffff",
          textDecoration: "none",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        Open Page
      </a>
    </div>
  );
}

export default PageDetails;