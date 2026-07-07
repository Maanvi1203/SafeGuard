document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const reports = C.getReports();
  const open = reports.filter(r => r.status !== 'Closed');
  const stats = [
    ['Open reports', open.length],
    ['Escalated', reports.filter(r => r.status === 'Escalated').length],
    ['High / Immediate', reports.filter(r => ['High', 'Immediate Assistance'].includes(r.severity)).length],
    ['Closed', reports.filter(r => r.status === 'Closed').length]
  ];
  document.querySelector('[data-management-stats]').innerHTML = stats.map(([label, value]) => `<article class="stat-card"><small>${C.escapeHtml(label)}</small><span class="value">${value}</span></article>`).join('');

  const counts = reports.reduce((acc, r) => { acc[r.riskType] = (acc[r.riskType] || 0) + 1; return acc; }, {});
  const top = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(1, ...top.map(x => x[1]));
  document.querySelector('[data-management-risk-trends]').innerHTML = top.map(([label, value]) => `
    <div class="trend-row"><span>${C.escapeHtml(label)}</span><strong>${value}</strong><div class="trend-bar"><span style="width:${Math.round(value / max * 100)}%"></span></div></div>`).join('');

  const routes = {};
  reports.forEach(r => {
    routes[r.route] ??= { division: r.division, open: 0, escalated: 0 };
    if (r.status !== 'Closed') routes[r.route].open++;
    if (r.status === 'Escalated') routes[r.route].escalated++;
  });
  document.querySelector('[data-management-depot-table]').innerHTML = Object.entries(routes).slice(0, 6).map(([route, row]) => `
    <tr><td>${C.escapeHtml(route)}</td><td>${C.escapeHtml(row.division)}</td><td>${row.open}</td><td>${row.escalated}</td></tr>`).join('');
});
