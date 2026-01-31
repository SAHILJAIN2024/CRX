"use client";

import React, { useState } from "react";
import Navbar from "../components/navbar_home";
import { useWallet } from "../components/WalletContext";
import { useRouter } from "next/navigation";
import Signup from "../components/signup";
import { FaLinkedin, FaGithub } from "react-icons/fa";
// ---------- Features ----------
const features = [
  { title: "Decentralized Repository Storage", description: "Store your repositories on IPFS or Arweave with content-addressed immutable files." },
  { title: "On-Chain Commit Tracking", description: "Record commit metadata, hashes, and timestamps on blockchain for tamper-proof history." },
  { title: "Tokenized Contribution System", description: "Contributors earn NFTs, fractional ownership, and reputation tokens for their work." },
  { title: "Decentralized Pull Requests & Code Reviews", description: "Smart contract-based PR approvals with reputation-weighted votes and merge tracking." },
  { title: "Forks & Branch Management", description: "Track forks and branches on-chain while preserving merge history." },
  { title: "Access Control & Permissions", description: "Dynamic role management using smart contracts for secure collaboration." },
  { title: "Issue Tracking & Bounties", description: "On-chain issues, labels, and bounties with transparent workflow and rewards." },
  { title: "Security & Auditability", description: "Tamper-proof logs, verifiable commits, and escrowed bounty systems." },
  { title: "Marketplace & NFT Ownership", description: "Fractionalized NFT representation of repos and tokenized royalties for contributors." },
];




// ---------- Component ----------
const Dashboard: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { address } = useWallet();

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#1E003E] to-[#4A0072] text-white font-sans flex flex-col py-4">
      <Navbar />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center px-6 md:px-20 gap-8 md:gap-12 flex-1">
        {/* Left Image with Neon Ring */}
        <div className="flex justify-center">
          <div className="rounded-full p-2 bg-gradient-to-r from-[#9D00FF] to-[#0A0A0A] shadow-[0_0_40px_#9D00FF]">
            <img
              src="/CODE BLOCK.png"
              alt="CODE BLOCK Logo"
              className="rounded-full w-64 h-64 sm:w-80 sm:h-80 md:w-[450px] md:h-[450px] lg:w-[550px] lg:h-[550px] object-cover border-4 border-[#0A0A0A]"
            />
          </div>
        </div>

        {/* Right Text */}
        <div className="max-w-lg text-center md:text-left md:ml-20 lg:ml-32">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-[#9D00FF] to-[#f6f5f5] bg-clip-text text-transparent drop-shadow-[0_0_20px_#1E003E]">
              CODE
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#9D00FF] to-[#f6f5f5] bg-clip-text text-transparent drop-shadow-[0_0_20px_#1E003E] md:pl-20 lg:pl-28">
              BLOCK
            </span>
          </h1>

          <p className="mt-6 text-gray-300 leading-relaxed text-lg sm:text-xl md:text-2xl">
            Tired of storing your code snippets in messy text files or unreliable note-taking apps?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start mt-8 gap-6">
            <div className="px-4 py-2 bg-white/10 rounded-full text-sm text-gray-200 backdrop-blur-md border border-white/20">
              Presented By: Sahil Jain
            </div>
            <Signup />
          </div>
        </div>
      </div>

      {/* Intro Text */}
      <section id="about">
        <div className="mt-8 md:mt-12 text-gray-400 text-lg sm:text-xl md:text-3xl text-center px-6 md:px-20">
          Welcome to CODE BLOCK, the ultimate platform for developers to securely store, manage, and share their code snippets with ease.
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <div className="mt-12 px-6 md:px-20">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-[#9D00FF] mb-8">
            GitHub on Blockchain Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/5 rounded-xl p-6 border border-white/20 hover:scale-105 transition-transform shadow-lg"
              >
                <h3 className="text-xl md:text-2xl font-semibold text-[#E0C0FF] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-sm md:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

<div className="mt-12 px-4 sm:px-8 md:px-20 lg:px-32">
  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-[#9D00FF] mb-10 tracking-wide">
    DEVELOPER'S CORNER
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-16 flex-1">
    {/* Left Image with Neon Ring */}
    <div className="flex justify-center">
      <div className="rounded-full p-[3px] bg-gradient-to-r from-[#9D00FF] to-[#0A0A0A] shadow-[0_0_25px_#9D00FF]">
        <img
          src="/devloper.jpeg"
          alt="Developer Image"
          className="rounded-full w-36 h-36 sm:w-48 sm:h-48 md:w-[260px] md:h-[260px] lg:w-[340px] lg:h-[340px] object-cover border-4 border-[#0A0A0A]"
        />
      </div>
    </div>

    {/* Right Text */}
    <div className="max-w-xl text-center md:text-left mx-auto md:mx-0">
      <p className="text-gray-300 leading-relaxed text-base sm:text-lg md:text-xl">
        Hello World! I'm{" "}
        <span className="text-[#9D00FF] font-semibold">Sahil Jain</span>, a passionate developer and
        the creator of CODE BLOCK. With a deep love for coding and blockchain technology, I embarked
        on this journey to revolutionize how developers manage and share their code snippets.
      </p>

      <p className="mt-5 text-gray-300 leading-relaxed text-base sm:text-lg md:text-xl">
        My vision is to create a secure, decentralized platform that empowers developers worldwide
        to collaborate seamlessly and protect their valuable code. When I'm not coding, you can find
        me exploring new tech trends, contributing to open-source projects, or sharing knowledge
        with the dev community. Let's build the future of coding together!
      </p>

      {/* Contact Links */}
      <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start mt-8 gap-4 sm:gap-6">
        <div className="px-5 py-3 bg-white/10 rounded-full text-sm sm:text-base text-gray-200 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="https://www.linkedin.com/in/sahil-jain-610907211/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[#c77aff] transition-colors"
          >
            <FaLinkedin className="text-[#9D00FF] text-xl" />
            <span>LinkedIn</span>
          </a>

          <a
            href="https://github.com/SAHILJAIN2024"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-[#c77aff] transition-colors"
          >
            <FaGithub className="text-[#9D00FF] text-xl" />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>


      {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-8 mb-4">
        <hr className="border-t border-gray-700 mx-6 md:mx-20 mb-4" />
        © 2024 CODE BLOCK. All rights reserved.
      </div>

      {/* Query Data Render */}
      
      
    </div>
  );
};

export default Dashboard;
