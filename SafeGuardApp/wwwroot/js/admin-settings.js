document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const users = [
    ['Sam Patel', 'Operator', 'Depot reports + action review', 'Active'],
    ['Rider User', 'Rider', 'Submit reports + public alerts', 'Active'],
    ['Management User', 'Management', 'Trends + response oversight', 'Active'],
    ['Admin User', 'Admin', 'Full system access', 'Active']
  ];
  document.querySelector('[data-admin-users]').innerHTML = users.map(u => `<tr><td>${C.escapeHtml(u[0])}</td><td>${C.escapeHtml(u[1])}</td><td>${C.escapeHtml(u[2])}</td><td><span class="status-chip Closed">${C.escapeHtml(u[3])}</span></td></tr>`).join('');

  const key = 'safeguard.admin.settings';
  const mediaKey = 'safeguard.admin.mediaLibrary';
  const defaults = { autoEscalate: true, signalR: true, video: true };
  function getSettings() { try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch (_) { return defaults; } }
  const settings = getSettings();

  function getLocalLibrary() {
    try { return JSON.parse(localStorage.getItem(mediaKey) || '[]'); } catch (_) { return []; }
  }

  function saveLocalLibrary(files) {
    localStorage.setItem(mediaKey, JSON.stringify(files.slice(0, 100)));
  }

  async function renderMediaLibrary() {
    const root = document.querySelector('[data-admin-media-library]');
    if (!root) return;
    let files = getLocalLibrary();
    try {
      const response = await fetch('/api/media/uploads?take=100');
      if (response.ok) {
        files = await response.json();
        saveLocalLibrary(files);
      }
    } catch (_) {}
    root.innerHTML = files.length ? C.renderMediaAttachments(files) : '<p>No uploaded media documents yet.</p>';
  }

  document.querySelectorAll('[data-admin-setting]').forEach(input => {
    input.checked = Boolean(settings[input.dataset.adminSetting]);
    input.addEventListener('change', () => {
      settings[input.dataset.adminSetting] = input.checked;
      localStorage.setItem(key, JSON.stringify(settings));
      C.showToast('Settings saved', 'Admin settings updated.');
    });
  });

  document.querySelector('[data-admin-media-form]')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('[type="submit"]');
    submitButton?.setAttribute('disabled', 'disabled');
    try {
      const category = new FormData(form).get('category') || 'documents';
      const uploaded = await C.uploadMediaFiles(form.querySelector('[data-media-upload]'), { role: 'Admin', category });
      saveLocalLibrary([...uploaded, ...getLocalLibrary()]);
      C.showToast('Media uploaded', `${uploaded.length} file${uploaded.length === 1 ? '' : 's'} added.`);
      form.reset();
      document.querySelector('[data-media-preview]').innerHTML = '<small>No files selected.</small>';
      await renderMediaLibrary();
    } catch (error) {
      C.showToast('Upload failed', error.message || 'Media upload could not be completed.');
    } finally {
      submitButton?.removeAttribute('disabled');
    }
  });

  document.querySelector('[data-admin-media-form] [data-media-upload]')?.addEventListener('change', event => {
    C.selectedMediaPreview(event.target, document.querySelector('[data-admin-media-form] [data-media-preview]'));
  });
  document.querySelector('[data-refresh-media-library]')?.addEventListener('click', renderMediaLibrary);
  renderMediaLibrary();
});
