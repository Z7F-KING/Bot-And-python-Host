const API = "https://YOUR-SERVER-URL";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "index.html";
}

async function addBot() {
  const name = document.getElementById("name").value;
  const tokenInput = document.getElementById("token").value;

  await fetch(API + "/add-bot", {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": token
    },
    body: JSON.stringify({
      name: name,
      token: tokenInput
    })
  });

  loadBots();
}

async function loadBots() {
  const res = await fetch(API + "/bots", {
    headers: { "Authorization": token }
  });

  const data = await res.json();
  const div = document.getElementById("bots");

  div.innerHTML = "";

  data.forEach(bot => {
    div.innerHTML += `
      <div class="bot">
        🤖 ${bot.name} <br>
        Status: 🟢 ${bot.status}
      </div>
    `;
  });
}

loadBots();
