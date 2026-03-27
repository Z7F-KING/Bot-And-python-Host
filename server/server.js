require("dotenv").config();
const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const { encrypt, decrypt } = require("./crypto");
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

  const encToken = encrypt(token);

  const file = `
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log('Bot ready: ${name}');
});

client.login("${token}");
`;

  const path = `bots/${name}.js`;
  fs.writeFileSync(path, file);

  exec(`pm2 start ${path} --name ${name}`);

  db.bots.push({ name, token: encToken, status: "online" });
  saveDB();

  res.send({ ok: true });
});

// عرض البوتات
app.get("/bots", verify, (req, res) => {
  res.send(db.bots.map(b => ({ name: b.name, status: b.status })));
});

app.listen(3000, () => console.log("RUNNING"));
