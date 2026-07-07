document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const state = { selectedId: null };

  function populateRiskFilter() {
    const select = document.querySelector('[data-filter-risk]');
    if (select) {
      const existing = new Set([...select.options].map(o => o.value));
      window.SafeGuardData.riskTypes.forEach(type => {
        if (!existing.has(type)) {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = type;
          select.appendChild(option);
        }
      });
    }
    const incidentRisk = document.querySelector('[data-incident-risk]');
    if (incidentRisk) {
      incidentRisk.innerHTML = window.SafeGuardData.operatorIncidentRiskTypes.map(type => `<option value="${C.escapeHtml(type)}">${C.escapeHtml(type)}</option>`).join('');
    }
  }

  function filters() {
    return {
      status: document.querySelector('[data-filter-status]')?.value || 'All',
      source: document.querySelector('[data-filter-source]')?.value || 'All',
      date: document.querySelector('[data-filter-date]')?.value || '',
      risk: document.querySelector('[data-filter-risk]')?.value || 'All'
    };
  }

  function filteredReports() {
    const f = filters();
    return C.getReports().filter(r => {
      const source = r.source || 'Rider';
      const okStatus = f.status === 'All' || r.status === f.status;
      const okSource = f.source === 'All' || source === f.source;
      const okRisk = f.risk === 'All' || r.riskType === f.risk;
      const okDate = !f.date || r.time.startsWith(f.date);
      return okStatus && okSource && okRisk && okDate;
    });
  }

  function renderList() {
    const body = document.querySelector('[data-report-list]');
    const count = document.querySelector('[data-report-count]');
    if (!body) return;
    const items = filteredReports();
    if (count) count.textContent = `${items.length} report${items.length === 1 ? '' : 's'}`;
    body.innerHTML = items.map(r => `
      <tr data-report-row="${r.id}">
        <td>${C.formatTime(r.time)}</td>
        <td><span class="status-chip ${C.statusClass(r.status)}">${C.escapeHtml(r.status)}</span></td>
        <td>${C.escapeHtml(r.source || 'Rider')}</td>
        <td><strong>${C.escapeHtml(r.route)}</strong><br><small>Bus ${C.escapeHtml(r.busId)} · ${C.escapeHtml(r.division)}</small></td>
        <td>${C.escapeHtml(r.riskType)}</td>
        <td>${C.escapeHtml(r.location)}</td>
        <td>${r.confidence}%</td>
        <td><button class="mini-button" data-open-report="${r.id}">Open</button></td>
      </tr>`).join('') || '<tr><td colspan="8">No reports match these filters.</td></tr>';
  }

  function renderDrawer(report) {
    const drawer = document.querySelector('[data-report-drawer]');
    const title = document.querySelector('[data-drawer-title]');
    const content = document.querySelector('[data-drawer-content]');
    const backdrop = document.querySelector('[data-drawer-backdrop]');
    if (!drawer || !content || !title) return;
    state.selectedId = report.id;
    const source = report.source || 'Rider';
    title.textContent = `${report.id} · ${report.riskType}`;
    const riderOrOperator = source === 'Operator'
      ? `<p>${C.escapeHtml(report.operatorNotes || report.transcript || 'Operator-created incident.')}</p>`
      : `<p>${C.escapeHtml(report.riderMessage || 'Rider details not provided.')}</p>`;
    content.innerHTML = `
      <section class="detail-section">
        <h3>Status and source</h3>
        <dl>
          <div><dt>Status</dt><dd><span class="status-chip ${C.statusClass(report.status)}">${C.escapeHtml(report.status)}</span></dd></div>
          <div><dt>Source</dt><dd>${C.escapeHtml(source)}</dd></div>
          <div><dt>Reporter</dt><dd>${C.escapeHtml(report.reporterName || source)}</dd></div>
          <div><dt>Route / Bus</dt><dd>${C.escapeHtml(report.route)} / ${C.escapeHtml(report.busId)}</dd></div>
          <div><dt>Direction</dt><dd>${C.escapeHtml(report.direction)}</dd></div>
          <div><dt>Confidence</dt><dd>${report.confidence}%</dd></div>
        </dl>
      </section>
      <section class="detail-section">
        <h3>Detected Audio Transcript / Keywords</h3>
        <p>${C.escapeHtml(report.transcript)}</p>
        <div class="keyword-row">${(report.keywords || []).map(k => `<span class="keyword">${C.escapeHtml(k)}</span>`).join('')}</div>
        <audio controls preload="none" src="${report.audioClip || '/media/audio/normal-check.wav'}"></audio>
      </section>
      <section class="detail-section">
        <h3>Risk Type Mapping</h3>
        <p><strong>${C.escapeHtml(report.riskType)}</strong> mapped from <a class="audio-link" href="/documents/operator-risk-response-guide.pdf" target="_blank">operator-risk-response-guide.pdf</a>.</p>
        <p><strong>Severity:</strong> ${C.escapeHtml(report.severity)}</p>
      </section>
      <section class="detail-section">
        <h3>Report Notes</h3>
        ${riderOrOperator}
      </section>
      <section class="detail-section">
        <h3>Uploaded Media</h3>
        <p>${C.escapeHtml(report.mediaNotes || 'No media notes provided.')}</p>
        ${C.renderMediaAttachments(report.mediaFiles || [])}
      </section>
      <section class="detail-section">
        <h3>Map Pin</h3>
        ${C.renderLocationCard(report)}
      </section>
      <section class="detail-section">
        <h3>Operator Actions</h3>
        <div class="row-actions">
          <button class="mini-button success" data-drawer-action="ack">Acknowledge</button>
          <button class="mini-button primary" data-drawer-action="escalate">Escalate to Admin</button>
          <button class="mini-button" data-drawer-action="close">Close - False Alarm</button>
          <button class="mini-button" data-drawer-action="more-info" ${source === 'Operator' ? 'disabled title="Operator-created report"' : ''}>Request More Info</button>
        </div>
        <div class="form-row" data-close-reason hidden>
          <label>Reason
            <select data-close-select><option>Low-confidence non-risk sound</option><option>Duplicate report</option><option>Operator verified no incident</option><option>Rider cancelled report</option><option>Damage logged separately</option></select>
          </label>
          <button class="primary-button" data-confirm-close>Confirm Close</button>
        </div>
        <div class="form-row" data-more-info hidden>
          <label>Message back to Rider
            <textarea data-rider-message rows="3">Can you share your exact location in the vehicle and whether anyone needs urgent assistance?</textarea>
          </label>
          <button class="primary-button" data-send-rider-message>Send Request</button>
        </div>
      </section>`;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop?.classList.add('open');
  }

  function closeDrawers() {
    document.querySelector('[data-report-drawer]')?.classList.remove('open');
    document.querySelector('[data-report-drawer]')?.setAttribute('aria-hidden', 'true');
    document.querySelector('[data-incident-drawer]')?.classList.remove('open');
    document.querySelector('[data-incident-drawer]')?.setAttribute('aria-hidden', 'true');
    document.querySelector('[data-drawer-backdrop]')?.classList.remove('open');
  }

  function openIncidentForm() {
    const drawer = document.querySelector('[data-incident-drawer]');
    if (!drawer) return;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.querySelector('[data-drawer-backdrop]')?.classList.add('open');
  }

  async function handleDrawerAction(action) {
    const id = state.selectedId;
    const report = C.getReports().find(r => r.id === id);
    if (!id || !report) return;
    if (action === 'ack') {
      C.updateReport(id, { status: 'Acknowledged' });
      C.showToast('Report acknowledged', `${id} marked as seen.`);
      closeDrawers(); renderList();
    } else if (action === 'escalate') {
      const updated = C.updateReport(id, { status: 'Escalated' });
      if (updated) await C.escalateToAdmin(updated);
      closeDrawers(); renderList();
    } else if (action === 'close') {
      document.querySelector('[data-close-reason]').hidden = false;
      document.querySelector('[data-more-info]').hidden = true;
    } else if (action === 'more-info') {
      document.querySelector('[data-more-info]').hidden = false;
      document.querySelector('[data-close-reason]').hidden = true;
    }
  }

  document.addEventListener('click', async (event) => {
    const id = event.target.closest('[data-open-report]')?.dataset.openReport;
    if (id) {
      const report = C.getReports().find(r => r.id === id);
      if (report) renderDrawer(report);
    }
    if (event.target.closest('[data-open-incident-form]')) openIncidentForm();
    if (event.target.closest('[data-close-drawer]') || event.target.closest('[data-close-incident-form]') || event.target.closest('[data-drawer-backdrop]')) closeDrawers();
    const action = event.target.closest('[data-drawer-action]')?.dataset.drawerAction;
    if (action) await handleDrawerAction(action);
    if (event.target.closest('[data-confirm-close]')) {
      const reason = document.querySelector('[data-close-select]')?.value;
      C.updateReport(state.selectedId, { status: 'Closed', closeReason: reason });
      C.showToast('Report closed', `${state.selectedId} closed as false alarm.`);
      closeDrawers(); renderList();
    }
    if (event.target.closest('[data-send-rider-message]')) {
      const message = document.querySelector('[data-rider-message]')?.value || '';
      C.updateReport(state.selectedId, { requestMoreInfo: message, status: 'Acknowledged' });
      C.showToast('Request sent to Rider', message.slice(0, 75));
      closeDrawers(); renderList();
    }
  });

  document.querySelector('[data-operator-incident-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('[type="submit"]');
    submitButton?.setAttribute('disabled', 'disabled');
    try {
      const formData = new FormData(form);
      const voiceNote = C.getRecordedVoiceNote(form);
      const mediaFiles = await C.uploadMediaFiles(form.querySelector('[data-media-upload]'), { role: 'Operator', category: 'incident', extraFiles: voiceNote ? [voiceNote] : [] });
      const flags = C.mediaFlags(mediaFiles);
      const report = C.createOperatorIncident({
        riskType: formData.get('riskType'),
        severity: formData.get('severity'),
        details: formData.get('details'),
        route: formData.get('route'),
        busId: formData.get('busId'),
        direction: formData.get('direction'),
        location: formData.get('location'),
        nearestStop: formData.get('nearestStop'),
        latitude: formData.get('latitude'),
        longitude: formData.get('longitude'),
        locationAccuracy: formData.get('locationAccuracy'),
        locationSource: formData.get('locationSource'),
        mediaNotes: formData.get('mediaNotes'),
        mediaFiles,
        ...flags
      });
      C.showToast('Incident submitted', `${report.riskType} · ${report.route}`);
      if (report.severity === 'Immediate Assistance' || report.severity === 'High') await C.escalateToAdmin(report);
      form.reset();
      document.querySelector('[data-media-preview]').innerHTML = '<small>No files selected.</small>';
      C.clearVoiceRecorder(form);
      closeDrawers();
      renderList();
    } catch (error) {
      C.showToast('Upload failed', error.message || 'Media upload could not be completed.');
    } finally {
      submitButton?.removeAttribute('disabled');
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-filter-status], [data-filter-source], [data-filter-date], [data-filter-risk]')) renderList();
    if (event.target.matches('[data-media-upload]')) C.selectedMediaPreview(event.target, event.target.closest('form')?.querySelector('[data-media-preview]'));
    if (event.target.matches('[data-incident-risk]')) {
      const severity = C.severityForRisk(event.target.value);
      const severitySelect = document.querySelector('[name="severity"]');
      if (severitySelect) severitySelect.value = severity;
    }
  });

  document.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
    document.querySelector('[data-filter-status]').value = 'All';
    document.querySelector('[data-filter-source]').value = 'All';
    document.querySelector('[data-filter-date]').value = '';
    document.querySelector('[data-filter-risk]').value = 'All';
    renderList();
  });

  populateRiskFilter();
  renderList();
  if (location.hash === '#report-incident') openIncidentForm();
});
