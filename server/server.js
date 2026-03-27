require("dotenv").config();
const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const { encrypt } = require("./crypto");
const { createToken, verify } = require("./auth");

const app = express();
app.use(express.json());
app.use(express.static("public"));

let db = { users: [], bots: [] };

if (fs.existsSync("server/db.json")) {
  db = JSON.parse(fs.readFileSync("server/db.json"));
}

function saveDB() {
  fs.writeFileSync("server/db.json", JSON.stringify(db, null, 2));
}

// تسجيل
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (db.users.find(u => u.username === username))
    return res.status(400).send({ error: "User exists" });

  db.users.push({ username, password });
  saveDB();
  res.send({ ok: true });
});

// تسجيل دخول
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.users.find(u => u.username === username && u.password === password);
  if (!user) return res.sendStatus(401);
  res.send({ token: createToken(username) });
});

// إضافة بوت
app.post("/add-bot", verify, (req, res) => {
  const { name, token } = req.body;
  if (!name || !token) return res.status(400).send({ error: "Missing data" });

  const encToken = encrypt(token);

  const fileContent = `
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log('Bot ready: ${name}');
});

client.login("${token}");
`;

  const path = `server/bots/${name}.js`;
  if (!fs.existsSync("server/bots")) fs.mkdirSync("server/bots");
  fs.writeFileSync(path, fileContent);

  exec(`pm2 start ${path} --name ${name}`, (err) => {
    if (err) console.log(err);
  });

  db.bots.push({ name, token: encToken, status: "online" });
  saveDB();

  res.send({ ok: true });
});

// جلب البوتات
app.get("/bots", verify, (req, res) => {
  res.send(db.bots.map(b => ({ name: b.name, status: b.status })));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
