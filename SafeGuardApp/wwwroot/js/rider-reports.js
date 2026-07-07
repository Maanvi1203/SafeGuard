document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const riskSelect = document.querySelector('[data-rider-risk]');
  if (riskSelect) {
    riskSelect.innerHTML = (window.SafeGuardData.riskTypes || []).map(r => `<option>${C.escapeHtml(r)}</option>`).join('');
  }

  function getRiderReports() {
    return C.getReports().filter(r => r.source === 'Rider');
  }

  function render() {
    const status = document.querySelector('[data-rider-status-filter]')?.value || 'All';
    let reports = getRiderReports();
    if (status !== 'All') reports = reports.filter(r => r.status === status);
    document.querySelector('[data-rider-report-count]').textContent = `${reports.length} reports`;
    const root = document.querySelector('[data-rider-report-list]');
    if (!root) return;
    root.innerHTML = reports.map(r => `
      <tr>
        <td>${C.formatTime(r.time)}</td>
        <td><span class="status-chip ${C.statusClass(r.status)}">${C.escapeHtml(r.status)}</span></td>
        <td>${C.escapeHtml(r.riskType)}</td>
        <td><strong>${C.escapeHtml(r.route)}</strong><br><small>Bus ${C.escapeHtml(r.busId)}</small></td>
        <td>${C.escapeHtml(r.location)}</td>
        <td>${C.escapeHtml(r.riderMessage || r.transcript || '')}</td>
      </tr>`).join('') || '<tr><td colspan="6">No reports found.</td></tr>';
  }

  document.querySelector('[data-rider-report-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('[type="submit"]');
    submitButton?.setAttribute('disabled', 'disabled');
    try {
      const data = new FormData(form);
      const reports = C.getReports();
      const riskType = data.get('riskType');
      const vehicleArea = data.get('vehicleArea');
      const voiceNote = C.getRecordedVoiceNote(form);
      const mediaFiles = await C.uploadMediaFiles(form.querySelector('[data-media-upload]'), { role: 'Rider', category: 'report', extraFiles: voiceNote ? [voiceNote] : [] });
      const flags = C.mediaFlags(mediaFiles);
      const mediaSummary = mediaFiles.length ? `${mediaFiles.length} file${mediaFiles.length === 1 ? '' : 's'} uploaded.` : '';
      const report = {
        id: `RR-${Math.floor(3000 + Math.random() * 6000)}`,
        source: 'Rider',
        reporterName: 'Rider User',
        time: new Date().toISOString(),
        status: 'Pending',
        route: data.get('route'),
        busId: data.get('busId'),
        division: 'Eglinton Division',
        riskType,
        severity: C.severityForRisk(riskType),
        location: data.get('location'),
        latitude: data.get('latitude'),
        longitude: data.get('longitude'),
        locationAccuracy: data.get('locationAccuracy'),
        locationSource: data.get('locationSource'),
        nearestStop: data.get('location'),
        nextStop: 'Next stop pending',
        direction: 'Direction pending',
        confidence: 72,
        audioClip: '/media/audio/normal-check.wav',
        transcript: `Rider report from ${vehicleArea}. ${data.get('details')}`,
        keywords: [riskType, vehicleArea, 'rider report'],
        riderMessage: data.get('details'),
        operatorNotes: '',
        mediaNotes: mediaSummary,
        mediaFiles,
        ...flags
      };
      reports.unshift(report);
      C.saveReports(reports);
      C.showToast('Report submitted', `${report.id} sent to Operator review.`);
      form.reset();
      document.querySelector('[data-media-preview]').innerHTML = '<small>No files selected.</small>';
      C.clearVoiceRecorder(form);
      if (riskSelect) riskSelect.selectedIndex = 0;
      render();
    } catch (error) {
      C.showToast('Upload failed', error.message || 'Media upload could not be completed.');
    } finally {
      submitButton?.removeAttribute('disabled');
    }
  });

  document.querySelector('[data-rider-status-filter]')?.addEventListener('change', render);
  document.querySelector('[data-media-upload]')?.addEventListener('change', event => C.selectedMediaPreview(event.target, document.querySelector('[data-media-preview]')));
  render();
});
