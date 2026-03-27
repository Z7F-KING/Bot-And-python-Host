const API = "https://bot-and-python-host.onrender.com";
const token = localStorage.getItem("token");

if (!token) window.location.href = "index.html";

async function addBot() {
  const name = document.getElementById("name").value;
  const tokenInput = document.getElementById("token").value;

  await fetch(API + "/add-bot", {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": token
    },
    body: JSON.stringify({ name, token: tokenInput })
  });

  loadBots();
}

async function loadBots() {
  const res = await fetch(API + "/bots", {
    headers: { Authorization: token }
  });

  const data = await res.json();
  const div = document.getElementById("bots");
  div.innerHTML = "";

  data.forEach(bot => {
    div.innerHTML += `
      <div class="bot">
        <h3><i class="fa-solid fa-robot"></i> ${bot.name}</h3>
        <p>Status: 🟢 ${bot.status}</p>
      </div>
    `;
  });
}

loadBots();
