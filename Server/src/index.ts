import express from "express";
import popollingRoutes from "./routes/popollingRoutes";

const app = express();
const PORT = 4000;

app.use(express.json());

// ✅ Popolling API
app.use("/popollings", popollingRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Popolling Server running at http://localhost:${PORT}`);
});
