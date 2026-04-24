# Trelix: Hierarchical Vector Synthesis Engine

Trelix is a specialized graph processing and visualization platform designed for the SRM Full-Stack Engineering Challenge. It implements the BFHL protocol to process complex edge vectors, synthesize hierarchical data structures, and provide a high-fidelity visual interface for graph analysis.

## API Documentation (BFHL Protocol)

The system fully adheres to the BFHL specification, providing a unified interface for data processing and retrieval.

### API Endpoints
- **GET `/api/bfhl`**: Returns a static operation code (1) as per the challenge requirement.
- **POST `/api/bfhl`**: Processes an array of edge vectors and returns a structured hierarchical analysis.

### Response Schema
Every successful POST request returns:
- `user_id`: Unique identifier (kaveen_krithik_kandan_11012006)
- `email`: kk7310@srmist.edu.in
- `roll_number`: RA2311033010019
- `hierarchies`: An array of processed tree objects with root identification and depth calculation.
- `invalid_entries`: Filtered list of malformed strings.
- `duplicate_edges`: List of redundant vectors encountered during synthesis.
- `summary`: High-level metrics including total trees, cycle counts, and the largest tree root.

## Additional Feature: Interactive Vector Synthesis

Beyond the standard API requirements, Trelix includes a sophisticated frontend engine that transforms raw JSON output into an interactive, node-based workspace.

- **Multi-Canvas Visualization**: Each detected hierarchy is rendered on its own interactive canvas using React Flow, allowing for spatial exploration of complex trees.
- **Cycle and Conflict Resolution**: The engine detects and visualizes cycles (back-edges) and enforces the "Diamond Rule" (single-parent hierarchy) in real-time.
- **Vector Health Scoring**: A custom algorithm evaluates the integrity of the input data based on valid entries, cycle absence, and redundancy levels.
- **Real-Time History Memory**: Local storage integration to track and compare previous synthesis operations.

## Architecture

Trelix is built with a decoupled, dual-backend architecture to ensure both high performance and deployment flexibility.

### Tech Stack
- **Frontend**: Next.js 16 (App Router) with Tailwind CSS.
- **Visualization**: @xyflow/react (React Flow) for graph rendering.
- **Animations**: Framer Motion for micro-interactions and state transitions.
- **Backends**: 
  - **Serverless**: Next.js API Routes for edge-compatible processing.
  - **Standalone**: Node.js/Express server for legacy environment support.

### System Design
1. **Adjacency Synthesis**: Raw strings are parsed into a directed adjacency list.
2. **Component Isolation**: Union-Find algorithm groups connected nodes into discrete sub-graphs.
3. **Cycle Detection**: Depth-First Search (DFS) identifies back-edges to prevent infinite recursion during tree building.
4. **Hierarchical Extraction**: Recursive descent builds nested tree objects, calculating maximum depth and identifying root nodes (in-degree = 0).

## How it Works

1. **Input Parsing**: The user provides a comma-separated list of vectors (e.g., `A->B, B->C`).
2. **Validation**: The engine filters out self-loops, malformed strings, and numeric pointers.
3. **Synthesis**: The processing pipeline builds the graph, resolves conflicts, and generates the hierarchical JSON.
4. **Rendering**: The frontend maps the JSON structure to a set of React Flow nodes and edges, applying a hierarchical layout for optimal readability.

## Screenshots

### 1. Vector Analyzer
The primary interface for inputting edge vectors and viewing real-time health metrics.

### 2. Hierarchical Visualizer
The interactive workspace where processed trees are rendered with dynamic layouts and export capabilities.

### 3. API Interface (Playground)
A built-in utility to test the BFHL endpoint directly within the browser, providing raw JSON feedback and status codes.

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/trelix.git

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Standalone Backend
If you require the Express server without the Next.js frontend:
```bash
npm run server
```

## Deployment

The project is optimized for Vercel (Next.js) and Render (Express).

1. **Frontend + API**: Deploy the entire root to Vercel. It will automatically detect the Next.js framework and host the API at `/api/bfhl`.
2. **Backend Only**: Deploy to Render using the command `npm run server`. Ensure the `PORT` environment variable is configured if necessary.

---

**Author:** Kaveen Krithik Kandan  
**License:** MIT
