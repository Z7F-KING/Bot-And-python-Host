// ضع هنا رابط السيرفر حقك على Render
const API = "https://bot-and-python-host.onrender.com";

// دالة تسجيل الدخول
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please fill in all fields!");
    return;
  }

  try {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (res.status !== 200) {
      alert("Login failed! Check username or password.");
      return;
    }

    const data = await res.json();

    // حفظ التوكن في المتصفح
    localStorage.setItem("token", data.token);

    // تحويل المستخدم لصفحة Dashboard
    window.location.href = "dashboard.html";

  } catch (err) {
    console.error(err);
    alert("Server error!");
  }
}
