"use client";

import React, { useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'A', position: { x: 100, y: 100 }, data: { label: 'A' }, type: 'default' },
  { id: 'B', position: { x: 300, y: 100 }, data: { label: 'B' }, type: 'default' },
];

const initialEdges = [{ id: 'e-A-B', source: 'A', target: 'B', animated: true }];

export function TrelixCanvas({ nodes, setNodes, edges, setEdges }) {
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ 
      ...params, 
      animated: true, 
      markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)' },
      style: { strokeWidth: 2, stroke: 'var(--accent)' }
    }, eds)),
    [setEdges]
  );

  const addNode = () => {
    const id = String.fromCharCode(65 + nodes.length);
    const newNode = {
      id,
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: { label: id },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  return (
    <div className="w-full h-full relative group">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          // Standard react-flow changes
          const nextNodes = nodes.map(n => {
            const change = changes.find(c => c.id === n.id);
            if (change?.type === 'position' && change.position) return { ...n, position: change.position };
            return n;
          });
          setNodes(nextNodes);
        }}
        onEdgesChange={(changes) => {
           // Basic edge removal support
           if (changes[0]?.type === 'remove') {
             setEdges(eds => eds.filter(e => e.id !== changes[0].id));
           }
        }}
        onConnect={onConnect}
        fitView
      >
        <Background color="var(--border)" variant="lines" gap={40} size={1} />
        <Controls />
      </ReactFlow>
      
      <button 
        onClick={addNode}
        className="absolute top-4 left-4 z-50 bg-accent text-accent-fg px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
      >
        Add Node +
      </button>

      <div className="absolute bottom-4 left-4 z-50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[9px] font-bold text-zinc-400 uppercase">
        Drag between dots to create edges
      </div>
    </div>
  );
}
