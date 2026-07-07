document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const riskFilter = document.querySelector('[data-management-risk-filter]');
  if (riskFilter) riskFilter.innerHTML += (window.SafeGuardData.riskTypes || []).map(r => `<option>${C.escapeHtml(r)}</option>`).join('');

  function filtered() {
    const status = document.querySelector('[data-management-status-filter]').value;
    const source = document.querySelector('[data-management-source-filter]').value;
    const risk = document.querySelector('[data-management-risk-filter]').value;
    return C.getReports().filter(r => (status === 'All' || r.status === status) && (source === 'All' || r.source === source) && (risk === 'All' || r.riskType === risk));
  }

  function openDrawer(report) {
    document.querySelector('[data-management-drawer-title]').textContent = `${report.id} · ${report.riskType}`;
    document.querySelector('[data-management-drawer-content]').innerHTML = `
      <section class="detail-section"><h3>Report</h3><dl>
        <div><dt>Status</dt><dd><span class="status-chip ${C.statusClass(report.status)}">${C.escapeHtml(report.status)}</span></dd></div>
        <div><dt>Severity</dt><dd>${C.escapeHtml(report.severity)}</dd></div>
        <div><dt>Source</dt><dd>${C.escapeHtml(report.source)}</dd></div>
        <div><dt>Route / Bus</dt><dd>${C.escapeHtml(report.route)} / ${C.escapeHtml(report.busId)}</dd></div>
        <div><dt>Division</dt><dd>${C.escapeHtml(report.division)}</dd></div>
      </dl></section>
      <section class="detail-section"><h3>Evidence summary</h3><p>${C.escapeHtml(report.transcript)}</p><div class="keyword-row">${(report.keywords || []).map(k => `<span class="keyword">${C.escapeHtml(k)}</span>`).join('')}</div></section>
      <section class="detail-section"><h3>Uploaded Media</h3>${C.renderMediaAttachments(report.mediaFiles || [])}</section>
      <section class="detail-section"><h3>Location</h3><div class="map-card"><span class="pin"></span><strong>${C.escapeHtml(report.location)}</strong><small>${C.escapeHtml(report.nearestStop || '')}</small></div></section>`;
    document.querySelector('[data-management-drawer]').classList.add('open');
    document.querySelector('[data-management-drawer]').setAttribute('aria-hidden', 'false');
    document.querySelector('[data-management-backdrop]').classList.add('open');
  }

  function closeDrawer() {
    document.querySelector('[data-management-drawer]').classList.remove('open');
    document.querySelector('[data-management-backdrop]').classList.remove('open');
  }

  function render() {
    const rows = filtered();
    document.querySelector('[data-management-report-count]').textContent = `${rows.length} reports`;
    document.querySelector('[data-management-report-list]').innerHTML = rows.map(r => `
      <tr>
        <td>${C.formatTime(r.time)}</td>
        <td><span class="status-chip ${C.statusClass(r.status)}">${C.escapeHtml(r.status)}</span></td>
        <td>${C.escapeHtml(r.source)}</td>
        <td><strong>${C.escapeHtml(r.route)}</strong><br><small>Bus ${C.escapeHtml(r.busId)}</small></td>
        <td>${C.escapeHtml(r.riskType)}</td>
        <td>${C.escapeHtml(r.division)}</td>
        <td><button class="mini-button" data-management-open="${r.id}">Open</button></td>
      </tr>`).join('') || '<tr><td colspan="7">No reports match filters.</td></tr>';
  }

  document.addEventListener('click', event => {
    const id = event.target.closest('[data-management-open]')?.dataset.managementOpen;
    if (id) {
      const report = C.getReports().find(r => r.id === id);
      if (report) openDrawer(report);
    }
    if (event.target.closest('[data-management-close-drawer]') || event.target.closest('[data-management-backdrop]')) closeDrawer();
  });
  document.addEventListener('change', event => {
    if (event.target.matches('[data-management-status-filter], [data-management-source-filter], [data-management-risk-filter]')) render();
  });
  render();
});
