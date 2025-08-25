import express from "express";

const app = express();
const PORT = 4000;

app.get("/", (req, res) => {
  res.send("Popolling Server Running ?");
});

app.listen(PORT, () => {
  console.log(`? Server running at http://localhost:${PORT}`);
});
