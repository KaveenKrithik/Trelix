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

// --- Premium Trelix Node ---
const TrelixNode = ({ data }) => {
  const { isRoot, isLeaf, isCycle, label } = data;

  return (
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-8 py-5 rounded-[2.5rem] border-[3px] shadow-2xl flex flex-col items-center justify-center min-w-[180px] relative overflow-hidden backdrop-blur-2xl ${
        isRoot 
          ? "bg-blue-600/40 border-blue-400 text-blue-50 shadow-[0_0_50px_rgba(59,130,246,0.5)]" 
          : isCycle 
            ? "bg-red-600/40 border-red-500 text-red-50 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse"
            : isLeaf
              ? "bg-emerald-600/40 border-emerald-500 text-emerald-50 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
              : "bg-zinc-800/60 border-zinc-700 text-zinc-100"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <Handle type="target" position={Position.Top} className="!bg-zinc-400 !w-3 !h-3 !border-none" />
      <div className="flex flex-col items-center gap-1 z-10 text-center">
        <span className="text-xl font-black uppercase tracking-tighter">{label}</span>
        <div className="flex gap-2 mt-1">
           {isRoot && <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 bg-white/20 rounded-full">Root</span>}
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

function VisualizerContent({ hierarchy }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  const { initialNodes, initialEdges } = useMemo(() => {
    const nodesList = [];
    const edgesList = [];

    const getSubtreeWidth = (tree) => {
      const children = Object.keys(tree);
      if (children.length === 0) return 300;
      return children.reduce((acc, child) => acc + getSubtreeWidth(tree[child]), 0);
    };

    const traverse = (nodeName, tree, level = 0, xStart = 0) => {
      const id = `node-${nodeName}`;
      const children = Object.keys(tree);
      const isRoot = nodeName === hierarchy.root;
      const isLeaf = children.length === 0;

      const width = getSubtreeWidth(tree);
      const x = xStart + width / 2;
      const y = level * 250;

      nodesList.push({
        id,
        type: 'trelix',
        data: { label: nodeName, isRoot, isLeaf, isCycle: hierarchy.has_cycle },
        position: { x, y },
      });

      let childX = xStart;
      children.forEach((child) => {
        const childId = `node-${child}`;
        edgesList.push({
          id: `edge-${id}-${childId}`,
          source: id,
          target: childId,
          animated: true,
          style: { stroke: '#4f46e5', strokeWidth: 3, opacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' },
        });
        traverse(child, tree[child], level + 1, childX);
        childX += getSubtreeWidth(tree[child]);
      });
    };

    if (hierarchy.has_cycle) {
      nodesList.push({
        id: `node-${hierarchy.root}`,
        type: 'trelix',
        data: { label: hierarchy.root, isRoot: true, isLeaf: false, isCycle: true },
        position: { x: 0, y: 0 },
      });
    } else {
      traverse(hierarchy.root, hierarchy.tree, 0, 0);
    }

    return { initialNodes: nodesList, initialEdges: edgesList };
  }, [hierarchy]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 1000 });
    }, 150);
  }, [initialNodes, initialEdges, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background color="#111" variant="grid" gap={40} size={1} />
      <Controls className="!bg-zinc-900 !border-zinc-800 !fill-white" />
    </ReactFlow>
  );
}

export function TrelixVisualizer({ hierarchy }) {
  return (
    <div className="w-full h-full bg-black">
      <ReactFlowProvider>
        <VisualizerContent hierarchy={hierarchy} />
      </ReactFlowProvider>
    </div>
  );
}
