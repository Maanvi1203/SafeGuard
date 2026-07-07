document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const root = document.querySelector('[data-rider-action-log]');
  const key = 'safeguard.rider.actionLog';
  function getLog() { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; } }
  function saveLog(log) { localStorage.setItem(key, JSON.stringify(log.slice(0, 20))); }
  function render() {
    const log = getLog();
    root.innerHTML = log.map(item => `<li><strong>${C.escapeHtml(item.action)}</strong><br><small>${C.escapeHtml(item.time)}</small></li>`).join('') || '<li>No help actions yet.</li>';
  }
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-rider-action]');
    if (!btn) return;
    const action = btn.dataset.riderAction;
    const log = getLog();
    log.unshift({ action, time: new Date().toLocaleString() });
    saveLog(log);
    C.showToast('Action saved', action);
    render();
  });
  render();
});
