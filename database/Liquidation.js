const { Schema, model } = require('mongoose');

const liquidationSchema = new Schema({
  user: { type: String, required: true },
  liquidator: { type: String, required: true },
  repaidAmount: { type: Number, required: true },
  collateralSeized: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = model('Liquidation', liquidationSchema);