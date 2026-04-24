"use client";

import React, { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, History, TreePine, Zap, Copy, Trash2, 
  Sparkles, Command, HelpCircle, Code, Diff, Share2, ClipboardCheck,
  AlertCircle, CheckCircle2, Flame, Terminal, Image as ImageIcon,
  Activity, Database, Cpu, Layers, Box, Fingerprint, Send, ChevronRight, Globe
} from 'lucide-react';
import { TrelixVisualizer } from '@/components/TrelixVisualizer';
import { TrelixCanvas } from '@/components/TrelixCanvas';
import html2canvas from 'html2canvas-pro';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { processBFHL } from '@/lib/bfhl';

// --- Utilities ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const STORAGE_KEY = 'trelix_history';

const TEST_CASES = [
  { name: "SRM Challenge", data: "A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->" },
  { name: "Circular Loop", data: "X->Y, Y->Z, Z->X, A->B, B->A" },
  { name: "Deep Hierarchy", data: "ROOT->L1, L1->L2, L2->L3, L3->L4, L4->L5, L5->L6" },
  { name: "Diamond Node", data: "A->B, A->C, B->D, C->D" },
  { name: "Multi-Tree", data: "A->B, X->Y, P->Q, 1->2, 3->4" }
];

function calculateHealth(input, res) {
  if (!res) return 0;
  const valid = input.length - (res.invalid_entries?.length || 0);
  const total = input.length || 1;
  const trees = res.summary?.total_trees || 0;
  const cycles = res.summary?.total_cycles || 0;
  const dups = res.duplicate_edges?.length || 0;
  const vScore = (valid / total) * 40;
  const sScore = (1 - cycles / (trees + cycles || 1)) * 30;
  const cScore = (1 - dups / total) * 30;
  return Math.round(vScore + sScore + cScore);
}

function getComplexity(res) {
  if (!res) return 'Simple';
  const { total_trees, total_cycles } = res.summary || { total_trees: 0, total_cycles: 0 };
  const maxDepth = Math.max(...(res.hierarchies || []).map(h => h.depth || 0), 0);
  if (total_cycles > 0 && res.duplicate_edges?.length > 0 && res.invalid_entries?.length > 0) return 'Chaotic';
  if (total_cycles > 0 || maxDepth >= 5) return 'Complex';
  if (total_trees > 1 || maxDepth >= 3) return 'Moderate';
  return 'Simple';
}

export default function TrelixApp() {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('analyzer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [textInput, setTextInput] = useState(TEST_CASES[0].data);
  const [result, setResult] = useState(null);
  const [prevResult, setPrevResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processTime, setProcessTime] = useState(0);

  // Playground States
  const [pgUrl, setPgUrl] = useState('/api/bfhl');
  const [pgBody, setPgBody] = useState(JSON.stringify({ data: ["A->B", "A->C", "B->D"] }, null, 2));
  const [pgResponse, setPgResponse] = useState(null);
  const [pgLoading, setPgLoading] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveToHistory = (input, res) => {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      input: [...input],
      summary: res.summary,
      health: calculateHealth(input, res),
      complexity: getComplexity(res)
    };
    const updated = [newEntry, ...history.slice(0, 19)];
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleSubmit = async () => {
    const data = textInput.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
    if (!data.length) return setError("System requires at least one edge vector.");
    
    setLoading(true);
    setError(null);
    const start = performance.now();
    const localResult = processBFHL(data);
    const localTime = performance.now() - start;
    
    startTransition(() => {
      setPrevResult(result);
      setResult(localResult);
      setProcessTime(localTime);
    });

    try {
      const res = await fetch('/api/bfhl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      const json = await res.json();
      setResult(prev => ({ ...prev, ...json }));
      saveToHistory(data, json);
    } catch (e) {
      console.warn("API offline, using local synthesis.");
    } finally {
      setLoading(false);
    }
  };

  const handlePgSend = async () => {
    setPgLoading(true);
    try {
      const res = await fetch(pgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: pgBody
      });
      const data = await res.json();
      setPgResponse({ status: res.status, data });
    } catch (e) {
      setPgResponse({ status: 'Error', data: { message: e.message } });
    } finally {
      setPgLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-white selection:text-black font-sans">
      {/* --- Global Grid Overlay --- */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* --- Navigation --- */}
      <nav className="h-16 border-b border-zinc-900 flex items-center px-8 bg-black/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-900 rounded-lg transition-all">
            <History size={18} className={isSidebarOpen ? "text-white" : "text-zinc-600"} />
          </button>
          <span className="font-black text-xl tracking-tighter uppercase">Trelix</span>
        </div>
        <div className="mx-12 hidden lg:flex gap-1 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <NavTab active={activeTab === 'analyzer'} onClick={() => setActiveTab('analyzer')} label="Analyzer" />
          <NavTab active={activeTab === 'interface'} onClick={() => setActiveTab('interface')} label="Interface" />
        </div>
        <div className="ml-auto flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
           <Activity size={14} className="text-green-500 animate-pulse" />
           <span className="hidden sm:inline">Engine: v4.0.4</span>
        </div>
      </nav>

      <div className="flex flex-1 relative overflow-hidden">
        {/* --- Sidebar --- */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.aside
              initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
              className="w-[320px] border-r border-zinc-900 bg-black z-40 flex flex-col absolute inset-y-0 left-0 shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
                <span className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-500">History Memory</span>
                <button onClick={() => setHistory([])} className="p-2 hover:text-red-500 transition-colors opacity-40 hover:opacity-100"><Trash2 size={14} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {history.map(item => (
                  <HistoryCard key={item.id} item={item} onSelect={(i) => { setTextInput(i.input.join(', ')); handleSubmit(); }} />
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* --- Workspace --- */}
        <main className="flex-1 overflow-y-auto z-10">
          <div className="max-w-7xl mx-auto p-6 lg:p-12 pb-40">
            {activeTab === 'analyzer' ? (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                <div className="xl:col-span-8 space-y-10">
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Vector Synthesis</h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Sub-millisecond hierarchical modeling.</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {TEST_CASES.map((tc, i) => (
                      <button 
                        key={i} onClick={() => setTextInput(tc.data)}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        {tc.name}
                      </button>
                    ))}
                  </div>

                  <div className="bg-zinc-950 rounded-[3rem] border border-zinc-900 p-10 space-y-10 shadow-2xl">
                    <textarea
                      value={textInput} onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter edge vectors..."
                      className="w-full h-56 bg-black rounded-[2.5rem] p-10 font-mono text-sm outline-none border border-zinc-900 focus:border-zinc-700 transition-all resize-none leading-relaxed custom-scrollbar"
                    />
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <button
                        onClick={handleSubmit} disabled={loading}
                        className="w-full sm:flex-1 bg-white text-black h-20 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        {loading ? "Processing..." : <><Sparkles size={18} /> Synthesize Vector</>}
                      </button>
                      {processTime > 0 && (
                        <div className="px-8 py-5 bg-zinc-900/50 rounded-[2.5rem] border border-zinc-900 text-[11px] font-black text-zinc-400 uppercase tracking-widest font-mono">
                           {processTime.toFixed(4)} ms
                        </div>
                      )}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {result ? (
                      <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <ResultsSection result={result} prevResult={prevResult} />
                      </motion.div>
                    ) : (
                      <div className="py-20 flex flex-col items-center justify-center text-center opacity-10">
                         <Zap size={64} className="mb-6" />
                         <p className="text-[11px] font-black uppercase tracking-[0.5em]">Cognitive Standby</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Content (Meta) */}
                <div className="xl:col-span-4 space-y-8">
                  <div className="p-8 rounded-[3rem] bg-zinc-950 border border-zinc-900 space-y-8 shadow-2xl sticky top-24">
                     <MetricItem icon={<Cpu size={14} />} label="Processing" value="O(N + E)" />
                     <MetricItem icon={<Layers size={14} />} label="Context" value="Directed" />
                     <MetricItem icon={<Box size={14} />} label="Model" value="Trelix v4" />
                     <div className="pt-8 border-t border-zinc-900">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Health</span>
                           <span className="text-[9px] font-black text-green-500 uppercase">100%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                           <div className="h-full bg-white w-full" />
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            ) : (
              <InterfaceModule 
                pgUrl={pgUrl} setPgUrl={setPgUrl} 
                pgBody={pgBody} setPgBody={setPgBody} 
                pgResponse={pgResponse} onSend={handlePgSend} 
                loading={pgLoading} 
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavTab({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={cn(
      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
      active ? "bg-white text-black shadow-xl" : "text-zinc-600 hover:text-white"
    )}>{label}</button>
  );
}

function HistoryCard({ item, onSelect }) {
  return (
    <div className="p-5 rounded-[2rem] border border-zinc-900 hover:border-white/20 bg-zinc-950 transition-all cursor-pointer group" onClick={() => onSelect(item)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700">{item.timestamp}</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-white">{item.health}%</span>
      </div>
      <div className="text-[9px] text-zinc-600 font-mono line-clamp-1 truncate">{item.input.join(', ')}</div>
    </div>
  );
}

function MetricItem({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
       <div className="flex items-center gap-3">
          <div className="text-zinc-700">{icon}</div>
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
       </div>
       <span className="text-[9px] font-black text-white font-mono">{value}</span>
    </div>
  );
}

function ResultsSection({ result, prevResult }) {
  const [activeTab, setActiveTab] = useState('viz');
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Trees" value={result.summary.total_trees} />
        <StatCard label="Cycles" value={result.summary.total_cycles} danger={result.summary.total_cycles > 0} />
        <StatCard label="Entropy" value={getComplexity(result)} isText />
        <StatCard label="Score" value={`${calculateHealth([], result)}%`} />
      </div>

      <div className="bg-zinc-950 rounded-[3rem] border border-zinc-900 overflow-hidden shadow-2xl">
        <div className="flex items-center border-b border-zinc-900 px-10">
          <ResultTabBtn active={activeTab === 'viz'} onClick={() => setActiveTab('viz')} label="System Visualizer" />
          <ResultTabBtn active={activeTab === 'info'} onClick={() => setActiveTab('info')} label="Data Summary" />
          <ResultTabBtn active={activeTab === 'diff'} onClick={() => setActiveTab('diff')} label="Change Vector" />
        </div>
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {activeTab === 'viz' && <VisualizerPanel hierarchies={result.hierarchies} />}
              {activeTab === 'info' && <SummaryPanel result={result} />}
              {activeTab === 'diff' && <ComparisonPanel current={result} prev={prevResult} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, danger, isText }) {
  return (
    <div className="bg-zinc-950 p-8 rounded-[2rem] border border-zinc-900 flex flex-col items-center text-center shadow-xl">
      <div className={cn("text-4xl font-black tracking-tighter mb-1", danger ? "text-red-500" : isText ? "text-lg uppercase" : "text-white")}>{value}</div>
      <div className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.2em]">{label}</div>
    </div>
  );
}

function ResultTabBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={cn(
      "px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] transition-all border-b-2 shrink-0",
      active ? "border-white text-white" : "border-transparent text-zinc-600 hover:text-zinc-300"
    )}>{label}</button>
  );
}

function VisualizerPanel({ hierarchies }) {
  return (
    <div className="space-y-12">
      {hierarchies.map((h, i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center justify-between px-6">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-400">Hierarchy Segment: {h.root}</span>
             </div>
             {h.depth && <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Depth: {h.depth}</span>}
          </div>
          <VisualizerCard hierarchy={h} />
        </div>
      ))}
    </div>
  );
}

function VisualizerCard({ hierarchy }) {
  const containerRef = useRef(null);
  return (
    <div className="h-[500px] bg-black rounded-[3rem] relative overflow-hidden border border-zinc-900 group shadow-2xl transition-all hover:border-zinc-700" ref={containerRef}>
      <TrelixVisualizer hierarchy={hierarchy} />
      <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
        <button 
          onClick={async () => {
            const canvas = await html2canvas(containerRef.current);
            const link = document.createElement('a');
            link.download = `trelix-root-${hierarchy.root}.png`;
            link.href = canvas.toDataURL();
            link.click();
          }}
          className="p-3 bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ImageIcon size={18} />
        </button>
      </div>
    </div>
  );
}

function SummaryPanel({ result }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-8">
         <div className="space-y-4">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Invalid Pointers</span>
            <div className="flex flex-wrap gap-2">
              {result.invalid_entries?.map((e, i) => <span key={i} className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-mono">{e}</span>)}
            </div>
         </div>
         <div className="space-y-4">
            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Duplicates</span>
            <div className="flex flex-wrap gap-2">
              {result.duplicate_edges?.map((e, i) => <span key={i} className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[10px] font-mono">{e}</span>)}
            </div>
         </div>
      </div>
      <div className="bg-black rounded-3xl border border-zinc-900 p-8">
         <pre className="text-[11px] font-mono text-zinc-600 leading-relaxed overflow-x-auto max-h-[400px] custom-scrollbar">
           {JSON.stringify(result, null, 2)}
         </pre>
      </div>
    </div>
  );
}

function ComparisonPanel({ current, prev }) {
  if (!prev) return <div className="py-20 text-center font-black uppercase tracking-[0.4em] text-xs opacity-20">No context.</div>;
  return (
    <div className="grid lg:grid-cols-2 gap-8 h-[500px]">
       <DiffCard title="Base" data={prev} muted />
       <DiffCard title="Synthesized" data={current} />
    </div>
  );
}

function DiffCard({ title, data, muted }) {
  return (
    <div className="flex flex-col h-full space-y-4">
      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2">{title}</span>
      <div className={cn("flex-1 rounded-3xl p-8 font-mono text-[10px] overflow-auto border custom-scrollbar", muted ? "bg-black border-zinc-900 text-zinc-600" : "bg-zinc-950 border-white/10 text-zinc-300")}>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}

function InterfaceModule({ pgUrl, setPgUrl, pgBody, setPgBody, pgResponse, onSend, loading }) {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">API Interface</h2>
        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.4em]">Test the Trelix vector synthesis endpoint.</p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl flex overflow-hidden">
          <div className="px-6 flex items-center text-[10px] font-black text-white bg-zinc-900 uppercase tracking-widest">POST</div>
          <input value={pgUrl} onChange={(e) => setPgUrl(e.target.value)} className="flex-1 px-6 py-4 text-xs bg-transparent outline-none font-mono" />
        </div>
        <button onClick={onSend} disabled={loading} className="px-10 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">
          {loading ? "Sending..." : "Invoke"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-[600px]">
        <div className="flex flex-col space-y-4">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-4">Request Body</span>
          <textarea value={pgBody} onChange={(e) => setPgBody(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 font-mono text-[10px] outline-none focus:border-zinc-700 resize-none custom-scrollbar" />
        </div>
        <div className="flex flex-col space-y-4">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-4">Response Status</span>
          <div className="flex-1 bg-black border border-zinc-900 rounded-[2.5rem] p-8 font-mono text-[10px] overflow-auto custom-scrollbar relative">
             {pgResponse ? (
               <pre className="text-zinc-500">{JSON.stringify(pgResponse.data, null, 2)}</pre>
             ) : (
               <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
                 <Terminal size={48} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Invocation</span>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemAlert({ message }) {
  return (
    <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-500 flex items-center gap-6">
      <AlertCircle size={24} />
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
}
