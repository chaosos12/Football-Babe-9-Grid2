import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // In-memory database for demo purposes
  let userBalance = 1000;
  let gameHistory: any[] = [];
  let nextRecordId = 1;

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Get user balance
  app.get("/api/user/balance", (req, res) => {
    res.json({ balance: userBalance });
  });

  // Get game history
  app.get("/api/game/history", (req, res) => {
    res.json({ history: gameHistory });
  });

  // Play a game round
  app.post("/api/game/play", (req, res) => {
    const { bets, gridSize } = req.body;

    if (!bets || typeof bets !== 'object' || Object.keys(bets).length === 0) {
      return res.status(400).json({ error: "Invalid bets" });
    }

    if (![9, 16, 32].includes(gridSize)) {
      return res.status(400).json({ error: "Invalid grid size" });
    }

    const totalBet = Object.values(bets).reduce((sum: number, bet: any) => sum + Number(bet), 0) as number;

    if (userBalance < totalBet) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Deduct bet amount
    userBalance -= totalBet;

    // Game Logic: Pick exactly ONE winning number
    const allIds = Array.from({ length: gridSize }, (_, i) => i + 1);
    const winningId = allIds[Math.floor(Math.random() * allIds.length)];
    
    // Check if user won
    const isWin = !!bets[winningId];
    const winAmount = isWin ? Number(bets[winningId]) * gridSize : 0;
    
    // Add winnings
    userBalance += winAmount;

    // Create record
    const record = {
      id: nextRecordId++,
      timestamp: new Date().toISOString(),
      bets,
      totalBet,
      winningNumber: winningId,
      isWin,
      winAmount,
      gridSize,
      // The frontend will attach the videoUrl later, or we could pass it here if the backend knew the video URLs
    };

    // Save to history (keep last 50)
    gameHistory.unshift(record);
    if (gameHistory.length > 50) {
      gameHistory.pop();
    }

    // Send response
    res.json({
      success: true,
      result: {
        winningNumber: winningId,
        isWin,
        winAmount,
        newBalance: userBalance
      },
      record
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
