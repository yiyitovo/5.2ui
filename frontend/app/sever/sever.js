import express from "express";
import { getVaultById } from "./vaultController.js";

const app = express();
const PORT = 3001;

app.get("/api/vaults/:id", getVaultById);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
