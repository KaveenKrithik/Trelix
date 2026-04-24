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

// --- Custom Node (Sleek, Colorful, High Visibility on White) ---
const TrelixNode = ({ data }) => {
  const { isRoot, isLeaf, isCycle, label } = data;

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-8 py-5 rounded-[2rem] border-2 transition-all duration-300 shadow-xl flex flex-col items-center justify-center min-w-[180px] ${
        isRoot 
          ? "bg-blue-50 border-blue-200 text-blue-700" 
          : isCycle 
            ? "bg-red-50 border-red-200 text-red-700 animate-pulse"
            : isLeaf
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-white border-zinc-200 text-zinc-700"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-zinc-300 !w-3 !h-3 !border-none" />
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-black uppercase tracking-tight">{label}</span>
        <div className="flex gap-1 mt-1">
           {isRoot && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-100 rounded-full">Root</span>}
           {isLeaf && !isRoot && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-100 rounded-full">Terminal</span>}
           {isCycle && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-red-100 rounded-full">Cycle</span>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-300 !w-3 !h-3 !border-none" />
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
    let xOffset = 0;

    hierarchies.forEach((h, hIdx) => {
      const componentNodes = new Set();
      
      const traverse = (nodeName, tree, level = 0, xPos = 0) => {
        const id = `node-${hIdx}-${nodeName}`;
        if (componentNodes.has(id)) return;
        componentNodes.add(id);

        const x = xPos * 350 + xOffset;
        const y = level * 250;

        const children = Object.keys(tree);

        nodesList.push({
          id,
          type: 'trelix',
          data: { 
            label: nodeName, 
            isRoot: nodeName === h.root, 
            isLeaf: children.length === 0,
            isCycle: h.has_cycle 
          },
          position: { x, y },
        });

        children.forEach((child, cIdx) => {
          const childId = `node-${hIdx}-${child}`;
          edgesList.push({
            id: `edge-${id}-${childId}`,
            source: id,
            target: childId,
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          });
          traverse(child, tree[child], level + 1, xPos + cIdx);
        });
      };

      if (h.has_cycle) {
        nodesList.push({
          id: `node-${hIdx}-${h.root}`,
          type: 'trelix',
          data: { label: h.root, isRoot: true, isLeaf: false, isCycle: true },
          position: { x: xOffset, y: 0 },
        });
      } else {
        traverse(h.root, h.tree);
      }
      xOffset += 1200;
    });

    return { initialNodes: nodesList, initialEdges: edgesList };
  }, [hierarchies]);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => {
      fitView({ padding: 0.15, duration: 1000 });
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
      minZoom={0.01}
      maxZoom={1.5}
    >
      <Background color="#f1f5f9" variant="lines" gap={40} size={1} />
      <Controls className="!bg-white !border-zinc-200 !fill-zinc-600" />
      <MiniMap 
        nodeColor={(n) => n.data.isCycle ? '#ef4444' : n.data.isRoot ? '#3b82f6' : n.data.isLeaf ? '#10b981' : '#e2e8f0'} 
        maskColor="rgba(255,255,255,0.7)"
        className="!bg-white !border-zinc-200 !rounded-3xl shadow-2xl"
      />
    </ReactFlow>
  );
}

export function TrelixVisualizer({ hierarchies }) {
  return (
    <div className="w-full h-full bg-white">
      <ReactFlowProvider>
        <VisualizerContent hierarchies={hierarchies} />
      </ReactFlowProvider>
    </div>
  );
}
