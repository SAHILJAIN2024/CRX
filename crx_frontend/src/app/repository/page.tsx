"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/navbar";
import { useWallet } from "../../components/WalletContext";
import CONTRACT_ABI from "../../contractABI/contractABI.json";
import Commit from "../../components/commit";

interface RequestMetadata {
  metadataUri: string;
}

export default function Repository() {
  const { address } = useWallet();
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Form State
  const [wasteType, setWasteType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  /* ---------------- CONTRACT INIT ---------------- */
  useEffect(() => {
    if (!address) return;
    const setupContract = async () => {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const instance = new ethers.Contract(
        "0x340E18FF8E4De6958977b2Bd8dF9A3bAB51ddD09",
        CONTRACT_ABI.abi,
        signer
      );
      setContract(instance);
    };
    setupContract();
  }, [address]);

  /* ---------------- SUBMIT REQUEST ---------------- */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contract || !address || !file) return;

    setLoading(true);
    setStatus("SIGNALING IPFS GATEWAY...");

    try {
      const formData = new FormData();
      formData.append("wasteType", wasteType);
      formData.append("quantity", quantity);
      formData.append("location", location);
      formData.append("description", description);
      formData.append("file", file);

      const res = await fetch("http://localhost:5000/api/waste", {
        method: "POST",
        body: formData,
      });

      const data: RequestMetadata = await res.json();
      setStatus("MINTING ON-CHAIN ASSET...");
      
      const tx = await contract.mintRequest(address, data.metadataUri);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log: any) => log.fragment?.name === "RequestMinted");
      const mintedId = Number(event.args.tokenId);

      setStatus(`SUCCESS: REQUEST #${mintedId} VERIFIED`);
      
      // Reset form
      setWasteType(""); setQuantity(""); setLocation(""); setDescription(""); setFile(null);
    } catch (err: any) {
      setStatus("ERROR: TRANSACTION FAILED");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500 selection:text-black">
      <Navbar />

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 pt-32 pb-20 px-6">
        {/* -------- REQUEST SECTION -------- */}
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl font-black tracking-tighter mb-4">
              CREATE <span className="text-emerald-500 italic">REQUEST</span>
            </h1>
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-[0.3em]">Deploy New Waste Asset to Chain</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 p-8 md:p-12 rounded-[2.5rem] shadow-2xl"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inputs */}
                {[
                  { label: "Waste Type", val: wasteType, set: setWasteType, ph: "Plastic, e-Waste..." },
                  { label: "Quantity", val: quantity, set: setQuantity, ph: "e.g. 50kg" },
                  { label: "Location", val: location, set: setLocation, ph: "Pickup Address" },
                ].map((input, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{input.label}</label>
                    <input
                      placeholder={input.ph}
                      value={input.val}
                      onChange={(e) => input.set(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                      required
                    />
                  </div>
                ))}

                {/* File Upload Styled */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Documentation (Image)</label>
                  <div className="relative group h-[58px]">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                      required
                    />
                    <div className="absolute inset-0 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-xl flex items-center px-5 group-hover:bg-emerald-500/10 transition-colors">
                      <span className="text-sm text-emerald-500 font-mono truncate">
                        {file ? `file: ${file.name}` : "SELECT ASSET FILE +"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Asset Description</label>
                <textarea
                  placeholder="Provide detailed characteristics of the waste material..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none placeholder:text-zinc-700"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl 
                  ${loading 
                    ? "bg-zinc-800 text-zinc-600 cursor-wait" 
                    : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20 active:scale-[0.98]"}`}
              >
                {loading ? "PROCESSSING..." : "INITIALIZE MINT"}
              </button>
            </form>
          </motion.div>
        </div>

        {/* -------- COMMIT SECTION -------- */}
        <div className="max-w-4xl mx-auto mt-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold tracking-tighter">NETWORK <span className="text-blue-400 italic">COMMITS</span></h2>
            <p className="text-zinc-500 font-mono text-sm mt-2 uppercase tracking-[0.2em]">Update Lifecycle Metadata</p>
          </div>
          <motion.div 
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-4"
          >
            <Commit />
          </motion.div>
        </div>
      </main>

      {/* Status Notification */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 100, x: "-50%", opacity: 0 }}
            className="fixed bottom-10 left-1/2 z-50 px-8 py-4 bg-emerald-500 text-black font-mono text-xs font-bold rounded-full shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
            {status}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}