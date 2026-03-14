export function buildGraph(floorMap, avoidStairs = false) {
  const graph = {};
  Object.keys(floorMap.nodes).forEach((nodeId) => { graph[nodeId] = []; });
  floorMap.edges.forEach((edge) => {
    const fromNode = floorMap.nodes[edge.from];
    const toNode = floorMap.nodes[edge.to];
    if (avoidStairs && (fromNode.type === 'stairs' || toNode.type === 'stairs')) return;
    graph[edge.from].push({ node: edge.to, distance: edge.distance });
    graph[edge.to].push({ node: edge.from, distance: edge.distance });
  });
  return graph;
}

function heuristic(floorMap, nodeA, nodeB) {
  const a = floorMap.nodes[nodeA];
  const b = floorMap.nodes[nodeB];
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function findPath(floorMap, startId, endId, avoidStairs = false) {
  const graph = buildGraph(floorMap, avoidStairs);
  const openSet = new Set([startId]);
  const cameFrom = {};
  const gScore = {};
  const fScore = {};

  Object.keys(floorMap.nodes).forEach((id) => {
    gScore[id] = Infinity;
    fScore[id] = Infinity;
  });

  gScore[startId] = 0;
  fScore[startId] = heuristic(floorMap, startId, endId);

  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;
    openSet.forEach((id) => {
      if (fScore[id] < lowestF) { lowestF = fScore[id]; current = id; }
    });

    if (current === endId) {
      const path = [];
      let node = endId;
      while (node) { path.unshift(node); node = cameFrom[node]; }
      return path;
    }

    openSet.delete(current);
    graph[current].forEach((neighbor) => {
      const tentativeG = gScore[current] + neighbor.distance;
      if (tentativeG < gScore[neighbor.node]) {
        cameFrom[neighbor.node] = current;
        gScore[neighbor.node] = tentativeG;
        fScore[neighbor.node] = tentativeG + heuristic(floorMap, neighbor.node, endId);
        openSet.add(neighbor.node);
      }
    });
  }
  return null;
}

export function generateInstructions(floorMap, path) {
  if (!path || path.length === 0) return [];
  const instructions = [];

  for (let i = 0; i < path.length - 1; i++) {
    const current = floorMap.nodes[path[i]];
    const next = floorMap.nodes[path[i + 1]];
    const edge = floorMap.edges.find(
      (e) => (e.from === path[i] && e.to === path[i + 1]) || (e.from === path[i + 1] && e.to === path[i])
    );
    const distance = edge ? edge.distance : 0;
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : 'forward';

    if (next.type === 'stairs') {
      instructions.push(`In ${distance} steps, you will reach the staircase. There are ${next.steps} steps going ${next.direction}. Say "avoid stairs" to reroute via elevator.`);
    } else if (next.type === 'elevator') {
      instructions.push(`Walk ${distance} steps to reach the elevator.`);
    } else if (i === 0) {
      instructions.push(`Starting navigation. Walk ${distance} steps ${direction}.`);
    } else {
      instructions.push(`Turn ${direction} and walk ${distance} steps towards ${next.label}.`);
    }
  }

  const destination = floorMap.nodes[path[path.length - 1]];
  instructions.push(`You have arrived at your destination: ${destination.label}.`);
  return instructions;
}

export function matchDestination(floorMap, voiceInput) {
  const input = voiceInput.toLowerCase().trim();
  if (floorMap.shortcuts[input]) return floorMap.shortcuts[input];
  for (const node of Object.values(floorMap.nodes)) {
    if (node.label.toLowerCase().includes(input) || input.includes(node.label.toLowerCase())) {
      return node.id;
    }
  }
  return null;
}