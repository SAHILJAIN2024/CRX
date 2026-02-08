import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import {ethers} from "ethers";

import repo from "../crx_backend/routes/repo.route.js"
import commit from "../crx_backend/routes/commit.route.js"


// ✅ Load ABI
import contractABI from "../crx_backend/contractABI/contractABI.js";

// ✅ Environment Variables
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

// ✅ Environment Validation
if (!contractAddress) throw new Error("🚨 CRX_CONTRACT_ADDRESS is not set in .env");
if (!rpcUrl) throw new Error("🚨 RPC_URL is not set in .env");
if (!privateKey) throw new Error("🚨 PRIVATE_KEY is not set in .env");

// ✅ Ethers Setup
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);


const app = express();
import cors from "cors";

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://crx-fplj.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());


app.use("/api",repo);
app.use("/api",commit);
const port = process.env.PORT || 5000;

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Metadata uploader running on port ${port}`);
});


