// ─────────────────────────────────────────────────────────────────────────────
// BFHL Core Processing Logic - Standardized Edition
// ─────────────────────────────────────────────────────────────────────────────

const USER_ID = "kaveen_krithik_kandan_11012006";
const EMAIL_ID = "kk7310@srmist.edu.in";
const COLLEGE_ROLL = "RA2311033010019";
const EDGE_REGEX = /^[A-Z]->[A-Z]$/;

/**
 * Standardized processing logic to match the requested output format.
 */
export function processBFHL(data) {
  const invalid_entries = [];
  const valid_edges = [];
  const seen_raw = new Set();
  const duplicate_edges = [];
  const all_nodes = new Set();
  
  // 1. Validation & Deduplication
  for (const raw of data) {
    const entry = typeof raw === "string" ? raw.trim() : String(raw).trim();

    if (!EDGE_REGEX.test(entry)) {
      invalid_entries.push(entry);
      continue;
    }

    const [p, c] = entry.split("->");

    if (p === c) {
      invalid_entries.push(entry);
      continue;
    }

    if (seen_raw.has(entry)) {
      if (!duplicate_edges.includes(entry)) duplicate_edges.push(entry);
      continue;
    }

    seen_raw.add(entry);
    all_nodes.add(p);
    all_nodes.add(c);
    valid_edges.push({ p, c, raw: entry });
  }

  // 2. Build Adjacency
  const parent_map = new Map();
  const children_map = new Map();

  for (const { p, c } of valid_edges) {
    if (parent_map.has(c)) continue; // First parent wins
    parent_map.set(c, p);
    if (!children_map.has(p)) children_map.set(p, []);
    children_map.get(p).push(c);
  }

  // 3. Find Connected Components using Union-Find
  const uf = new Map();
  const find = (x) => {
    if (!uf.has(x)) uf.set(x, x);
    if (uf.get(x) !== x) uf.set(x, find(uf.get(x)));
    return uf.get(x);
  };
  const union = (a, b) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) uf.set(rb, ra);
  };

  for (const { p, c } of valid_edges) {
    if (parent_map.get(c) === p) union(p, c);
  }

  const component_map = new Map();
  for (const node of all_nodes) {
    const rep = find(node);
    if (!component_map.has(rep)) component_map.set(rep, []);
    component_map.get(rep).push(node);
  }

  // 4. Process Components
  const hierarchies = [];
  for (const nodes of component_map.values()) {
    const roots = nodes.filter(n => !parent_map.has(n)).sort();
    const has_cycle = detectCycle(roots, nodes, children_map);

    if (has_cycle) {
      const root = roots[0] || nodes.sort()[0];
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else if (roots.length > 0) {
      const root = roots[0];
      const tree = buildNestedTree(root, children_map);
      const depth = calculateDepth(tree[root]);
      hierarchies.push({ root, tree, depth: depth + 1 });
    }
  }

  hierarchies.sort((a, b) => a.root.localeCompare(b.root));

  // 5. Summary
  const total_trees = hierarchies.filter(h => !h.has_cycle).length;
  const total_cycles = hierarchies.filter(h => h.has_cycle).length;
  let largest_tree_root = null, max_depth = -1;
  
  for (const h of hierarchies) {
    if (!h.has_cycle && h.depth > max_depth) {
      max_depth = h.depth;
      largest_tree_root = h.root;
    }
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root
    }
  };
}

function detectCycle(roots, nodes, children_map) {
  const visited = new Set(), stack = new Set();
  const dfs = (n) => {
    visited.add(n);
    stack.add(n);
    for (const c of (children_map.get(n) || [])) {
      if (!visited.has(c)) { if (dfs(c)) return true; }
      else if (stack.has(c)) return true;
    }
    stack.delete(n);
    return false;
  };
  for (const r of roots) if (dfs(r)) return true;
  for (const n of nodes) if (!visited.has(n) && dfs(n)) return true;
  return false;
}

function buildNestedTree(node, children_map) {
  const inner = {};
  for (const c of (children_map.get(node) || [])) {
    const subtree = buildNestedTree(c, children_map);
    Object.assign(inner, subtree);
  }
  return { [node]: inner };
}

function calculateDepth(tree) {
  const keys = Object.keys(tree);
  if (keys.length === 0) return 0;
  let max = 0;
  for (const k of keys) {
    max = Math.max(max, calculateDepth(tree[k]));
  }
  return 1 + max;
}
