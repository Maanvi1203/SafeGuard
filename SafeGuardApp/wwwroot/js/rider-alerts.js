document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const root = document.querySelector('[data-rider-alert-feed]');
  const alerts = C.getReports().filter(r => r.source === 'Rider' || r.route === '54 Lawrence East').slice(0, 6);
  if (root) {
    root.innerHTML = alerts.map(r => `
      <article class="alert-card ${r.status === 'Escalated' ? 'danger' : r.status === 'Pending' ? 'warning' : ''}">
        <strong>${C.escapeHtml(r.riskType)}</strong>
        <div class="meta"><span>${C.escapeHtml(r.route)}</span><span>${C.escapeHtml(r.location)}</span><span>${C.formatTime(r.time)}</span></div>
        <p>${C.escapeHtml(r.status === 'Closed' ? 'This report has been closed after review.' : 'Safety team is reviewing this report.')}</p>
      </article>`).join('') || '<article class="alert-card"><strong>No current route alerts</strong><p>There are no public updates for this route.</p></article>';
  }
  document.querySelector('[data-rider-test-toast]')?.addEventListener('click', () => C.showToast('Safety alert', 'New route update available.'));
});
