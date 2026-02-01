"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "../components/WalletContext";
import CONTRACT_ABI from "../contractABI/contractABI.json";

/* ---------------- Helpers ---------------- */
const normalizeToIpfsUri = (input: string): string => {
  if (!input) return "";
  if (input.startsWith("ipfs://")) return input;
  const match = input.match(/\/ipfs\/([^/?#]+)/);
  if (match?.[1]) return `ipfs://${match[1]}`;
  return `ipfs://${input.replace(/^\/+/, "")}`;
};

const ipfsToHttp = (ipfsUri: string) =>
  `https://cloudflare-ipfs.com/ipfs/${ipfsUri.replace("ipfs://", "")}`;

/* ---------------- Main Component ---------------- */

export default function Commit() {
  const { address } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [contributor, setContributor] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [repoID, setRepoID] = useState<string>("");
  const [metadataUri, setMetadataUri] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!address) return;
    const initContract = async () => {
      try {
        const contractAddress = "0x340E18FF8E4De6958977b2Bd8dF9A3bAB51ddD09";
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const instance = new ethers.Contract(contractAddress, CONTRACT_ABI.abi, signer);
        setContract(instance);
      } catch (err) {
        console.error("❌ Contract Init Error:", err);
      }
    };
    initContract();
  }, [address]);

  const mintCommit = async () => {
    if (!address) return alert("⚠️ Connect wallet");
    if (!contributor || !message || !file || !repoID) {
      setStatus("⚠️ REQUIRED: ALL FIELDS");
      return;
    }

    try {
      setLoading(true);
      setStatus("UPLOADING TO IPFS...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", message);
      formData.append("ownerAddress", address);
      formData.append("contributor", contributor);

      const response = await fetch("http://localhost:5000/api/commit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Upload failed");

      const canonicalUri = normalizeToIpfsUri(data.metadataUri);
      setMetadataUri(canonicalUri);

      setStatus("MINTING ON-CHAIN COMMIT...");
      const tx = await contract?.mintCommit(address, Number(repoID), canonicalUri);
      await tx?.wait();

      setStatus("✅ COMMIT VERIFIED ON-CHAIN");
      setContributor(""); setMessage(""); setFile(null); setRepoID("");
    } catch (err: any) {
      setStatus(`❌ ERROR: ${err?.reason || "MINT_FAILED"}`);
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="px-8 pt-10 pb-6 border-b border-white/5 bg-white/[0.01]">
        <h2 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
          <span className="text-emerald-500">⚡</span> MINT COMMIT
        </h2>
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] mt-2">Update Asset Lifecycle Data</p>
      </div>

      <div className="p-8 space-y-6">
        {/* Wallet Status */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest">Signer</span>
          <span className="text-xs font-mono text-emerald-400">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "AUTH_REQUIRED"}
          </span>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Repository ID", val: repoID, set: setRepoID, ph: "ID (e.g. 1)" },
            { label: "Contributor", val: contributor, set: setContributor, ph: "0x... or Name" },
          ].map((input, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{input.label}</label>
              <input
                type="text"
                placeholder={input.ph}
                value={input.val}
                onChange={(e) => input.set(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-zinc-200 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-700"
              />
            </div>
          ))}
        </div>

        {/* Full Width Message */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Commit Message</label>
          <input
            type="text"
            placeholder="e.g. Completed collection phase"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-zinc-200 p-4 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-zinc-700"
          />
        </div>

        {/* File Dropzone Style */}
        <div className="relative group">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-1 block">Proof of Work (Attachment)</label>
          <div className="relative flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl p-6 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/[0.02] transition-all">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <p className="text-sm font-mono text-zinc-500">
                {file ? <span className="text-emerald-400 italic">ready: {file.name}</span> : "[ CLICK_TO_ATTACH_ASSET ]"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={mintCommit}
          disabled={loading}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl 
            ${loading 
              ? "bg-zinc-800 text-zinc-600 cursor-wait" 
              : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20 active:scale-[0.98]"
            }`}
        >
          {loading ? "INITIALIZING..." : "EXECUTE MINT"}
        </button>

        {/* Status & Metadata */}
        <AnimatePresence>
          {status && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center text-[10px] font-mono text-emerald-500 uppercase tracking-widest animate-pulse"
            >
              {status}
            </motion.p>
          )}
        </AnimatePresence>
        
        {metadataUri && (
          <div className="mt-2 space-y-2 pt-6 border-t border-white/5">
            <a 
              href={metadataUri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              🌐 VIEW IPFS SOURCE
            </a>
            <p className="text-[9px] text-zinc-600 font-mono break-all text-center leading-relaxed">
              GATEWAY_PREVIEW: {ipfsToHttp(metadataUri)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}