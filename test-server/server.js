// mock-backend.js
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");

app.use((req, res, next) => {
  if (req.path.endsWith(".js")) {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
  next();
});
app.use(express.static(path.join(__dirname, "public")));


app.use(
  cors({
    origin: "*",  // ✅ allow all domains
    credentials: false, // ⚠️ must be false when origin is "*"
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  })
);
app.use(express.json());
app.use((req, res, next) => {
  console.log("Incoming Origin:", req.headers.origin);
  next();
});

// Middleware to check API key
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== "test-api-key-123") {
    return res.status(403).json({ message: "Forbidden: Invalid API Key" });
  }
  next();
});

// GET /api/setting/site/:partnerId
app.get("/api/setting/site/:partnerId", (req, res) => {
  const { partnerId } = req.params;

  // Example mock data
  const mockSettings = {
    abc123: {
      logo: "abc123-logo.png",
      topImage: "abc123-top.png",
      mainColor: "#FF0000",
      subColor: "#00FF00",
      headerTextColor: "#000000",
      headerText: "Welcome from Partner abc123",
      status: "ACTIVE",
    },
    fg001: {
      logo: "fg001-logo.png",
      topImage: "fg001-top.png",
      mainColor: "#0000FF",
      subColor: "#FFFF00",
      headerTextColor: "#FFFFFF",
      headerText: "Welcome from Partner fg001",
      status: "ACTIVE",
    },
  };

  const settings = mockSettings[partnerId] || {
    logo: "default-logo.png",
    topImage: "default-top.png",
    mainColor: "#333333",
    subColor: "#666666",
    headerTextColor: "#FFFFFF",
    headerText: "Default Partner",
    status: "INACTIVE",
  };

  res.json(settings);
});

// POST /api/v1/makeshop-linking
app.post("/api/v1/makeshop-linking", (req, res) => {
  const { partnerId, memberId, orderId, session } = req.body;

  if (!partnerId) {
    return res.status(400).json({
      msg: "有効なショップIDを入力してください。",
      path: "partnerId",
    });
  }

  if (orderId) {
    return res.status(201).json({ message: "注文が正常に登録されました。" });
  } else {
    return res.status(201).json({ message: "会員登録に成功されました。" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Mock backend running on http://localhost:${PORT}`);
});
