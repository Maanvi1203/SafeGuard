document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const key = 'safeguard.rider.settings';
  const defaults = { sound: true, toast: true, status: true };
  function getSettings() { try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch (_) { return defaults; } }
  function save(settings) { localStorage.setItem(key, JSON.stringify(settings)); }
  const settings = getSettings();
  document.querySelectorAll('[data-rider-setting]').forEach(input => {
    input.checked = Boolean(settings[input.dataset.riderSetting]);
    input.addEventListener('change', () => {
      settings[input.dataset.riderSetting] = input.checked;
      save(settings);
      C.showToast('Settings saved', 'Rider preferences updated.');
    });
  });
});
