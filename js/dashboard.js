// ضع هنا رابط سيرفرك الذي يشغّل البوتات
const API = "https://bot-and-python-host.onrender.com";

// إضافة بوت جديد
async function addBot() {
  const name = document.getElementById("name").value;
  const token = document.getElementById("token").value;

  if (!name || !token) {
    alert("Fill all fields!");
    return;
  }

  try {
    await fetch(API + "/add-bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, token })
    });

    loadBots();
  } catch (err) {
    console.error(err);
    alert("Error adding bot!");
  }
}

// تحميل وعرض كل البوتات
async function loadBots() {
  try {
    const res = await fetch(API + "/bots");
    const data = await res.json();
    const div = document.getElementById("bots");
    div.innerHTML = "";

    data.forEach(bot => {
      div.innerHTML += `
        <div class="bot">
          <h3>🤖 ${bot.name}</h3>
          <p>Status: 🟢 ${bot.status}</p>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

// تحميل البوتات عند فتح الصفحة
loadBots();
