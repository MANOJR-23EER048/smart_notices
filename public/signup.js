document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const msg = document.getElementById("msg");

    form.addEventListener("submit", async function (e) {
        e.preventDefault(); // stop form from refreshing

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value;

        // Clear old messages
        msg.textContent = "";

        try {
            const res = await fetch("/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            // Try parsing JSON safely
            let data;
            try {
                data = await res.json();
            } catch {
                throw new Error("Invalid server response");
            }

            if (res.ok) {
                msg.style.color = "lightgreen";
                msg.textContent = "Signup successful! Redirecting...";
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            } else {
                msg.style.color = "red";
                msg.textContent = data.message || "Signup failed";
            }

        } catch (error) {
            console.error("Signup error:", error);
            msg.style.color = "red";
            msg.textContent = "An error occurred. Please try again.";
        }
    });
});
