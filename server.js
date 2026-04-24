// ─────────────────────────────────────────────────────────────────────────────
// BFHL Challenge — Standalone Express Server
// Author: Kaveen Krithik Kandan  |  kk7310@srmist.edu.in
//
// This file fulfils the challenge requirement for a standalone Express backend.
// The same processing logic also runs inside the Next.js API route.
// ─────────────────────────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Constants ────────────────────────────────────────────────────────────────
const USER_ID = "kaveen_krithik_kandan_11012006";
const EMAIL_ID = "kk7310@srmist.edu.in";
const COLLEGE_ROLL = "RA2311033010019";
const EDGE_REGEX = /^[A-Z]->[A-Z]$/;

// ── ROUTES ───────────────────────────────────────────────────────────────────

app.get("/bfhl", (req, res) => {
  res.status(200).json({ operation_code: 1 });
});

app.post("/bfhl", (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: '"data" must be an array of strings.' });
    }

    const result = processBFHL(data);
    res.json(result);
  } catch (err) {
    console.error("Error processing /bfhl:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ── Processing Logic ─────────────────────────────────────────────────────────

function processBFHL(data) {
  // STEP 1 — Trim & Validate
  const invalidEntries = [];
  const validEntries = [];

  for (const raw of data) {
    const entry = typeof raw === "string" ? raw.trim() : String(raw).trim();

    if (!EDGE_REGEX.test(entry)) {
      invalidEntries.push(entry);
      continue;
    }

    const [parent, child] = entry.split("->");

    if (parent === child) {
      invalidEntries.push(entry);
      continue;
    }

    validEntries.push({ parent, child, raw: entry });
  }

  // STEP 2 — Deduplicate
  const seen = new Set();
  const duplicateEdges = [];
  const uniqueEdges = [];

  for (const edge of validEntries) {
    if (seen.has(edge.raw)) {
      if (!duplicateEdges.includes(edge.raw)) {
        duplicateEdges.push(edge.raw);
      }
    } else {
      seen.add(edge.raw);
      uniqueEdges.push(edge);
    }
  }

  // STEP 3 — Build Adjacency (diamond rule)
  const parentMap = {};
  const childrenMap = {};
  const allNodes = new Set();

  for (const { parent, child } of uniqueEdges) {
    allNodes.add(parent);
    allNodes.add(child);

    if (parentMap[child] !== undefined) continue;

    parentMap[child] = parent;
    if (!childrenMap[parent]) childrenMap[parent] = [];
    childrenMap[parent].push(child);
  }

  // STEP 4 — Find Roots
  const roots = [];
  for (const node of allNodes) {
    if (parentMap[node] === undefined) roots.push(node);
  }

  // STEP 5 — Union-Find
  const uf = {};
  const find = (x) => {
    if (uf[x] === undefined) uf[x] = x;
    if (uf[x] !== x) uf[x] = find(uf[x]);
    return uf[x];
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      if (ra < rb) uf[rb] = ra;
      else uf[ra] = rb;
    }
  };

  for (const { parent, child } of uniqueEdges) {
    if (parentMap[child] === parent) union(parent, child);
  }

  const components = {};
  for (const node of allNodes) {
    const rep = find(node);
    if (!components[rep]) components[rep] = new Set();
    components[rep].add(node);
  }

  // STEP 6 & 7 — Process each component
  const hierarchies = [];

  for (const nodes of Object.values(components)) {
    const compRoots = [...nodes].filter((n) => parentMap[n] === undefined);
    const hasCycle = detectCycle(compRoots, nodes, childrenMap);

    if (hasCycle) {
      const root = compRoots.length > 0 ? compRoots.sort()[0] : [...nodes].sort()[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      const root = compRoots.sort()[0];
      const tree = buildTree(root, childrenMap);
      const depth = calcDepth(tree);
      hierarchies.push({ root, tree, depth });
    }
  }

  hierarchies.sort((a, b) => a.root.localeCompare(b.root));

  // STEP 8 — Summary
  const totalTrees = hierarchies.filter((h) => h.depth !== undefined).length;
  const totalCycles = hierarchies.filter((h) => h.has_cycle).length;

  let largestTreeRoot = null;
  let maxDepth = -1;
  for (const h of hierarchies) {
    if (h.depth !== undefined) {
      if (h.depth > maxDepth || (h.depth === maxDepth && h.root < largestTreeRoot)) {
        maxDepth = h.depth;
        largestTreeRoot = h.root;
      }
    }
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary: {
      total_trees: totalTrees,
      total_cycles: totalCycles,
      largest_tree_root: largestTreeRoot,
    },
  };
}

function detectCycle(roots, allNodes, childrenMap) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};
  for (const n of allNodes) color[n] = WHITE;

  function dfs(node) {
    color[node] = GRAY;
    for (const child of childrenMap[node] || []) {
      if (color[child] === GRAY) return true;
      if (color[child] === WHITE && dfs(child)) return true;
    }
    color[node] = BLACK;
    return false;
  }

  for (const r of roots) {
    if (color[r] === WHITE && dfs(r)) return true;
  }
  for (const n of allNodes) {
    if (color[n] === WHITE && dfs(n)) return true;
  }
  return false;
}

function buildTree(node, childrenMap) {
  const inner = {};
  for (const child of childrenMap[node] || []) {
    const subtree = buildTree(child, childrenMap);
    inner[child] = subtree[child];
  }
  return { [node]: inner };
}

function calcDepth(tree) {
  function walk(obj) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return 0;
    let max = 0;
    for (const k of keys) {
      max = Math.max(max, walk(obj[k]));
    }
    return 1 + max;
  }
  return walk(tree);
}

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`BFHL server running on http://localhost:${PORT}`);
});
