document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;

  function logAction(text) {
    const log = document.querySelector('[data-action-history]');
    if (!log) return;
    const li = document.createElement('li');
    li.innerHTML = `<strong>${C.escapeHtml(text)}</strong><br><small>${new Date().toLocaleString()}</small>`;
    log.prepend(li);
  }

  function renderVideoClips() {
    const container = document.querySelector('[data-video-clips]');
    if (!container) return;
    container.innerHTML = window.SafeGuardData.videoClips.map(clip => `
      <article class="video-card" data-video-card="${clip.id}">
        <img src="${clip.poster}" alt="Video preview for ${C.escapeHtml(clip.reportId)}" />
        <div class="video-card-body">
          <strong>${C.escapeHtml(clip.title)}</strong>
          <small>${C.escapeHtml(clip.route)} · Bus ${C.escapeHtml(clip.busId)}</small>
          <small>${C.escapeHtml(clip.location)}</small>
          <small>${C.escapeHtml(clip.analysis.model)} · ${clip.analysis.confidence}%</small>
          <button class="mini-button primary" data-flag-video="${clip.id}">Flag for Admin Review</button>
        </div>
      </article>`).join('') || '<p>No linked clips currently assigned.</p>';
  }

  document.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action-log]')?.dataset.actionLog;
    if (action) { logAction(action); C.showToast('Operator action logged', action); }
    const clipId = event.target.closest('[data-flag-video]')?.dataset.flagVideo;
    if (clipId) {
      const card = document.querySelector(`[data-video-card="${clipId}"]`);
      const clip = window.SafeGuardData.videoClips.find(item => item.id === clipId);
      event.target.textContent = 'Flagged for Admin Review';
      event.target.disabled = true;
      card?.classList.add('flagged');
      logAction(`Video ${clipId} flagged for Admin Review`);
      if (clip) {
        await C.sendVideoRiskToAdmin({
          id: clip.id,
          reportId: clip.reportId,
          className: clip.analysis.className,
          confidence: clip.analysis.confidence,
          route: clip.route,
          busId: clip.busId,
          location: clip.location,
          time: new Date().toISOString()
        });
      }
    }
  });

  renderVideoClips();
});
