function buildHierarchyLayout(nodes, edges) {
  if (!nodes.length) {
    return [];
  }

  // Build parent → children relationships
  const childrenMap = {};

  nodes.forEach((node) => {
    childrenMap[node.id] = [];
  });

  edges.forEach((edge) => {
    if (
      childrenMap[edge.source] &&
      childrenMap[edge.target]
    ) {
      childrenMap[edge.source].push(edge.target);
    }
  });


  // Find root nodes.
  // A root is a node that has no incoming edge.
  const hasParent = new Set();

  edges.forEach((edge) => {
    hasParent.add(edge.target);
  });

  let roots = nodes.filter(
    (node) => !hasParent.has(node.id)
  );


  // Fallback if the graph contains a cycle.
  if (!roots.length) {
    roots = [nodes[0]];
  }


  const positions = {};
  const visited = new Set();

  const horizontalSpacing = 280;
  const verticalSpacing = 180;

  let nextX = 0;


  function layoutNode(nodeId, depth) {
    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);

    const children =
      childrenMap[nodeId] || [];


    if (!children.length) {
      positions[nodeId] = {
        x: nextX * horizontalSpacing,
        y: depth * verticalSpacing,
      };

      nextX += 1;

      return;
    }


    const childPositions = [];


    children.forEach((childId) => {
      if (!visited.has(childId)) {
        layoutNode(
          childId,
          depth + 1
        );
      }

      if (positions[childId]) {
        childPositions.push(
          positions[childId]
        );
      }
    });


    if (childPositions.length) {
      const firstX =
        childPositions[0].x;

      const lastX =
        childPositions[
          childPositions.length - 1
        ].x;

      positions[nodeId] = {
        x: (firstX + lastX) / 2,
        y: depth * verticalSpacing,
      };
    } else {
      positions[nodeId] = {
        x: nextX * horizontalSpacing,
        y: depth * verticalSpacing,
      };

      nextX += 1;
    }
  }


  // Layout every root
  roots.forEach((root) => {
    layoutNode(root.id, 0);
  });


  // Handle disconnected nodes
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      layoutNode(
        node.id,
        node.depth || 0
      );
    }
  });


  return nodes.map((node) => ({
    ...node,
    position: positions[node.id] || {
      x: 0,
      y: 0,
    },
  }));
}


export default buildHierarchyLayout;