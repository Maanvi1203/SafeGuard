document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const key = 'safeguard.admin.decisions';
  function getDecisions() { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; } }
  function saveDecisions(rows) { localStorage.setItem(key, JSON.stringify(rows.slice(0, 40))); }
  function renderBoard() {
    const rows = C.getReports().filter(r => r.status === 'Escalated' || r.severity === 'Immediate Assistance');
    document.querySelector('[data-admin-workflow-board]').innerHTML = rows.map(r => `
      <article class="workflow-card">
        <strong>${C.escapeHtml(r.id)} · ${C.escapeHtml(r.riskType)}</strong>
        <p>${C.escapeHtml(r.route)} · ${C.escapeHtml(r.location)}</p>
        <div class="row-actions"><button class="mini-button primary" data-admin-dispatch="${r.id}">Dispatch security</button><button class="mini-button success" data-admin-resolve="${r.id}">Resolve</button></div>
      </article>`).join('') || '<article class="workflow-card"><strong>No escalations</strong><p>Workflow queue is clear.</p></article>';
  }
  function renderDecisions() {
    const rows = getDecisions();
    document.querySelector('[data-admin-decision-log]').innerHTML = rows.map(d => `<li><strong>${C.escapeHtml(d.reportId)} · ${C.escapeHtml(d.decision)}</strong><br>${C.escapeHtml(d.notes)}<br><small>${C.escapeHtml(d.time)}</small></li>`).join('') || '<li>No admin decisions saved.</li>';
  }
  document.querySelector('[data-admin-decision-form]')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const rows = getDecisions();
    rows.unshift({ reportId: data.get('reportId'), decision: data.get('decision'), notes: data.get('notes'), time: new Date().toLocaleString() });
    saveDecisions(rows);
    C.showToast('Decision saved', `${data.get('reportId')} updated.`);
    event.currentTarget.reset();
    renderDecisions();
  });
  document.addEventListener('click', event => {
    const dispatch = event.target.closest('[data-admin-dispatch]')?.dataset.adminDispatch;
    const resolve = event.target.closest('[data-admin-resolve]')?.dataset.adminResolve;
    if (dispatch) C.showToast('Security dispatched', dispatch);
    if (resolve) { C.updateReport(resolve, { status: 'Closed' }); C.showToast('Report resolved', resolve); renderBoard(); }
  });
  renderBoard();
  renderDecisions();
});
