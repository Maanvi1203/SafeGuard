document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const alertRoot = document.querySelector('[data-admin-alert-feed]');
  const videoRoot = document.querySelector('[data-admin-video-events]');
  function renderAlerts() {
    const rows = C.getReports().filter(r => r.status === 'Escalated' || r.severity === 'Immediate Assistance');
    alertRoot.innerHTML = rows.map(r => `
      <article class="alert-card danger">
        <strong>${C.escapeHtml(r.id)} · ${C.escapeHtml(r.riskType)}</strong>
        <div class="meta"><span>${C.escapeHtml(r.source)}</span><span>${C.escapeHtml(r.route)}</span><span>${C.escapeHtml(r.location)}</span><span>${C.formatTime(r.time)}</span></div>
        <p>${C.escapeHtml(r.transcript)}</p>
        <div class="alert-actions"><button class="mini-button success" data-admin-ack="${r.id}">Acknowledge</button><button class="mini-button" data-admin-close="${r.id}">Close</button></div>
      </article>`).join('') || '<article class="alert-card"><strong>No admin alerts</strong><p>No escalated reports currently require action.</p></article>';
  }
  function renderVideo() {
    const events = C.getVideoAnalysisEvents();
    videoRoot.innerHTML = events.map(e => `<li><strong>${C.escapeHtml(e.className || 'Violence/Fight')}</strong> ${C.escapeHtml(e.confidence || '')}%<br><small>${C.escapeHtml(e.source || 'Video source')} · ${C.escapeHtml(e.reportId || '')}</small></li>`).join('') || '<li>No video risk events yet.</li>';
  }
  document.addEventListener('click', event => {
    const ack = event.target.closest('[data-admin-ack]')?.dataset.adminAck;
    const close = event.target.closest('[data-admin-close]')?.dataset.adminClose;
    if (ack) { C.updateReport(ack, { status: 'Acknowledged' }); C.showToast('Admin acknowledged', ack); renderAlerts(); }
    if (close) { C.updateReport(close, { status: 'Closed' }); C.showToast('Admin closed report', close); renderAlerts(); }
  });
  document.querySelector('[data-admin-test-alert]')?.addEventListener('click', () => C.showToast('Admin alert', 'Escalated report received.'));
  C.onAdminAlert(() => { renderAlerts(); C.showToast('Admin alert', 'New escalation received.'); });
  renderAlerts();
  renderVideo();
});
