import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";
import mime from "mime";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

if (!process.env.PINATA_JWT) {
  throw new Error("❌ Missing PINATA_JWT in .env");
}

const PINATA_API = "https://api.pinata.cloud/pinning";

// ------------------------------
// Upload single file to Pinata
// ------------------------------
export async function uploadFileToIPFS(filePath) {
  try {
    const fileName = path.basename(filePath);
    const fileType = mime.getType(filePath) || "application/octet-stream";

    const form = new FormData();

    // Append file stream with explicit content type + filename
    form.append("file", fs.createReadStream(filePath), {
      filename: fileName,
      contentType: fileType,
    });

    // Metadata
    form.append("pinataMetadata", JSON.stringify({ name: fileName }));

    // Options
    form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const res = await fetch(`${PINATA_API}/pinFileToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        ...form.getHeaders(), // must come *after* auth
      },
      body: form,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    console.log("✅ File uploaded:", `ipfs://${data.IpfsHash}`);
    return `ipfs://${data.IpfsHash}`;
  } catch (err) {
    console.error("❌ File upload failed:", err.message);
    throw err;
  }
}

// ------------------------------
// Upload JSON metadata to Pinata
// ------------------------------
export async function uploadMetadataToIPFS(metadata) {
  try {
    const res = await fetch(`${PINATA_API}/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const data = await res.json();
    console.log("✅ Metadata uploaded:", `ipfs://${data.IpfsHash}`);
    return `ipfs://${data.IpfsHash}`;
  } catch (err) {
    console.error("❌ Metadata upload failed:", err.message);
    throw err;
  }
}

// ------------------------------
// Gateway helper
// ------------------------------
export const gatewayUrl = (cidOrUri) =>
  `https://gateway.pinata.cloud/ipfs/${String(cidOrUri).replace(/^ipfs:\/\//, "")}`;


// ------------------------------
// Get JSON content from IPFS
// ------------------------------
export async function ipfsToHttp(ipfsUri) {
  if (!ipfsUri) return "";
  return ipfsUri.replace("ipfs://", "https://ipfs.io/ipfs/");
}

export async function fetchIPFS(ipfsUri) {
  try {
    const url = ipfsToHttp(ipfsUri);
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch IPFS content");
    return await response.json();
  } catch (err) {
    console.error("❌ IPFS Fetch Error:", err);
    throw err;
  }
}




// // utils/ipfs.js
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";
// import fs from "fs";
// import mime from "mime";
// import FormData from "form-data"; // for Node.js

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// dotenv.config({ path: path.join(__dirname, "../.env") });

// if (!process.env.PINATA_JWT) {
//   throw new Error("❌ Missing PINATA_JWT in .env");
// }

// const PINATA_API = "https://api.pinata.cloud/pinning";

// // Upload file to IPFS
// export async function uploadFileToIPFS(filePath) {
//   try {
//     const fileName = path.basename(filePath);
//     const type = mime.getType(filePath) || "application/octet-stream";

//     const form = new FormData();
//     form.append("file", fs.createReadStream(filePath), {
//       filename: fileName,
//       contentType: type,
//     });

//     const res = await fetch(`${PINATA_API}/pinFileToIPFS`, {
//       method: "POST",
//       headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
//       body: form,
//     });

//     if (!res.ok) throw new Error(await res.text());
//     const data = await res.json();
//     console.log("✅ File uploaded:", `ipfs://${data.IpfsHash}`);
//     return `ipfs://${data.IpfsHash}`;
//   } catch (err) {
//     console.error("❌ File upload failed:", err.message);
//     throw err;
//   }
// }

// // Upload JSON metadata to IPFS
// export async function uploadMetadataToIPFS(metadata) {
//   try {
//     if (!metadata || typeof metadata !== "object") {
//       throw new Error("Metadata must be an object");
//     }

//     const res = await fetch(`${PINATA_API}/pinJSONToIPFS`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${process.env.PINATA_JWT}`,
//       },
//       body: JSON.stringify(metadata),
//     });

//     if (!res.ok) throw new Error(await res.text());
//     const data = await res.json();
//     console.log("✅ Metadata uploaded:", `ipfs://${data.IpfsHash}`);
//     return `ipfs://${data.IpfsHash}`;
//   } catch (err) {
//     console.error("❌ Metadata upload failed:", err.message);
//     throw err;
//   }
// }

// // Gateway URL helper
// export const gatewayUrl = (cidOrUri) =>
//   `https://gateway.pinata.cloud/ipfs/${String(cidOrUri).replace(/^ipfs:\/\//, "")}`;
