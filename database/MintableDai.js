const { Schema, model } = require('mongoose');

const mintableDaiSchema = new Schema({
  holder: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  lastMintedAt: { type: Date },
});

module.exports = model('MintableDai', mintableDaiSchema);