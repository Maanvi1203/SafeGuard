document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const key = 'safeguard.management.settings';
  const defaults = { sound: true, toast: true, summary: true };
  function getSettings() { try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch (_) { return defaults; } }
  const settings = getSettings();
  document.querySelectorAll('[data-management-setting]').forEach(input => {
    input.checked = Boolean(settings[input.dataset.managementSetting]);
    input.addEventListener('change', () => {
      settings[input.dataset.managementSetting] = input.checked;
      localStorage.setItem(key, JSON.stringify(settings));
      C.showToast('Settings saved', 'Management preferences updated.');
    });
  });
});
