"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import { useWallet } from "../../components/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Types ---------------- */
type Request = { id: string; tokenId: string; to: string; uri: string; };
type GraphResponse = { requestMinteds: Request[]; };

/* ---------------- Graph ---------------- */
const GRAPH_URL = "https://api.studio.thegraph.com/query/117940/crx-waste-managment/version/latest";
const QUERY = gql`
  {
    requestMinteds(first: 50, orderBy: blockTimestamp, orderDirection: desc) {
      id
      tokenId
      to
      uri
    }
  }
`;

/* ---------------- IPFS Helpers ---------------- */
const normalizeToIpfsUri = (input: string): string => {
  if (!input) return "";
  if (input.startsWith("ipfs://")) return input;
  const match = input.match(/\/ipfs\/([^/?#]+)/);
  if (match?.[1]) return `ipfs://${match[1]}`;
  if (/^(Qm|bafy)/.test(input)) return `ipfs://${input}`;
  throw new Error("Invalid IPFS input: " + input);
};

const GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
];

const ipfsToHttp = (ipfsUri: string, gw = GATEWAYS[0]) =>
  gw + ipfsUri.replace("ipfs://", "");

/* ---------------- Metadata Fetch ---------------- */
const fetchMetadata = async (rawUri: string) => {
  const ipfsUri = normalizeToIpfsUri(rawUri);
  const cid = ipfsUri.replace("ipfs://", "");
  for (const gw of GATEWAYS) {
    try {
      const res = await fetch(gw + cid, { cache: "no-store" });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const json = await res.json();
        if (json.image) json.image = normalizeToIpfsUri(json.image);
        return json;
      }
      return {
        name: "Attached File",
        description: "This request contains a file attachment",
        image: `ipfs://${cid}`,
        attributes: [{ trait_type: "Content-Type", value: contentType }],
      };
    } catch { continue; }
  }
  throw new Error("All IPFS gateways failed");
};

/* ---------------- Renderer ---------------- */
const RenderIPFSContent = ({ data }: { data: any }) => {
  if (!data) return (
    <div className="flex flex-col items-center py-10 space-y-3">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Decrypting Metadata...</p>
    </div>
  );

  const { name, description, image, attributes } = data;
  const ipfsImageUri = image ? normalizeToIpfsUri(image) : null;
  const httpPreviewUrl = ipfsImageUri ? ipfsToHttp(ipfsImageUri) : null;
  const isImage = httpPreviewUrl && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(httpPreviewUrl);

  return (
    <div className="mt-4 space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{name}</h3>
        <p className="text-zinc-400 text-sm mt-1 max-w-md mx-auto">{description}</p>
      </div>

      {isImage && (
        <div className="relative group overflow-hidden rounded-2xl border border-white/5 bg-black/50">
          <img
            src={httpPreviewUrl!}
            alt={name}
            className="w-full max-h-[400px] object-contain transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {ipfsImageUri && (
          <a
            href={ipfsImageUri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-emerald-500 hover:text-emerald-400 tracking-widest uppercase transition-colors flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            View Source on IPFS
          </a>
        )}

        {Array.isArray(attributes) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {attributes.map((a: any, i: number) => (
              <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-3 flex flex-col items-start">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{a.trait_type}</span>
                <span className="text-sm text-zinc-200 font-mono truncate w-full">{a.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- Dashboard ---------------- */
const Dashboard = () => {
  const { address, connectWallet } = useWallet();
  const [metadataCache, setMetadataCache] = useState<Record<string, any>>({});

  const { data, isLoading, isError } = useQuery<GraphResponse>({
    queryKey: ["graph-data"],
    queryFn: () => request(GRAPH_URL, QUERY),
  });

  useEffect(() => {
    if (!data) return;
    const loadMetadata = async () => {
      const newCache: Record<string, any> = {};
      await Promise.all(
        data.requestMinteds.map(async (item) => {
          if (!metadataCache[item.id]) {
            try {
              newCache[item.id] = await fetchMetadata(item.uri);
            } catch {
              newCache[item.id] = {
                name: "Offline",
                description: "Gateway Timeout: Metadata unreachable",
              };
            }
          }
        })
      );
      if (Object.keys(newCache).length > 0) {
        setMetadataCache((prev) => ({ ...prev, ...newCache }));
      }
    };
    loadMetadata();
  }, [data]);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500 selection:text-black">
      <Navbar />

      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16"
        >
          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
              USER <span className="text-emerald-500">DASHBOARD</span>
            </h1>
            <p className="text-zinc-500 font-mono text-sm mt-2 uppercase tracking-[0.3em]">Verified Network Assets</p>
          </div>
          
          <div className="bg-zinc-900 border border-white/10 px-6 py-4 rounded-2xl">
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Active Identity</p>
            <p className="font-mono text-emerald-400 text-sm">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Disconnected"}
            </p>
          </div>
        </motion.div>

        {!address && (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
            <h2 className="text-2xl font-light mb-8 text-zinc-500 italic">Authentication required to sync ledger...</h2>
            <button
              onClick={connectWallet}
              className="px-12 py-4 bg-white text-black font-black rounded-full hover:bg-emerald-500 hover:scale-105 transition-all shadow-xl"
            >
              SECURE CONNECT
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center py-20 animate-pulse">
             <p className="text-zinc-600 font-mono uppercase tracking-widest">Querying Subgraph...</p>
          </div>
        )}

        {isError && (
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-3xl text-center">
            <p className="text-red-400 font-mono text-sm uppercase">Network Sync Error: Check Protocol Status</p>
          </div>
        )}

        {address && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence>
              {data.requestMinteds
                .filter((i) => i.to.toLowerCase() === address.toLowerCase())
                .map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                        <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold tracking-tighter">Verified Asset</span>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">ID: {item.tokenId}</span>
                    </div>

                    <RenderIPFSContent data={metadataCache[item.id]} />
                  </motion.div>
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;