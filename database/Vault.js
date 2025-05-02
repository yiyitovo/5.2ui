const { Schema, model } = require('mongoose');

const vaultSchema = new Schema({
  owner: { type: String, required: true },
  collateralAmount: { type: Number, required: true },
  debtAmount: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = model('Vault', vaultSchema);