const API_BASE_URL = `http://${window.location.hostname}:5000`;

async function loadDashboard() {
    try {
        const res = await fetch(`${API_BASE_URL}/stats`);
        if (!res.ok) throw new Error();
        const stats = await res.json();
        document.getElementById("total-logs").textContent = stats.total_logs || 0;
    } catch (e) {
        console.error("Erreur API", e);
    }
}

document.getElementById("add-test-btn").addEventListener("click", async () => {
    await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({level: 'info', message: 'Test LogMeIn', service: 'frontend'})
    });
    loadDashboard();
});

loadDashboard();
setInterval(loadDashboard, 30000);
