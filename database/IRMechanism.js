const { Schema, model } = require('mongoose');

const irMechanismSchema = new Schema({
  rate: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = model('IRMechanism', irMechanismSchema);