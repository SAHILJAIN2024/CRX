// services/contract.service.js
import ethers from "ethers";
import dotenv from "dotenv";
import contractABI from "../contractABI/contractABI.js";

dotenv.config();

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
const privateKey = process.env.PRIVATE_KEY;

// ✅ Ethers Setup
const provider = new ethers.JsonRpcProvider(rpcUrl);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// 🔹 Service Functions
export const mintRepository = async (metadataCid) => {
  const tx = await contract.mintRepository(metadataCid);
  return tx.wait(); // returns tx receipt
};

export const mintCommit = async (repoId, metadataCid) => {
  const tx = await contract.mintCommit(repoId, metadataCid);
  return tx.wait();
};

export const mintFork = async (repoId, metadataCid) => {
  const tx = await contract.mintFork(repoId, metadataCid);
  return tx.wait();
};

export const mintBadge = async (user, badgeType) => {
  const tx = await contract.mintBadge(user, badgeType);
  return tx.wait();
};

export default {
  mintRepository,
  mintCommit,
  mintFork,
  mintBadge,
};
