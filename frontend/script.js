const API_BASE_URL = `http://${window.location.hostname}:5000`;

async function loadDashboard() {
    try {
        const [statsRes, logsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/stats`),
            fetch(`${API_BASE_URL}/logs`)
        ]);
        
        const stats = await statsRes.json();
        const logsData = await logsRes.json();

        // Remplissage des compteurs
        document.getElementById("total-logs").textContent = stats.total_logs || 0;
        document.getElementById("error-count").textContent = stats.levels.error || 0;
        document.getElementById("warning-count").textContent = stats.levels.warning || 0;
        document.getElementById("last-log").textContent = stats.last_log ? "Actif" : "Aucun";

        // Affichage de la liste des logs
        const list = document.getElementById("logs-list");
        list.innerHTML = "";
        logsData.logs.forEach(log => {
            const div = document.createElement("div");
            div.className = "log-entry";
            div.innerHTML = `<strong>[${log.level.toUpperCase()}]</strong> ${log.service}: ${log.message}`;
            list.appendChild(div);
        });
    } catch (e) { console.error("Erreur API", e); }
}

document.getElementById("add-test-btn").addEventListener("click", async () => {
    // On alterne les types de logs pour tester les compteurs
    const levels = ['info', 'warning', 'error'];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    
    await fetch(`${API_BASE_URL}/logs`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({level: randomLevel, message: 'Nouveau log de test', service: 'frontend'})
    });
    loadDashboard();
});

loadDashboard();
setInterval(loadDashboard, 10000);
