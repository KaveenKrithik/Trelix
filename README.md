# Trelix: Hierarchical Vector Synthesis Engine

Trelix is a high-performance graph processing engine and visualization suite. Built to handle complex directed edge vectors, it synthesizes hierarchical data structures, detects circular dependencies, and provides an interactive visual workspace for architectural analysis.

---

## Key Features

### 1. Vector Synthesis & Health Analysis
The core engine parses raw vector strings (e.g., `A->B`) into a validated directed graph. It automatically filters invalid entries and identifies duplicate edges while calculating a real-time "Health Score" for the input dataset.

![Trelix Analyzer Interface](./screenshot_analyzer.png)

### 2. Hierarchical Visualizer
Using a specialized rendering engine, Trelix transforms abstract JSON data into interactive tree hierarchies. Each connected component is isolated and rendered on its own canvas, allowing for deep exploration of multi-tree systems.

![Trelix System Visualizer](./screenshot_visualizer.png)

### 3. Integrated API Playground
A built-in developer interface allows for direct interaction with the Trelix API (BFHL Protocol). Test request payloads, view raw JSON responses, and monitor system performance without leaving the application.

![Trelix API Playground](./screenshot_playground.png)

---

## Technical Architecture

Trelix uses a modern, decoupled architecture designed for speed and flexibility.

### Core Engine (BFHL Protocol)
- **Cycle Detection**: Implements a DFS-based algorithm (White/Gray/Black coloring) to identify back-edges and circular dependencies.
- **Diamond Rule Resolution**: Enforces single-parent hierarchy; if a node is assigned a second parent, the synthesis engine resolves the conflict by prioritizing the initial entry.
- **Component Isolation**: Uses a Union-Find (Disjoint Set Union) algorithm to group connected nodes into discrete hierarchies.

### Tech Stack
- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Framer Motion.
- **Graph Rendering**: @xyflow/react for interactive canvas management.
- **Backend**: Hybrid deployment support with Next.js API Routes and a standalone Express server.

---

## Getting Started

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/trelix.git

# Install dependencies
npm install

# Run development server
npm run dev
```

### API Endpoints
- **GET `/api/bfhl`**: Returns system operation status.
- **POST `/api/bfhl`**: Core synthesis endpoint. Requires a JSON body with a `data` array of strings.

---

## Author
**Kaveen Krithik Kandan**  
Roll: RA2311033010019  
Email: kk7310@srmist.edu.in
