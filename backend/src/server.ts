import express from "express";
import type { Request, Response } from "express";


const app = express();
app.use(express.json());

app.get("/ping", (req: Request, res: Response) => {
  res.status(200).send("PokerCircle backend running");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
