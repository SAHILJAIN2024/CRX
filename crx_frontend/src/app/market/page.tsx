"use client";

import React, { useEffect, useState } from "react";
import Navbar from "../../components/navbar";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

/* ---------------- Types ---------------- */

type RequestMinted = {
  id: string;
  to: string;
  tokenId: string;
  uri: string;
};

type CommitMinted = {
  id: string;
  to: string;
  tokenId: string;
  requestId: string;
  uri: string;
};

type GraphResponse = {
  requestMinteds: RequestMinted[];
  commitMinteds: CommitMinted[];
};

/* ---------------- GraphQL ---------------- */

const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/117940/crx-waste-managment/version/latest";

const QUERY = gql`
{
  requestMinteds(first: 50, orderBy: blockTimestamp, orderDirection: desc) {
    id
    to
    tokenId
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

/* ---------------- IPFS Helpers ---------------- */

const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
];

const normalizeToIpfsUri = (input: string): string => {
  if (!input) return "";
  if (input.startsWith("ipfs://")) return input;
  const match = input.match(/\/ipfs\/([^/?#]+)/);
  if (match?.[1]) return `ipfs://${match[1]}`;
  if (/^(Qm|bafy)/.test(input)) return `ipfs://${input}`;
  return "";
};

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

      // Fallback for non-JSON files
      return {
        name: "Attached File",
        description: "This request contains a file attachment",
        image: `ipfs://${cid}`,
        attributes: [{ trait_type: "Content-Type", value: contentType }],
      };
    } catch {
      continue;
    }
  }
  return { name: "Metadata unavailable", description: "Failed to fetch" };
};

/* ---------------- Status Helper ---------------- */

const getStatus = (commitCount: number) => {
  if (commitCount >= 3) return { label: "Utilized by Company Hub", step: 3 };
  if (commitCount === 2) return { label: "Forwarded by Recycler", step: 2 };
  if (commitCount === 1) return { label: "Forwarded by Collector", step: 1 };
  return { label: "Request Created", step: 0 };
};

/* ---------------- Render IPFS Metadata ---------------- */

const RenderIPFSContent = ({ data }: { data: any }) => {
  if (!data) return <p className="text-gray-400 italic">Loading metadata…</p>;

  const { name, description, image, attributes } = data;
  const ipfsImageUri = image ? normalizeToIpfsUri(image) : null;
  const httpPreviewUrl = ipfsImageUri ? ipfsToHttp(ipfsImageUri) : null;
  const isImage = httpPreviewUrl && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(httpPreviewUrl);

  return (
    <div className="bg-gray-900 p-4 rounded-xl mt-3 space-y-4">
      <h3 className="text-xl font-bold text-purple-400 text-center">{name}</h3>
      <p className="text-gray-300 text-center">{description}</p>

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
            <div key={i} className="bg-black/40 border border-purple-700 rounded p-3">
              <p className="text-purple-400 font-semibold">{a.trait_type}</p>
              <p className="text-white break-words">{a.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------- Community Page ---------------- */

export default function CommunityPage() {
  const [requests, setRequests] = useState<
    (RequestMinted & { commits: CommitMinted[]; metadata?: any })[]
  >([]);
  const [metadataCache, setMetadataCache] = useState<Record<string, any>>({});

  const { data, isLoading, error } = useQuery<GraphResponse>({
    queryKey: ["communityRequests"],
    queryFn: async () => request<GraphResponse>(SUBGRAPH_URL, QUERY),
  });

  useEffect(() => {
    if (!data) return;

    // Map commits to requestId
    const commitMap: Record<string, CommitMinted[]> = {};
    data.commitMinteds.forEach((commit) => {
      if (!commitMap[commit.requestId]) commitMap[commit.requestId] = [];
      commitMap[commit.requestId].push(commit);
    });

    // Merge commits into requests
    const merged = data.requestMinteds.map((req) => ({
      ...req,
      commits: commitMap[req.tokenId] || [],
    }));

    setRequests(merged);

    // Load metadata for all requests
    merged.forEach(async (req) => {
      if (!metadataCache[req.id]) {
        try {
          const meta = await fetchMetadata(req.uri);
          setMetadataCache((prev) => ({ ...prev, [req.id]: meta }));
        } catch {
          setMetadataCache((prev) => ({
            ...prev,
            [req.id]: { name: "Unavailable", description: "Failed to load" },
          }));
        }
      }
    });
  }, [data]);

  if (error)
    return (
      <div className="text-red-400 text-center mt-10">
        Failed to load data from subgraph
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1E003E] to-[#4A0072] text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">
          🌍 Community Waste Requests
        </h1>
        <p className="text-center text-gray-300 mb-12">
          All requests and commits minted on-chain
        </p>

        {isLoading && <p className="text-center">Loading requests...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {requests.map((req) => {
            const commitCount = req.commits.length;
            const status = getStatus(commitCount);
            const metadata = metadataCache[req.id];

            return (
              <div
                key={req.id}
                className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md"
              >
                {/* Status Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Request</span>
                    <span>Collector</span>
                    <span>Recycler</span>
                    <span>Company</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-[#9D00FF]"
                      style={{ width: `${(status.step / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm mt-2 text-[#9D00FF] font-semibold">
                    {status.label}
                  </p>
                </div>

                {/* Request Info */}
                <p className="font-bold text-lg">🧾 Request Token #{req.tokenId}</p>
                <p className="text-sm text-gray-300 mt-1">
                  Minted to: <span className="text-gray-400 break-all">{req.to}</span>
                </p>

                {/* Request Metadata */}
                {metadata && <RenderIPFSContent data={metadata} />}

                {/* Commits */}
                <div className="mt-4">
                  <p className="font-semibold mb-2">🔁 Commits ({commitCount})</p>
                  {req.commits.map((commit) => {
                    const commitMeta = metadataCache[commit.id];
                    return (
                      <div key={commit.id} className="mb-3">
                        <p className="text-sm text-gray-300">
                          • Commit #{commit.tokenId} → minted to{" "}
                          <span className="break-all text-gray-400">{commit.to}</span>
                        </p>
                        {commitMeta && <RenderIPFSContent data={commitMeta} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
