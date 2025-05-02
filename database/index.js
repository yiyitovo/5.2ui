const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/makerdao", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const liquidationSchema = new mongoose.Schema({
  user: String,
  liquidator: String,
  repaidAmount: Number,
  collateralSeized: Number,
  timestamp: { type: Date, default: Date.now },
});

const Liquidation = mongoose.model("Liquidation", liquidationSchema);

Liquidation.create({
  user: "0xAbc123...",
  liquidator: "0xDef456...",
  repaidAmount: 100,
  collateralSeized: 0.5,
}).then(() => {
  console.log("Data written successfully!");
  mongoose.disconnect();
});
