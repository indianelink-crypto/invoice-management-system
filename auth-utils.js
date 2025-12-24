// auth-utils.js — STABLE (NO BLINK)

function loadSupabase() {
    return new Promise((resolve, reject) => {
        if (window.supabase) return resolve();

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        script.onload = () => window.supabase ? resolve() : reject();
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function initSupabase() {
    const SUPABASE_URL = "https://upuqydjtchnocvpaddyh.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwdXF5ZGp0Y2hub2N2cGFkZHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzQ3NTEsImV4cCI6MjA4MTgxMDc1MX0.LsSpqM6HTIUEYHs5k-7xsteY05rsH6latIsAnevgqjk";

    const sb = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

    window.sb = sb;
    console.log("✅ Supabase ready");

    // 🔐 Page guard (THIS IS THE FIX)
    const { data: { session } } = await sb.auth.getSession();

    const path = location.pathname;

    // 🚫 Not logged in → block protected pages
    if (!session && (path.includes("index.html") || path.includes("mobile.html"))) {
        location.replace(
            path.includes("mobile") ? "mobile-login.html" : "login.html"
        );
        return;
    }

    // ✅ Logged in → block login pages
    if (session && (path.includes("login.html") || path.includes("mobile-login.html"))) {
        location.replace(
            path.includes("mobile") ? "mobile.html" : "index.html"
        );
        return;
    }

    // 🚪 Logout buttons
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            await sb.auth.signOut();
            location.replace("login.html");
        };
    }

    const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
    if (mobileLogoutBtn) {
        mobileLogoutBtn.onclick = async () => {
            await sb.auth.signOut();
            location.replace("mobile-login.html");
        };
    }
}

loadSupabase()
    .then(initSupabase)
    .catch(() => console.error("❌ Supabase load failed"));

