const { Schema, model } = require('mongoose');

const lockSchema = new Schema({
  user: { type: String, required: true },
  amount: { type: Number, required: true },
  lockTime: { type: Date, default: Date.now },
  durationSeconds: { type: Number, required: true },
});

module.exports = model('Lock', lockSchema);