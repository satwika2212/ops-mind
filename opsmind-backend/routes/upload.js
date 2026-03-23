const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Document = require("../models/Document");
const chunkText = require("../services/chunking");
const getEmbedding = require("../services/embedding");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const fs = require("fs");

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    const chunks = chunkText(pdfData.text);

    for (let chunk of chunks) {
      const embedding = await getEmbedding(chunk);

      await Document.create({
        content: chunk,
        embedding,
        source: req.file.originalname,
        page: 1,
      });
    }

    res.json({ message: "File processed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing file");
  }
});

module.exports = router;