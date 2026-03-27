let TOKEN = "";

async function login() {
  const res = await fetch("/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      username: user.value,
      password: pass.value
    })
  });

  const data = await res.json();
  TOKEN = data.token;
  location.href = "dashboard.html";
}

async function addBot() {
  await fetch("/add-bot", {
    method: "POST",
    headers: {
      "Content-Type":"application/json",
      "Authorization": TOKEN
    },
    body: JSON.stringify({
      name: name.value,
      token: token.value
    })
  });
}
