"use client";

import React, { useMemo, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';

// --- Premium Trelix Node (The "First" High-Fidelity Look) ---
const TrelixNode = ({ data }) => {
  const { isRoot, isLeaf, isCycle, label } = data;

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-8 py-5 rounded-[2.5rem] border-[3px] transition-all duration-500 shadow-2xl flex flex-col items-center justify-center min-w-[180px] relative overflow-hidden backdrop-blur-2xl ${
        isRoot 
          ? "bg-blue-600/40 border-blue-400 text-blue-50 shadow-[0_0_50px_rgba(59,130,246,0.5)]" 
          : isCycle 
            ? "bg-red-600/40 border-red-500 text-red-50 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse"
            : isLeaf
              ? "bg-emerald-600/40 border-emerald-500 text-emerald-50 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
              : "bg-zinc-800/60 border-zinc-700 text-zinc-100"
      }`}
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-3 !h-3 !border-none" />
      <div className="flex flex-col items-center gap-1 z-10">
        <span className="text-xl font-black uppercase tracking-tighter">{label}</span>
        <div className="flex gap-2 mt-1">
           {isRoot && <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-white/20 rounded-full">Origin</span>}
           {isLeaf && !isRoot && <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-white/10 rounded-full">Leaf</span>}
           {isCycle && <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-red-500/40 rounded-full">Cycle</span>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-400 !w-3 !h-3 !border-none" />
    </motion.div>
  );
};

const nodeTypes = {
  trelix: TrelixNode,
};

function VisualizerContent({ hierarchies }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodesList = [];
    const edgesList = [];
    let currentX = 0;

    // A more accurate layout engine that calculates subtree width
    const getSubtreeWidth = (tree) => {
      const children = Object.keys(tree);
      if (children.length === 0) return 300;
      return children.reduce((acc, child) => acc + getSubtreeWidth(tree[child]), 0);
    };

    hierarchies.forEach((h, hIdx) => {
      const treeWidth = h.has_cycle ? 400 : getSubtreeWidth(h.tree);
      
      const traverse = (nodeName, tree, level = 0, xStart = 0) => {
        const id = `node-${hIdx}-${nodeName}`;
        const children = Object.keys(tree);
        const isRoot = nodeName === h.root;
        const isLeaf = children.length === 0;

        // Center parent over its children
        const width = getSubtreeWidth(tree);
        const x = xStart + width / 2;
        const y = level * 280;

        nodesList.push({
          id,
          type: 'trelix',
          data: { label: nodeName, isRoot, isLeaf, isCycle: h.has_cycle },
          position: { x, y },
        });

        let childX = xStart;
        children.forEach((child) => {
          const childId = `node-${hIdx}-${child}`;
          const childWidth = getSubtreeWidth(tree[child]);
          
          edgesList.push({
            id: `edge-${id}-${childId}`,
            source: id,
            target: childId,
            animated: true,
            style: { stroke: '#4f46e5', strokeWidth: 3, opacity: 0.8 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' },
          });

          traverse(child, tree[child], level + 1, childX);
          childX += childWidth;
        });
      };

      if (h.has_cycle) {
        nodesList.push({
          id: `node-${hIdx}-${h.root}`,
          type: 'trelix',
          data: { label: h.root, isRoot: true, isLeaf: false, isCycle: true },
          position: { x: currentX + 200, y: 0 },
        });
      } else {
        traverse(h.root, h.tree, 0, currentX);
      }
      
      currentX += treeWidth + 400; // Separation between distinct hierarchies
    });

    return { initialNodes: nodesList, initialEdges: edgesList };
  }, [hierarchies]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => {
      fitView({ padding: 0.1, duration: 1200 });
    }, 200);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.01}
      maxZoom={1.5}
    >
      <Background color="#111" variant="grid" gap={40} size={1} />
      <Controls className="!bg-zinc-900 !border-zinc-800 !fill-white" />
      <MiniMap 
        nodeColor={(n) => n.data.isCycle ? '#ef4444' : n.data.isRoot ? '#3b82f6' : n.data.isLeaf ? '#10b981' : '#3f3f46'} 
        maskColor="rgba(0,0,0,0.8)"
        className="!bg-black !border-zinc-900 !rounded-3xl shadow-2xl"
      />
    </ReactFlow>
  );
}

export function TrelixVisualizer({ hierarchies }) {
  return (
    <div className="w-full h-full bg-black">
      <ReactFlowProvider>
        <VisualizerContent hierarchies={hierarchies} />
      </ReactFlowProvider>
    </div>
  );
}
