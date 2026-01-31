"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { ethers } from "ethers";
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

  // Waste request fields
  const [wasteType, setWasteType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // IDs
  const [requestId, setRequestId] = useState<number | null>(null);
  const [commitRequestId, setCommitRequestId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  /* ---------------- CONTRACT INIT ---------------- */

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

  /* ---------------- SUBMIT REQUEST ---------------- */

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!contract || !address || !file) return;

    setLoading(true);
    setStatus("Uploading metadata to IPFS...");

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

      setStatus("Minting waste request on-chain...");
      const tx = await contract.mintRequest(address, data.metadataUri);
      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === "RequestMinted"
      );

      const mintedId = Number(event.args.tokenId);
      setRequestId(mintedId);
      setCommitRequestId(String(mintedId)); // auto-fill for convenience

      setStatus(`✅ Request #${mintedId} created`);
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-purple-700 text-white">
      <Navbar />

      {/* -------- REQUEST SECTION -------- */}
      <div className="text-center mt-10">
        <h1 className="text-4xl font-bold">Create Waste Request</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto mt-8 bg-black p-6 rounded-xl"
      >
        <input
          placeholder="Waste Type"
          value={wasteType}
          onChange={(e) => setWasteType(e.target.value)}
          className="input"
          required
        />
        <input
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="input"
          required
        />
        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="input"
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          required
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="input"
          required
        />

        <button disabled={loading} className="btn-primary">
          {loading ? "Minting..." : "Create Request"}
        </button>

        {status && <p className="text-center mt-2">{status}</p>}
      </form>

      {/* -------- COMMIT SECTION (ALWAYS AVAILABLE) -------- */}
      <div className="text-center mt-14">
        <h2 className="text-3xl font-bold">Add Commit</h2>
        <p className="text-gray-300">
          Commit actions to any existing request
        </p>
      </div>

      <div className="max-w-md mx-auto mt-6 bg-black p-6 rounded-xl">
        <input
          placeholder="Enter Request ID"
          value={commitRequestId}
          onChange={(e) => setCommitRequestId(e.target.value)}
          className="input"
        />

        <Commit />
      </div>
    </div>
  );
}
