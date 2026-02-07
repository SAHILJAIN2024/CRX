"use client";

import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../../components/navbar";
import { useWallet } from "../../components/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";
import { motion, AnimatePresence } from "framer-motion";

/* ---------------- Types & Constants ---------------- */
type Request = { id: string; tokenId: string; to: string; uri: string; owner: string; };
type CommitType = { id: string; repoId: string; commitId: string; requestId: string; to: string; tokenId: string; uri: string; };
type GraphResponse = { requestMinteds: Request[];
  commitMinteds: CommitType[];
 };

const GRAPH_URL = "https://api.studio.thegraph.com/query/117940/crx-waste-managment/version/latest";
const QUERY = gql`
  {
    requestMinteds(first: 50, orderBy: blockTimestamp, orderDirection: desc) {
      id
      tokenId
      to
      uri
    }
      commitMinteds(first: 100, orderBy: blockTimestamp, orderDirection: asc) {
    id
    to
    tokenId
    requestId
    uri
  }
  }
`;

const GATEWAYS = [
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
];

/* ---------------- IPFS Helpers ---------------- */
const fetchIPFS = async (cidOrUri: string) => {
  try {
    if (!cidOrUri) return null;
    let urlToFetch: string;

    if (cidOrUri.startsWith("ipfs://")) {
      urlToFetch = cidOrUri.replace("ipfs://", "https://ipfs.io/ipfs/");
    } else if (cidOrUri.startsWith("http")) {
      urlToFetch = cidOrUri;
    } else {
      urlToFetch = `https://gateway.pinata.cloud/ipfs/${cidOrUri}`;
    }

    const res = await fetch(urlToFetch);
    if (!res.ok) throw new Error(`Failed to fetch IPFS data: ${res.status}`);

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return await res.json();
    if (contentType.includes("text")) return await res.text();
    return await res.blob();
  } catch (err) {
    console.error("IPFS fetch error:", err, cidOrUri);
    return null;
  }
};

const RenderIPFSContent = ({ data }: { data: any }) => {
  if (!data) return (
    <div className="flex flex-col items-center py-10 space-y-3">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">Decrypting Ledger...</p>
    </div>
  );

  if (typeof data === "string") {
    return (
      <pre className="whitespace-pre-wrap bg-black/60 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-emerald-500/20 mt-2 overflow-x-auto">
        {data}
      </pre>
    );
  }

  if (data instanceof Blob) {
    const objectUrl = URL.createObjectURL(data);
    return (
      <div className="mt-4">
        <a
          href={objectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-emerald-600 hover:bg-emerald-500 text-black font-black py-3 px-4 rounded-xl text-center uppercase text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          View Attachment
        </a>
      </div>
    );
  }

  if (typeof data === "object") {
    const { name, description, image, file, attributes, ...rest } = data;

    const getLink = (f: any, type: "File" | "Image") => {
      if (!f) return null;
      if (typeof f === "string") {
        let href = f;
        if (f.startsWith("ipfs://")) {
          href = f.replace("ipfs://", "https://ipfs.io/ipfs/");
        }
        return { href, label: `Open ${type}` };
      }
      if (f instanceof Blob) {
        return { href: URL.createObjectURL(f), label: `Open ${type}` };
      }
      return null;
    };

    const imageLink = getLink(image, "Image");
    const fileLink = getLink(file, "File");

    return (
      <div className="mt-2 space-y-6">
        <div className="text-center">
          {name && <h3 className="text-2xl font-black text-white tracking-tighter uppercase">{name}</h3>}
          {description && <p className="text-zinc-400 text-sm mt-1 leading-relaxed italic">{description}</p>}
        </div>

        {Array.isArray(attributes) && attributes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attributes.map((attr, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-xl">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">{attr.trait_type}</span>
                <p className="text-zinc-200 text-sm mt-1 font-mono truncate">{attr.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(rest).map(([key, value]) => (
            <div key={key} className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">{key}</span>
              <p className="text-zinc-300 text-xs mt-1 truncate">
                {Array.isArray(value)
                  ? value.map((v) => (typeof v === "object" ? JSON.stringify(v) : v)).join(", ")
                  : String(value)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {imageLink && (
            <a
              href={imageLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-100 hover:bg-white text-black font-black py-3 px-4 rounded-xl text-center uppercase text-xs tracking-widest transition-all"
            >
              {imageLink.label}
            </a>
          )}
          {fileLink && (
            <a
              href={fileLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-black font-black py-3 px-4 rounded-xl text-center uppercase text-xs tracking-widest transition-all"
            >
              {fileLink.label}
            </a>
          )}
        </div>
      </div>
    );
  }

  return <p className="text-zinc-500 mt-2 font-mono text-xs">Unknown Asset Format</p>;
};

/* ---------------- Recommendations Logic ---------------- */
/* ---------------- AI-Powered Recommendations ---------------- */

// type AIInsight = {
//   type: string;
//   model?: string;
//   risk?: string;
//   recommendation?: string;
//   confidence?: string;
// };

// const RecommendationSection = ({
//   metadataCache,
//   userRequests,
//   commits,
// }: {
//   metadataCache: Record<string, any>;
//   userRequests: any[];
//   commits: any[];
// }) => {

//   const insights = useMemo<AIInsight[]>(() => {
//     return commits
//       .map((commit) => {
//         const meta = metadataCache[commit.id];
//         if (!meta?.attributes) return null;

//         const attr = (key: string) =>
//           meta.attributes.find((a: any) =>
//             a.trait_type?.toLowerCase() === key.toLowerCase()
//           )?.value;

//         return {
//           type: attr("type"),
//           model: attr("ai_model"),
//           risk: attr("risk_score"),
//           recommendation: attr("recommendation"),
//           confidence: attr("confidence"),
//         };
//       })
//       .filter(Boolean) as AIInsight[];
//   }, [metadataCache, commits]);

//   if (insights.length === 0) return null;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="mb-12 p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/20 shadow-2xl"
//     >
//       <div className="flex items-center gap-3 mb-8">
//         <span className="text-2xl">🤖</span>
//         <h2 className="text-xl font-black font-mono uppercase tracking-widest text-emerald-400">
//           AI SYSTEM INSIGHTS
//         </h2>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//         {insights.map((insight, idx) => (
//           <motion.div
//             key={idx}
//             whileHover={{ scale: 1.02 }}
//             className="bg-black/50 p-6 rounded-2xl border border-white/5 space-y-4"
//           >
//             <div className="flex justify-between items-center">
//               <span className="text-[10px] uppercase tracking-widest text-zinc-500">
//                 Asset Type
//               </span>
//               <span className="text-xs font-mono text-emerald-400">
//                 {insight.type || "Unknown"}
//               </span>
//             </div>

//             <div className="border-t border-white/5 pt-4 space-y-2">
//               <p className="text-xs text-zinc-400 uppercase font-bold">
//                 AI Model
//               </p>
//               <p className="text-sm font-mono text-zinc-200">
//                 {insight.model || "On-chain Heuristic"}
//               </p>
//             </div>

//             {insight.risk && (
//               <div className="pt-2">
//                 <p className="text-xs uppercase text-zinc-500">Risk Score</p>
//                 <p className="text-lg font-black text-red-400">
//                   {(Number(insight.risk) * 100).toFixed(1)}%
//                 </p>
//               </div>
//             )}

//             {insight.recommendation && (
//               <div className="pt-3 border-t border-white/5">
//                 <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">
//                   System Recommendation
//                 </p>
//                 <p className="text-sm text-emerald-300 font-semibold leading-snug">
//                   {insight.recommendation}
//                 </p>
//               </div>
//             )}

//             {insight.confidence && (
//               <div className="pt-2 text-right">
//                 <span className="text-[10px] text-zinc-500 uppercase">
//                   Confidence
//                 </span>
//                 <span className="ml-2 text-xs font-mono text-emerald-500">
//                   {insight.confidence}
//                 </span>
//               </div>
//             )}
//           </motion.div>
//         ))}
//       </div>
//     </motion.div>
//   );
// };

/* ---------------- Dashboard ---------------- */
const Dashboard = () => {
  const { address, connectWallet } = useWallet();
  const [metadataCache, setMetadataCache] = useState<Record<string, any>>({});

  const { data, isLoading, isError } = useQuery<GraphResponse>({
    queryKey: ["graph-data"],
    queryFn: () => request(GRAPH_URL, QUERY),
  });

  const userRequests = useMemo(() => {
    if (!address || !data) return [];
    return data.requestMinteds.filter(i => i.to.toLowerCase() === address.toLowerCase());
  }, [data, address]);

 useEffect(() => {
  if (!data) return;

  const loadMetadata = async () => {
    const newCache: Record<string, any> = {};

    // 🔹 FETCH REQUEST METADATA (FIX)
    await Promise.all(
      data.requestMinteds.map(async (req) => {
        if (!metadataCache[req.id]) {
          try {
            newCache[req.id] = await fetchIPFS(req.uri);
          } catch {
            newCache[req.id] = {
              name: "Offline Request",
              description: "Metadata timeout",
            };
          }
        }
      })
    );

    // 🔹 FETCH COMMIT METADATA (UNCHANGED)
    await Promise.all(
      data.commitMinteds.map(async (commit) => {
        if (!metadataCache[commit.id]) {
          try {
            newCache[commit.id] = await fetchIPFS(commit.uri);
          } catch {
            newCache[commit.id] = {
              name: "Offline Commit",
              description: "Metadata timeout",
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
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      <Navbar />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10 pt-24 md:pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 md:mb-16"
        >
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter leading-none">
              USER <span className="text-emerald-500">DASHBOARD</span>
            </h1>
            <p className="text-zinc-500 font-mono text-[10px] md:text-sm mt-3 md:mt-2 uppercase tracking-[0.2em]">Verified Ledger Assets</p>
          </div>
          
          <div className="w-full md:w-auto bg-zinc-900 border border-white/10 px-6 py-4 rounded-2xl">
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Active Identity</p>
            <p className="font-mono text-emerald-400 text-sm">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Disconnected"}
            </p>
          </div>
        </motion.div>

        {!address ? (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
            <h2 className="text-2xl font-light mb-8 text-zinc-500 italic">Authentication required...</h2>
            <button onClick={connectWallet} className="px-12 py-4 bg-white text-black font-black rounded-full hover:bg-emerald-500 transition-all shadow-xl">
              SECURE CONNECT
            </button>
          </div>
        ) : (
          <>
            {/* <RecommendationSection
  metadataCache={metadataCache}
  userRequests={userRequests}
  commits={data?.commitMinteds || []}
/> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <AnimatePresence>
                {isLoading ? (
                  [...Array(4)].map((_, i) => <div key={i} className="h-80 bg-zinc-900/50 rounded-[2.5rem] animate-pulse" />)
                ) : userRequests.length > 0 ? (
                  userRequests.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-2xl hover:border-emerald-500/30 transition-all flex flex-col"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                          <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold">Validated</span>
                        </div>
                        <span className="text-xs font-mono text-zinc-500">ID: {item.tokenId}</span>
                      </div>
                      <RenderIPFSContent data={metadataCache[item.id]} />
                      {data?.commitMinteds?.some(
  (c) => c.requestId === item.tokenId
) ? (
  <section className="mt-6">
    <h2 className="text-lg font-bold mb-2">📝 Commits</h2>

    <ul className="space-y-4">
      {data.commitMinteds
        .filter((c) => c.requestId === item.tokenId)
        .map((c) => (
          <li
            key={c.id}
            className="p-4 bg-white/10 rounded-xl border border-blue-600 shadow-lg"
          >
            <p className="font-semibold">
              Commit #{c.tokenId}
            </p>

            <RenderIPFSContent data={metadataCache[c.id]} />
          </li>
        ))}
    </ul>
  </section>
) : (
  <p className="text-gray-400 mt-2">No commits found</p>
)}
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-40 text-center opacity-30 font-mono uppercase tracking-widest">
                    No records found for this identity.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;