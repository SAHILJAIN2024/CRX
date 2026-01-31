"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import { useWallet } from "../../components/WalletContext";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

/* ---------------- Types ---------------- */

type Request = {
  id: string;
  tokenId: string;
  to: string;
  uri: string;
};

type GraphResponse = {
  requestMinteds: Request[];
};

/* ---------------- Graph ---------------- */

const GRAPH_URL =
  "https://api.studio.thegraph.com/query/117940/crx-waste-managment/version/latest";

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

/** 🔥 Normalize ANY input → ipfs://CID */
const normalizeToIpfsUri = (input: string): string => {
  if (!input) return "";

  if (input.startsWith("ipfs://")) return input;

  const match = input.match(/\/ipfs\/([^/?#]+)/);
  if (match?.[1]) return `ipfs://${match[1]}`;

  if (/^(Qm|bafy)/.test(input)) return `ipfs://${input}`;

  throw new Error("Invalid IPFS input: " + input);
};

/** Gateways for resilient fetch */
const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
];

/** ipfs://CID → HTTP (UI fetch/preview only) */
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

      // JSON metadata
      if (contentType.includes("application/json")) {
        const json = await res.json();

        // 🔐 Normalize embedded image/file fields
        if (json.image) {
          json.image = normalizeToIpfsUri(json.image);
        }

        return json;
      }

      // Non-JSON → file attachment
      return {
        name: "Attached File",
        description: "This request contains a file attachment",
        image: `ipfs://${cid}`,
        attributes: [
          { trait_type: "Content-Type", value: contentType },
        ],
      };
    } catch {
      continue;
    }
  }

  throw new Error("All IPFS gateways failed");
};

/* ---------------- Renderer ---------------- */

const RenderIPFSContent = ({ data }: { data: any }) => {
  if (!data)
    return <p className="text-gray-400 italic">Loading metadata…</p>;

  const { name, description, image, attributes } = data;

  const ipfsImageUri = image ? normalizeToIpfsUri(image) : null;
  const httpPreviewUrl = ipfsImageUri
    ? ipfsToHttp(ipfsImageUri)
    : null;

  const isImage =
    httpPreviewUrl &&
    /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(httpPreviewUrl);

  return (
    <div className="bg-gray-900 p-4 rounded-xl mt-3 space-y-4">
      <h3 className="text-xl font-bold text-purple-400 text-center">
        {name}
      </h3>

      <p className="text-gray-300 text-center">{description}</p>

      {/* ✅ Open canonical ipfs:// URI */}
      {ipfsImageUri && (
        <div className="text-center">
          <a
            href={ipfsImageUri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 underline break-all"
          >
            Open Attachment
          </a>
        </div>
      )}

      {/* 👁️ HTTP preview only */}
      {isImage && (
        <div className="flex justify-center">
          <img
            src={httpPreviewUrl!}
            alt={name}
            className="max-h-96 rounded-xl border border-purple-600 object-contain"
          />
        </div>
      )}

      {Array.isArray(attributes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {attributes.map((a: any, i: number) => (
            <div
              key={i}
              className="bg-black/40 border border-purple-700 rounded p-3"
            >
              <p className="text-purple-400 font-semibold">
                {a.trait_type}
              </p>
              <p className="text-white break-words">{a.value}</p>
            </div>
          ))}
        </div>
      )}
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
                name: "Metadata unavailable",
                description: "Failed to load metadata",
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
  }, [data]); // ✅ no metadataCache dependency

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#12001f] to-[#2b0040] text-white">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold text-center mb-10">
          🚀 Developer Dashboard
        </h1>

        {!address && (
          <div className="text-center mb-10">
            <button
              onClick={connectWallet}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg hover:scale-105 transition"
            >
              Connect Wallet
            </button>
          </div>
        )}

        {isLoading && <p className="text-center">Loading data…</p>}
        {isError && (
          <p className="text-center text-red-400">
            Graph fetch error
          </p>
        )}

        {address && data && (
          <div className="space-y-8">
            {data.requestMinteds
              .filter(
                (i) => i.to.toLowerCase() === address.toLowerCase()
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-white/10 border border-purple-600 rounded-2xl p-6 shadow-lg"
                >
                  <p className="text-sm text-gray-300 mb-2">
                    Token ID: {item.tokenId}
                  </p>

                  <RenderIPFSContent
                    data={metadataCache[item.id]}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
