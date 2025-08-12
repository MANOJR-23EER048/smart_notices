document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");

    msg.textContent = "Processing...";
    msg.style.color = "yellow";

    try {
        const res = await fetch("/login", { // ✅ FIXED: no /api
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            msg.textContent = "Login successful! Redirecting...";
            msg.style.color = "lightgreen";

            // Optional: store username in session
            sessionStorage.setItem("loggedInUser", username);

            setTimeout(() => {
                window.location.href = "upload.html";
            }, 1000);
        } else {
            msg.textContent = data.message || "Login failed";
            msg.style.color = "red";
        }
    } catch (err) {
        console.error("Login error:", err);
        msg.textContent = "Server error";
        msg.style.color = "red";
    }
});
