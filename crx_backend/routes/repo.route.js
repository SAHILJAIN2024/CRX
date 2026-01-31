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
  const { ownerAddress, title, description, domain, contributors } = req.body;
  const file = req.file;

  try {
    let imageIpfsUri = "";
    let imageHttpUri = "";

    if (file) {
      imageIpfsUri = await uploadFileToIPFS(file.path);
      await fs.unlink(file.path);

      imageHttpUri = imageIpfsUri.replace(
        "ipfs://",
        "https://ipfs.io/ipfs/"
      );
    }

     const metadata = {
      name: `Waste Request - ${wasteType}`,
      description,
      image: fileHttpUri,
      attributes: [
        { trait_type: "Waste Type", value: wasteType },
        { trait_type: "Quantity", value: quantity },
        { trait_type: "Location", value: location },
        { trait_type: "Status", value: "Requested" },
        {
          trait_type: "Created At",
          value: new Date().toISOString(),
        },
      ],
    };

    const metadataIpfsUri = await uploadMetadataToIPFS(metadata);
    const metadataHttpUri = metadataIpfsUri.replace(
      "ipfs://",
      "https://ipfs.io/ipfs/"
    );

    res.json({
      success: true,
      metadataIpfsUri,   
      metadataHttpUri,   
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