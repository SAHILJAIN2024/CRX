"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/navbar";
import { useWallet } from "../../components/WalletContext";
import CONTRACT_ABI from "../../contractABI/contractABI.json";
import Commit from "../../components/commit";

/* ---------------- TYPES ---------------- */

interface BackendResponse {
  success: boolean;
  metadataUri: string;
}

/* ---------------- COMPONENT ---------------- */

export default function Repository() {
  const { address } = useWallet();

  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const [name, setName] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  /* ---------------- CONTRACT SETUP ---------------- */

  useEffect(() => {
    if (!address) return;

    const setupContract = async () => {
      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );
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

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contract || !address || !file) return;

    try {
      setLoading(true);
      setStatus("UPLOADING TO IPFS...");

      const formData = new FormData();
      formData.append("ownerAddress", address);
      formData.append("name", name);
      formData.append("wasteType", wasteType);
      formData.append("quantity", quantity);
      formData.append("location", location);
      formData.append("description", description);
      formData.append("file", file);

      const res = await fetch("http://localhost:5000/api/waste", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Backend upload failed");

      const data: BackendResponse = await res.json();

      setStatus("MINTING ON-CHAIN ASSET...");

      const tx = await contract.mintRequest(address, data.metadataUri);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === "RequestMinted"
      );

      const mintedId = Number(event.args.tokenId);
      setStatus(`SUCCESS: REQUEST #${mintedId} VERIFIED`);

      // Reset
      setName("");
      setWasteType("");
      setQuantity("");
      setLocation("");
      setDescription("");
      setFile(null);
    } catch (err) {
      console.error(err);
      setStatus("ERROR: TRANSACTION FAILED");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 5000);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1 className="text-6xl font-black">
            CREATE <span className="text-emerald-500 italic">REQUEST</span>
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
            Deploy New Waste Asset
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900/40 border border-white/5 p-10 rounded-[2.5rem]"
        >
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">

              <input
                placeholder="Asset Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/5 rounded-xl px-5 py-4"
              />

              <input
                placeholder="Waste Type"
                value={wasteType}
                onChange={(e) => setWasteType(e.target.value)}
                required
                className="bg-white/5 rounded-xl px-5 py-4"
              />

              <input
                placeholder="Quantity (e.g. 50kg)"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="bg-white/5 rounded-xl px-5 py-4"
              />

              <input
                placeholder="Pickup Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="bg-white/5 rounded-xl px-5 py-4"
              />

              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="md:col-span-2 bg-white/5 rounded-xl px-5 py-4"
              />

              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="md:col-span-2 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black tracking-widest
                ${
                  loading
                    ? "bg-zinc-800 text-zinc-500"
                    : "bg-emerald-500 text-black hover:bg-emerald-400"
                }`}
            >
              {loading ? "PROCESSING..." : "INITIALIZE MINT"}
            </button>
          </form>
        </motion.div>

        <div className="mt-32">
          <Commit />
        </div>
      </main>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-8 py-4 rounded-full font-mono text-xs"
          >
            {status}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}