const API_BASE_URL = `http://${window.location.hostname}:5000`;

const elements = {
  totalLogs: document.getElementById("total-logs"),
  errorCount: document.getElementById("error-count"),
  warningCount: document.getElementById("warning-count"),
  lastLog: document.getElementById("last-log"),
  logsList: document.getElementById("logs-list"),
  refreshBtn: document.getElementById("refresh-btn"),
  clearBtn: document.getElementById("clear-btn"),
  addTestBtn: document.getElementById("add-test-btn"),
};

const api = {
  async getLogs() {
    const res = await fetch(`${API_BASE_URL}/logs?limit=100`);
    return await res.json();
  },
  async getStats() {
    const res = await fetch(`${API_BASE_URL}/stats`);
    return await res.json();
  },
  async addLog(data) {
    await fetch(`${API_BASE_URL}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
  async clearLogs() {
    await fetch(`${API_BASE_URL}/logs/clear`, { method: "DELETE" });
  }
};

const loadDashboard = async () => {
  try {
    const [logsData, statsData] = await Promise.all([api.getLogs(), api.getStats()]);
    
    // Mise à jour des stats
    elements.totalLogs.textContent = statsData.total_logs || 0;
    elements.errorCount.textContent = statsData.levels.error || 0;
    elements.warningCount.textContent = statsData.levels.warning || 0;
    elements.lastLog.textContent = statsData.last_log ? "Actif" : "Aucun";

    // Affichage des logs
    elements.logsList.innerHTML = "";
    logsData.logs.forEach(log => {
      const div = document.createElement("div");
      div.className = "log-entry";
      div.innerHTML = `<strong>[${log.level.toUpperCase()}]</strong> ${log.service}: ${log.message}`;
      elements.logsList.appendChild(div);
    });
  } catch (e) {
    elements.logsList.innerHTML = "❌ Erreur de connexion au serveur Python";
  }
};

elements.refreshBtn.addEventListener("click", loadDashboard);
elements.addTestBtn.addEventListener("click", async () => {
  await api.addLog({ level: "info", message: "Nouveau log de test", service: "web-ui" });
  loadDashboard();
});
elements.clearBtn.addEventListener("click", async () => {
  if(confirm("Vider la base ?")) { await api.clearLogs(); loadDashboard(); }
});

loadDashboard();
setInterval(loadDashboard, 30000);
