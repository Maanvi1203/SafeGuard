document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const root = document.querySelector('[data-management-alerts]');
  function render() {
    const alerts = C.getReports().filter(r => r.status === 'Escalated' || r.severity === 'Immediate Assistance' || r.severity === 'High');
    root.innerHTML = alerts.map(r => `
      <article class="alert-card ${r.severity === 'Immediate Assistance' || r.status === 'Escalated' ? 'danger' : 'warning'}">
        <strong>${C.escapeHtml(r.riskType)}</strong>
        <div class="meta"><span>${C.escapeHtml(r.id)}</span><span>${C.escapeHtml(r.route)}</span><span>${C.escapeHtml(r.division)}</span><span>${C.formatTime(r.time)}</span></div>
        <p>${C.escapeHtml(r.location)}</p>
        <div class="alert-actions"><button class="mini-button success" data-management-monitor="${r.id}">Mark monitored</button></div>
      </article>`).join('') || '<article class="alert-card"><strong>No escalated alerts</strong><p>High-priority feed is clear.</p></article>';
  }
  document.addEventListener('click', event => {
    const id = event.target.closest('[data-management-monitor]')?.dataset.managementMonitor;
    if (id) C.showToast('Management review', `${id} marked for monitoring.`);
  });
  document.querySelector('[data-management-test-alert]')?.addEventListener('click', () => C.showToast('Management alert', 'New escalation requires review.'));
  render();
});
