document.addEventListener('DOMContentLoaded', () => {
  const { getReports, updateReport, formatTime, showToast, escalateToAdmin, escapeHtml } = window.SafeGuardCommon;

  function renderStats() {
    const container = document.querySelector('[data-dashboard-stats]');
    if (!container) return;
    const reports = getReports();
    const today = new Date().toDateString();
    const stats = [
      ['Pending', reports.filter(r => r.status === 'Pending').length, 'Needs operator review'],
      ['Validated Today', reports.filter(r => ['Acknowledged', 'Escalated', 'Closed'].includes(r.status) && new Date(r.time).toDateString() === today).length, 'Reports touched today'],
      ['Escalated', reports.filter(r => r.status === 'Escalated').length, 'Sent to Admin/Management'],
      ['Closed', reports.filter(r => r.status === 'Closed').length, 'False alarm or resolved']
    ];
    container.innerHTML = stats.map(([label, value, helper]) => `<article class="stat-card"><span>${label}</span><strong class="value">${value}</strong><small>${helper}</small></article>`).join('');
  }

  function renderQueue() {
    const body = document.querySelector('[data-pending-queue]');
    if (!body) return;
    const pending = getReports().filter(r => r.status === 'Pending' && (r.source || 'Rider') === 'Rider');
    body.innerHTML = pending.map(r => `
      <tr>
        <td>${formatTime(r.time)}</td>
        <td><strong>${escapeHtml(r.route)}</strong><br><small>${escapeHtml(r.busId)}</small></td>
        <td><span class="status-chip ${String(r.severity || '').replaceAll(' ', '-')}">${escapeHtml(r.riskType)}</span></td>
        <td>${escapeHtml(r.location)}</td>
        <td><audio controls preload="none" src="${r.audioClip}"></audio></td>
        <td><div class="row-actions"><button class="mini-button success" data-ack="${r.id}">Acknowledge</button><button class="mini-button primary" data-escalate="${r.id}">Escalate</button></div></td>
      </tr>`).join('') || '<tr><td colspan="6">No pending Rider reports assigned to this operator.</td></tr>';
  }

  document.addEventListener('click', async (event) => {
    const ackId = event.target.closest('[data-ack]')?.dataset.ack;
    const escalateId = event.target.closest('[data-escalate]')?.dataset.escalate;
    if (ackId) {
      updateReport(ackId, { status: 'Acknowledged' });
      showToast('Report acknowledged', `${ackId} marked as seen.`);
      renderQueue(); renderStats();
    }
    if (escalateId) {
      const report = updateReport(escalateId, { status: 'Escalated' });
      if (report) await escalateToAdmin(report);
      renderQueue(); renderStats();
    }
  });

  renderStats();
  renderQueue();
});
