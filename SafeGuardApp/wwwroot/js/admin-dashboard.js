document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const reports = C.getReports();
  const videoEvents = C.getVideoAnalysisEvents();
  const stats = [
    ['Total reports', reports.length],
    ['Escalated', reports.filter(r => r.status === 'Escalated').length],
    ['Users', 4],
    ['Video events', videoEvents.length]
  ];
  document.querySelector('[data-admin-stats]').innerHTML = stats.map(([label, value]) => `<article class="stat-card"><small>${C.escapeHtml(label)}</small><span class="value">${value}</span></article>`).join('');
  const queue = reports.filter(r => r.status === 'Escalated' || r.severity === 'Immediate Assistance').slice(0, 6);
  document.querySelector('[data-admin-escalation-queue]').innerHTML = queue.map(r => `
    <article class="alert-card danger">
      <strong>${C.escapeHtml(r.id)} · ${C.escapeHtml(r.riskType)}</strong>
      <div class="meta"><span>${C.escapeHtml(r.route)}</span><span>${C.escapeHtml(r.location)}</span><span>${C.formatTime(r.time)}</span></div>
      <div class="alert-actions"><a class="mini-button primary" href="/Admin/Alerts">Open Admin Alerts</a></div>
    </article>`).join('') || '<article class="alert-card"><strong>No escalations</strong><p>Admin escalation queue is clear.</p></article>';
});
