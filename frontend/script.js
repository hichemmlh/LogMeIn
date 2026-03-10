// Configuration corrigée pour AWS
const API_BASE_URL = `http://${window.location.hostname}:5000`;

// État global (issu de ton ZIP)
let allLogs = [];
let filteredLogs = [];
let currentFilters = { level: "", service: "", search: "" };

// Éléments du DOM
const elements = {
  totalLogs: document.getElementById("total-logs"),
  errorCount: document.getElementById("error-count"),
  warningCount: document.getElementById("warning-count"),
  lastLog: document.getElementById("last-log"),
  levelFilter: document.getElementById("level-filter"),
  serviceFilter: document.getElementById("service-filter"),
  searchInput: document.getElementById("search-input"),
  logsList: document.getElementById("logs-list"),
  refreshBtn: document.getElementById("refresh-btn"),
  clearBtn: document.getElementById("clear-btn"),
  addTestBtn: document.getElementById("add-test-btn"),
  loadMoreBtn: document.getElementById("load-more-btn"),
};

// Utilitaires de temps
const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleString("fr-FR");
const formatRelativeTime = (timestamp) => {
  const diffMins = Math.floor((new Date() - new Date(timestamp)) / 60000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins}min`;
  return `${Math.floor(diffMins / 60)}h`;
};

// Fonctions API
const api = {
  async getLogs(limit = 100) {
    const response = await fetch(`${API_BASE_URL}/logs?limit=${limit}`);
    if (!response.ok) throw new Error("Erreur lors du chargement des logs");
    return await response.json();
  },
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error("Erreur lors du chargement des stats");
    return await response.json();
  },
  async addLog(logData) {
    await fetch(`${API_BASE_URL}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(logData),
    });
  },
  async clearLogs() {
    await fetch(`${API_BASE_URL}/logs/clear`, { method: "DELETE" });
  }
};

// Affichage (Interface utilisateur)
const updateStats = (stats) => {
  elements.totalLogs.textContent = stats.total_logs || 0;
  elements.errorCount.textContent = stats.levels.error || 0;
  elements.warningCount.textContent = stats.levels.warning || 0;
  elements.lastLog.textContent = stats.last_log ? formatRelativeTime(stats.last_log.timestamp) : "Aucun";
};

const renderLogs = () => {
  elements.logsList.innerHTML = filteredLogs.length === 0 ? '<div class="empty-state"><h3>Aucun log trouvé</h3></div>' : "";
  filteredLogs.forEach(log => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.innerHTML = `<div class="log-header"><span class="log-level ${log.level}">${log.level}</span><span>🏷️ ${log.service}</span></div><div class="log-message">${log.message}</div>`;
    elements.logsList.appendChild(div);
  });
};

const applyFilters = () => {
  filteredLogs = allLogs.filter(log => 
    (!currentFilters.level || log.level === currentFilters.level) &&
    (!currentFilters.service || log.service === currentFilters.service) &&
    (!currentFilters.search || log.message.toLowerCase().includes(currentFilters.search.toLowerCase()))
  );
  renderLogs();
};

const loadDashboard = async () => {
  try {
    const [logsData, statsData] = await Promise.all([api.getLogs(), api.getStats()]);
    allLogs = logsData.logs;
    updateStats(statsData);
    applyFilters();
  } catch (e) { console.error(e); }
};

// Événements
elements.refreshBtn.addEventListener("click", loadDashboard);
elements.addTestBtn.addEventListener("click", async () => {
  await api.addLog({ level: "info", message: "Log de test", service: "manuel" });
  loadDashboard();
});
elements.clearBtn.addEventListener("click", async () => {
  if(confirm("Vider les logs ?")) { await api.clearLogs(); loadDashboard(); }
});

// Lancement
loadDashboard();
setInterval(loadDashboard, 30000);
