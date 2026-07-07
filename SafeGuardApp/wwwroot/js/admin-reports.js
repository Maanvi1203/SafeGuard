document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const riskFilter = document.querySelector('[data-admin-risk-filter]');
  if (riskFilter) riskFilter.innerHTML += (window.SafeGuardData.riskTypes || []).map(r => `<option>${C.escapeHtml(r)}</option>`).join('');

  function filtered() {
    const status = document.querySelector('[data-admin-status-filter]').value;
    const source = document.querySelector('[data-admin-source-filter]').value;
    const risk = document.querySelector('[data-admin-risk-filter]').value;
    return C.getReports().filter(r => (status === 'All' || r.status === status) && (source === 'All' || r.source === source) && (risk === 'All' || r.riskType === risk));
  }
  function setStatus(id, status) {
    C.updateReport(id, { status });
    C.showToast('Report updated', `${id} set to ${status}.`);
    render();
  }
  function render() {
    const rows = filtered();
    document.querySelector('[data-admin-report-count]').textContent = `${rows.length} reports`;
    document.querySelector('[data-admin-report-list]').innerHTML = rows.map(r => `
      <tr>
        <td>${C.formatTime(r.time)}</td>
        <td><span class="status-chip ${C.statusClass(r.status)}">${C.escapeHtml(r.status)}</span></td>
        <td>${C.escapeHtml(r.source)}</td>
        <td><strong>${C.escapeHtml(r.route)}</strong><br><small>Bus ${C.escapeHtml(r.busId)}</small></td>
        <td>${C.escapeHtml(r.riskType)}</td>
        <td>${C.escapeHtml(r.location)}</td>
        <td>${(r.mediaFiles || []).length ? `${(r.mediaFiles || []).length} file${(r.mediaFiles || []).length === 1 ? '' : 's'}` : 'None'}</td>
        <td><div class="row-actions"><button class="mini-button primary" data-admin-status="Escalated" data-id="${r.id}">Escalate</button><button class="mini-button success" data-admin-status="Closed" data-id="${r.id}">Close</button></div></td>
      </tr>`).join('') || '<tr><td colspan="8">No reports match filters.</td></tr>';
  }
  document.addEventListener('click', event => {
    const btn = event.target.closest('[data-admin-status]');
    if (btn) setStatus(btn.dataset.id, btn.dataset.adminStatus);
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-admin-status-filter], [data-admin-source-filter], [data-admin-risk-filter]')) render();
  });
  render();
});
