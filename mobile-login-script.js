// mobile-login-script.js — STABLE

document.getElementById("mobileLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("mobileUsername").value;
    const password = document.getElementById("mobilePassword").value;
    const errorDiv = document.getElementById("mobileLoginError");

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

    // ✅ Redirect ONLY here
    location.replace("mobile.html");
});
