document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const reports = C.getReports().filter(r => r.source === 'Rider');
  const stats = [
    ['Submitted', reports.length],
    ['Pending', reports.filter(r => r.status === 'Pending').length],
    ['Acknowledged', reports.filter(r => r.status === 'Acknowledged').length],
    ['Escalated', reports.filter(r => r.status === 'Escalated').length]
  ];
  const statRoot = document.querySelector('[data-rider-stats]');
  if (statRoot) statRoot.innerHTML = stats.map(([label, value]) => `<article class="stat-card"><small>${C.escapeHtml(label)}</small><span class="value">${value}</span></article>`).join('');

  const recentRoot = document.querySelector('[data-rider-recent]');
  if (recentRoot) {
    recentRoot.innerHTML = reports.slice(0, 5).map(r => `
      <tr>
        <td>${C.formatTime(r.time)}</td>
        <td><span class="status-chip ${C.statusClass(r.status)}">${C.escapeHtml(r.status)}</span></td>
        <td>${C.escapeHtml(r.riskType)}</td>
        <td><strong>${C.escapeHtml(r.route)}</strong><br><small>Bus ${C.escapeHtml(r.busId)}</small></td>
        <td>${C.escapeHtml(r.location)}</td>
      </tr>`).join('') || '<tr><td colspan="5">No rider reports yet.</td></tr>';
  }
});
