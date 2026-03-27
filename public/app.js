const API = "https://bot-and-python-host.onrender.com";

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, password })
  });

  if (res.status !== 200) {
    alert("❌ Login failed");
    return;
  }

  const data = await res.json();
  localStorage.setItem("token", data.token);
  window.location.href = "dashboard.html";
}
