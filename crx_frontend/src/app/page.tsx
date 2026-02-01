"use client";

import React, { useState, useRef } from "react";
import Navbar from "../components/navbar_home";
import { useWallet } from "../components/WalletContext";
import Signup from "../components/signup";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";

// ---------- Data ----------
const features = [
  { title: "Decentralized Waste Storage", description: "Records stored on IPFS or Arweave, ensuring tamper-proof, immutable records accessible to all." },
  { title: "On-Chain Tracking", description: "Verifiable timestamps and blockchain metadata for full transparency of the waste lifecycle." },
  { title: "Tokenized Recognition", description: "Contributors earn reputation tokens or NFTs for responsible handling." },
  { title: "Automated Lifecycle", description: "Smart contracts update status from collection to utilization automatically." },
  { title: "Audit & Compliance", description: "Publicly auditable movement ensuring regulatory compliance and accountability." },
  { title: "AI-Powered Analytics", description: "Predict generation and optimize routes for smarter city management." }
];

const stages = [
  { id: 1, color: "#10b981", label: "Collection", icon: "🚛", description: "Waste materials are systematically gathered and transported to facilities." },
  { id: 2, color: "#3b82f6", label: "Sorting", icon: "🤖", description: "AI-powered technology separates materials with extreme precision." },
  { id: 3, color: "#8b5cf6", label: "Processing", icon: "🏭", description: "Cleaning and shredding processes transform waste into raw materials." },
  { id: 4, color: "#f59e0b", label: "Recycling", icon: "♻️", description: "Materials are transformed into new sustainable products, closing the loop." },
];

// ---------- Sub-Components ----------

const ParallaxImage = ({ src, title, direction }: { src: string; title: string; direction: number }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const x = useTransform(scrollYProgress, [0, 1], [150 * direction, -150 * direction]);

  return (
    <div ref={ref} className="relative h-[50vh] flex items-center justify-center overflow-hidden my-12">
      <motion.div style={{ x }} className="flex gap-12 items-center whitespace-nowrap">
        <div className="w-[350px] h-[250px] md:w-[600px] md:h-[400px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          <img src={src} alt={title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
        </div>
        <h2 className="text-8xl md:text-[12rem] font-black uppercase text-white/5 tracking-tighter select-none">
          {title}
        </h2>
      </motion.div>
    </div>
  );
};

const CircularEconomy = () => {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <section className="py-24 px-6 bg-[#080808] rounded-[3rem] border border-white/5 my-20 max-w-[1400px] mx-auto relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full" />
      
      <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
        <div className="flex-1">
          <motion.div 
            key={activeStage}
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <span className="px-4 py-1 rounded-full border border-emerald-500/30 text-emerald-500 text-xs font-mono tracking-widest uppercase">
              Phase 0{activeStage + 1}
            </span>
            <h2 className="text-6xl font-bold tracking-tighter" style={{ color: stages[activeStage].color }}>
              {stages[activeStage].label}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-md">
              {stages[activeStage].description}
            </p>
            <div className="flex gap-3 pt-4">
              {stages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStage(i)}
                  className={`w-12 h-12 rounded-full border-2 transition-all duration-500 font-bold ${activeStage === i ? "bg-white text-black border-white" : "border-white/10 text-white/30 hover:border-white/40"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative">
          <motion.div
            key={activeStage}
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-80 h-80 md:w-[450px] md:h-[450px] rounded-full border-[1px] border-white/10 flex items-center justify-center bg-zinc-900/40 backdrop-blur-3xl shadow-[0_0_80px_-20px_rgba(16,185,129,0.2)]"
          >
            <span className="text-9xl">{stages[activeStage].icon}</span>
            <div className="absolute -inset-4 border border-dashed border-white/10 rounded-full animate-[spin_20s_linear_infinite]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ---------- Main Page ----------

const Dashboard: React.FC = () => {
  const { address } = useWallet();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500 selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/20 blur-[150px] rounded-full" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-[5rem] md:text-[8rem] font-black leading-[0.85] tracking-tighter mb-8">
              CRX <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                ECO-SYSTEM
              </span>
            </h1>
            <p className="text-zinc-400 text-xl md:text-2xl leading-relaxed max-w-lg mb-10">
              Transforming waste into digital assets. Secure, transparent, and decentralized management for the modern city.
            </p>
            <div className="flex gap-4">
              <Signup />
              <button className="px-8 py-4 rounded-full border border-white/10 hover:bg-white hover:text-black transition-all font-bold">
                EXPLORE DATA
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex justify-center"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <img
                src="/CODE BLOCK.png"
                alt="Logo"
                className="relative rounded-full w-72 h-72 md:w-[500px] md:h-[500px] object-cover grayscale brightness-75 hover:grayscale-0 transition-all duration-700 border-2 border-white/10"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto text-center px-6">
           <h2 className="text-zinc-500 font-mono text-sm tracking-[0.4em] uppercase mb-6">Our Mission</h2>
           <p className="text-3xl md:text-5xl font-medium leading-tight">
             Replacing messy legacy logs with <span className="text-white">immutable blockchain records</span> and AI-driven efficiency.
           </p>
        </div>
      </section>

      <CircularEconomy />

      <section className="py-20">
        <div className="text-center mb-10">
            <h2 className="text-emerald-500 font-mono text-xs tracking-widest uppercase">Visual Journey</h2>
        </div>
        <ParallaxImage src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200" title="COLLECT" direction={1} />
        <ParallaxImage src="/download.jpg" title="SORT" direction={-1} />
        <ParallaxImage src="/image3.jpg" title="PROCESS" direction={1} />
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <h2 className="text-6xl font-bold tracking-tighter">NETWORK <br/> CAPABILITIES</h2>
            <p className="text-zinc-500 max-w-xs font-mono text-sm uppercase tracking-tighter">Built on Ethereum & IPFS for unshakeable data integrity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                className="p-10 border border-white/5 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                  {index + 1}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-zinc-500 leading-relaxed group-hover:text-zinc-300 transition-colors">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-2xl font-black italic">CRX.</div>
          
          <p className="text-zinc-600 text-xs font-mono">© 2026 CRX NETWORK. VERIFIED ON-CHAIN.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;