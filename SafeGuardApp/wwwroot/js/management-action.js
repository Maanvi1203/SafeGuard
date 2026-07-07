document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const logKey = 'safeguard.management.notes';
  function getNotes() { try { return JSON.parse(localStorage.getItem(logKey) || '[]'); } catch (_) { return []; } }
  function saveNotes(notes) { localStorage.setItem(logKey, JSON.stringify(notes.slice(0, 30))); }
  function renderBoard() {
    const rows = C.getReports().filter(r => r.status === 'Escalated' || r.severity === 'High' || r.severity === 'Immediate Assistance');
    document.querySelector('[data-management-action-board]').innerHTML = rows.map(r => `
      <article class="workflow-card">
        <strong>${C.escapeHtml(r.id)} · ${C.escapeHtml(r.riskType)}</strong>
        <p>${C.escapeHtml(r.route)} · ${C.escapeHtml(r.location)}</p>
        <span class="status-chip ${C.statusClass(r.status)}">${C.escapeHtml(r.status)}</span>
        <button class="mini-button" data-management-assign="${r.id}">Assign follow-up</button>
      </article>`).join('') || '<article class="workflow-card"><strong>No action items</strong><p>Escalation action queue is clear.</p></article>';
  }
  function renderNotes() {
    const notes = getNotes();
    document.querySelector('[data-management-note-log]').innerHTML = notes.map(n => `<li><strong>${C.escapeHtml(n.reportId)} · ${C.escapeHtml(n.priority)}</strong><br>${C.escapeHtml(n.note)}<br><small>${C.escapeHtml(n.time)}</small></li>`).join('') || '<li>No management notes yet.</li>';
  }
  document.querySelector('[data-management-note-form]')?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const notes = getNotes();
    notes.unshift({ reportId: data.get('reportId'), priority: data.get('priority'), note: data.get('note'), time: new Date().toLocaleString() });
    saveNotes(notes);
    C.showToast('Note saved', `${data.get('reportId')} updated.`);
    event.currentTarget.reset();
    renderNotes();
  });
  document.addEventListener('click', event => {
    const id = event.target.closest('[data-management-assign]')?.dataset.managementAssign;
    if (id) C.showToast('Follow-up assigned', id);
  });
  renderBoard();
  renderNotes();
});
