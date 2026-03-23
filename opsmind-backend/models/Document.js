const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  content: String,
  embedding: [Number],
  source: String,
  page: Number,
});

module.exports = mongoose.model("Document", DocumentSchema);