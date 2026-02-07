import { uploadMetadataToIPFS, uploadFileToIPFS } from "../utils/ipfs.js";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".svg", ".zip", ".gif", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

router.post("/waste", upload.single("file"), async (req, res) => {
  const { ownerAddress, name, wasteType, quantity, location, description} = req.body;
  const file = req.file;

  try {
    let fileIpfsUri = "";
    let fileHttpUri = "";

    if (file) {
      fileIpfsUri = await uploadFileToIPFS(file.path);
      await fs.unlink(file.path);
      console.log(`🧹 Temp file deleted: ${file.path}`);

      fileHttpUri = fileIpfsUri.replace("ipfs://", "https://ipfs.io/ipfs/");
    }

     const metadata = {
      name,
      description,
      image: fileHttpUri,
      attributes: [
        {trait_type: "Owner", value: ownerAddress },
        { trait_type: "Waste Type", value: wasteType },
        { trait_type: "Quantity", value: quantity },
        { trait_type: "Location", value: location },
        {
          trait_type: "Created At",
          value: new Date().toISOString(),
        },
      ],
    };

    const metadataUri = await uploadMetadataToIPFS(metadata);
    const metadataHttpUri = metadataUri.replace(
      "ipfs://",
      "https://ipfs.io/ipfs/"
    );

    res.json({
      success: true,
      metadataUri: metadataUri   
    });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;