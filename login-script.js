// login-script.js — STABLE

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorDiv = document.getElementById("loginError");

    errorDiv.style.display = "none";

    const { error } = await window.sb.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = "block";
        return;
    }

    // ✅ Redirect ONLY ONCE HERE
    location.replace("index.html");
});
