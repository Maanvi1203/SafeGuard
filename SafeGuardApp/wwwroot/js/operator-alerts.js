document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;

  function renderAlerts() {
    const feed = document.querySelector('[data-live-alerts]');
    if (!feed) return;
    const alerts = C.getReports().filter(r => ['Pending','Escalated','Acknowledged'].includes(r.status));
    feed.innerHTML = alerts.map(r => `
      <article class="alert-card ${r.severity === 'Immediate Assistance' || r.status === 'Escalated' ? 'danger' : 'warning'}" data-alert-card="${r.id}">
        <strong>${C.escapeHtml(r.riskType)}</strong>
        <p>${C.escapeHtml(r.location)} · ${C.escapeHtml(r.route)} · Bus ${C.escapeHtml(r.busId)}</p>
        <div class="meta"><span>${C.formatTime(r.time)}</span><span>${C.escapeHtml(r.status)}</span><span>${C.escapeHtml(r.source || 'Rider')}</span><span>${r.confidence}% confidence</span></div>
        <div class="alert-actions"><button class="mini-button" data-open-alert-report="${r.id}">Open Report</button><button class="mini-button" data-snooze="${r.id}">Snooze 5min</button></div>
      </article>`).join('') || '<p>No active alerts for this operator route/depot.</p>';
  }

  document.addEventListener('click', (event) => {
    const id = event.target.closest('[data-snooze]')?.dataset.snooze;
    if (id) { document.querySelector(`[data-alert-card="${id}"]`)?.remove(); C.showToast('Alert snoozed', `${id} hidden for this session.`); }
    const openId = event.target.closest('[data-open-alert-report]')?.dataset.openAlertReport;
    if (openId) window.location.href = `/Operator/Reports#${openId}`;
    if (event.target.closest('[data-simulate-alert]')) {
      const sample = C.getReports().find(r => r.status === 'Pending') || C.getReports()[0];
      C.showToast('New report', `${sample.riskType} · ${sample.route} · ${sample.location}`);
    }
  });

  renderAlerts();
});
