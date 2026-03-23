const express = require("express");
const runRAG = require("../services/rag");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    const result = await runRAG(query);

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error in chat");
  }
});

module.exports = router;