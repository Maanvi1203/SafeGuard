document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const settings = C.getSettings();
  document.querySelectorAll('[data-setting]').forEach(input => {
    input.checked = settings[input.dataset.setting] !== false;
    input.addEventListener('change', () => {
      const next = C.getSettings();
      next[input.dataset.setting] = input.checked;
      C.saveSettings(next);
      C.showToast('Settings saved', `${input.dataset.setting} is ${input.checked ? 'on' : 'off'}.`);
    });
  });
});
