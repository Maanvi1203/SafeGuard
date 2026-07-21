window.SafeGuardCommon = (() => {
  let connection = null;
  const adminCallbacks = [];
  const videoEventsKey = 'safeguard.operator.videoAnalysisEvents';
  let videoAnalysisEvents = loadVideoAnalysisEvents();
  const voiceRecorderStates = new WeakMap();
  let googleMapsLoader = null;

  function $(selector, root = document) { return root.querySelector(selector); }
  function $all(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

  function formatTime(value) {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function statusClass(status) {
    return String(status || '').replaceAll(' ', '-').replaceAll('/', '-');
  }

  function severityForRisk(riskType) {
    const map = {
      'Passenger violence': 'Immediate Assistance',
      'Weapons threat': 'Immediate Assistance',
      'Gunshot audio trigger': 'Immediate Assistance',
      'Fight onboard': 'Immediate Assistance',
      'Medical emergency': 'Immediate Assistance',
      'Glass break audio trigger': 'High',
      'Scream/panic audio trigger': 'High',
      'Forced door/boarding issue': 'High',
      'Driver harassment/threats': 'High',
      'Unattended bag/package': 'High',
      'Route hazard/collision risk': 'High',
      'Communication failure': 'High',
      'Driver distraction': 'High',
      'Cybersecurity/data breach': 'High',
      'False positive audio detection': 'Low/Medium'
    };
    return map[riskType] || 'Medium';
  }

  function showToast(title, message, options = {}) {
    const region = $('[data-toast-region]');
    if (!region) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(message || '')}</span><br><small>${new Date().toLocaleTimeString()}</small>`;
    region.prepend(toast);
    setTimeout(() => toast.remove(), options.timeout || 5200);

    const settings = getSettings();
    if (settings.toast && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/images/ttc-logo.png' });
    }
    if (settings.sound) playBeep();
  }

  function playBeep() {
    try {
      const audio = new Audio('/media/audio/normal-check.wav');
      audio.volume = 0.2;
      audio.play().catch(() => {});
    } catch (_) {}
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function getReports() {
    const saved = localStorage.getItem('safeguard.operator.reports');
    if (saved) {
      try { return JSON.parse(saved); } catch (_) { localStorage.removeItem('safeguard.operator.reports'); }
    }
    localStorage.setItem('safeguard.operator.reports', JSON.stringify(window.SafeGuardData.reports));
    return [...window.SafeGuardData.reports];
  }

  function saveReports(reports) {
    localStorage.setItem('safeguard.operator.reports', JSON.stringify(reports));
  }

  function updateReport(reportId, updates) {
    const reports = getReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index === -1) return null;
    reports[index] = { ...reports[index], ...updates, updatedAt: new Date().toISOString() };
    saveReports(reports);
    return reports[index];
  }

  function createOperatorIncident(formData) {
    const reports = getReports();
    const riskType = formData.riskType || 'Vandalism/property damage';
    const now = new Date();
    const report = {
      id: `OP-${Math.floor(2000 + Math.random() * 7000)}`,
      source: 'Operator',
      reporterName: window.SafeGuardData.operator?.name || 'Operator',
      time: now.toISOString(),
      status: 'Acknowledged',
      route: formData.route || '54 Lawrence East',
      busId: formData.busId || '3700',
      division: window.SafeGuardData.operator?.depot || 'Eglinton Division',
      riskType,
      severity: formData.severity || severityForRisk(riskType),
      location: formData.location || 'Current vehicle location',
      nearestStop: formData.nearestStop || 'Auto-filled nearest stop',
      nextStop: formData.nextStop || 'Next stop pending',
      direction: formData.direction || 'Direction pending',
      confidence: 100,
      audioClip: '/media/audio/normal-check.wav',
      transcript: `Operator-created incident. ${formData.details || ''}`.trim(),
      keywords: [riskType, 'operator report'].concat(String(formData.details || '').split(/\s+/).filter(w => w.length > 5).slice(0, 3)),
      riderMessage: '',
      operatorNotes: formData.details || '',
      mediaNotes: formData.mediaNotes || '',
      mediaFiles: formData.mediaFiles || [],
      hasPhoto: Boolean(formData.hasPhoto),
      hasVideo: Boolean(formData.hasVideo),
      hasAudio: Boolean(formData.hasAudio),
      hasDocument: Boolean(formData.hasDocument),
      latitude: formData.latitude || '',
      longitude: formData.longitude || '',
      locationAccuracy: formData.locationAccuracy || '',
      locationSource: formData.locationSource || ''
    };
    reports.unshift(report);
    saveReports(reports);
    return report;
  }

  function loadVideoAnalysisEvents() {
    const saved = localStorage.getItem(videoEventsKey);
    if (!saved) return [];
    try { return JSON.parse(saved).slice(0, 50); } catch (_) { return []; }
  }

  function persistVideoAnalysisEvents() {
    localStorage.setItem(videoEventsKey, JSON.stringify(videoAnalysisEvents.slice(0, 50)));
  }

  function getVideoAnalysisEvents() {
    return [...videoAnalysisEvents];
  }

  function saveVideoAnalysisEvent(event) {
    videoAnalysisEvents.unshift({ ...event, savedAt: new Date().toISOString() });
    videoAnalysisEvents = videoAnalysisEvents.slice(0, 50);
    persistVideoAnalysisEvents();
    return videoAnalysisEvents[0];
  }

  function replaceVideoAnalysisEvents(events) {
    videoAnalysisEvents = [...events].slice(0, 50);
    persistVideoAnalysisEvents();
    return getVideoAnalysisEvents();
  }


  function classifyMedia(file) {
    const name = String(file?.originalName || file?.name || file?.url || '').toLowerCase();
    const contentType = String(file?.contentType || file?.type || '').toLowerCase();
    if (contentType.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|heic)$/.test(name)) return 'image';
    if (contentType.startsWith('video/') || /\.(mp4|mov|webm)$/.test(name)) return 'video';
    if (contentType.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|webm)$/.test(name)) return 'audio';
    if (/\.(pdf|doc|docx|txt)$/.test(name)) return 'document';
    return file?.mediaType || 'file';
  }

  function mediaFlags(files = []) {
    const types = files.map(classifyMedia);
    return {
      hasPhoto: types.includes('image'),
      hasVideo: types.includes('video'),
      hasAudio: types.includes('audio'),
      hasDocument: types.includes('document')
    };
  }

  function readableFileSize(bytes) {
    const value = Number(bytes || 0);
    if (!value) return '';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${Math.round(value / 102.4) / 10} KB`;
    return `${Math.round(value / 1024 / 102.4) / 10} MB`;
  }

  function renderMediaAttachments(files = []) {
    if (!Array.isArray(files) || files.length === 0) return '<p>No media uploaded.</p>';
    return `<div class="media-attachment-grid">${files.map(file => {
      const type = classifyMedia(file);
      const url = file.url || file.objectUrl || '#';
      const name = escapeHtml(file.originalName || file.name || 'Uploaded media');
      const size = readableFileSize(file.sizeBytes || file.size);
      const meta = `${escapeHtml(type)}${size ? ` · ${escapeHtml(size)}` : ''}`;
      if (type === 'image') return `<figure class="media-card"><a href="${escapeHtml(url)}" target="_blank" rel="noopener"><img src="${escapeHtml(url)}" alt="${name}" /></a><figcaption>${name}<br><small>${meta}</small></figcaption></figure>`;
      if (type === 'video') return `<figure class="media-card"><video controls preload="metadata" src="${escapeHtml(url)}"></video><figcaption>${name}<br><small>${meta}</small></figcaption></figure>`;
      if (type === 'audio') return `<figure class="media-card"><audio controls preload="none" src="${escapeHtml(url)}"></audio><figcaption>${name}<br><small>${meta}</small></figcaption></figure>`;
      return `<article class="media-card document"><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${name}</a><small>${meta}</small></article>`;
    }).join('')}</div>`;
  }

  function selectedMediaPreview(input, previewRoot) {
    if (!input || !previewRoot) return;
    const files = Array.from(input.files || []);
    const voiceNote = getRecordedVoiceNote(input.closest('form') || document);
    const allFiles = voiceNote ? files.concat(voiceNote) : files;
    if (!allFiles.length) { previewRoot.innerHTML = '<small>No files selected.</small>'; return; }
    previewRoot.innerHTML = renderMediaAttachments(allFiles.map(file => ({
      name: file.name,
      originalName: file.name,
      size: file.size,
      type: file.type,
      contentType: file.type,
      objectUrl: URL.createObjectURL(file)
    })));
  }

  async function uploadMediaFiles(input, options = {}) {
    const files = Array.from(input?.files || []).concat(options.extraFiles || []);
    if (!files.length) return [];

    const maxBytes = options.maxBytes || 50 * 1024 * 1024;
    const oversized = files.find(file => file.size > maxBytes);
    if (oversized) {
      throw new Error(`${oversized.name} is larger than the 50 MB upload limit.`);
    }

    const form = new FormData();
    files.forEach(file => form.append('files', file));
    form.append('role', options.role || document.body.dataset.role || 'general');
    form.append('category', options.category || 'incident');

    try {
      const response = await fetch('/api/media/upload', { method: 'POST', body: form });
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.warn('Media upload failed; keeping local media metadata only.', error);
      showToast('Media saved locally', 'Server upload was unavailable, so the report keeps file names only.');
      return files.map(file => ({
        id: `local-${window.crypto?.randomUUID ? window.crypto.randomUUID() : Date.now()}`,
        originalName: file.name,
        storedName: file.name,
        contentType: file.type || 'application/octet-stream',
        mediaType: classifyMedia(file),
        sizeBytes: file.size,
        role: options.role || document.body.dataset.role || 'general',
        category: options.category || 'incident',
        uploadedAt: new Date().toISOString(),
        url: '',
        localOnly: true
      }));
    }
  }


  function supportedAudioMimeType() {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
    return candidates.find(type => window.MediaRecorder?.isTypeSupported?.(type)) || '';
  }

  function extensionForAudioType(type) {
    return String(type || '').includes('ogg') ? 'ogg' : 'webm';
  }

  function setVoiceStatus(container, message) {
    const status = $('[data-voice-status]', container);
    if (status) status.textContent = message;
  }

  function initVoiceRecorder(container) {
    if (!container || voiceRecorderStates.has(container)) return;
    const state = { chunks: [], recorder: null, stream: null, blob: null, url: '', mimeType: supportedAudioMimeType() };
    voiceRecorderStates.set(container, state);
    const start = $('[data-voice-start]', container);
    const stop = $('[data-voice-stop]', container);
    const clear = $('[data-voice-clear]', container);
    const playback = $('[data-voice-playback]', container);

    async function startRecording() {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setVoiceStatus(container, 'Voice recording is not supported in this browser.');
        return;
      }
      try {
        state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.chunks = [];
        state.blob = null;
        if (state.url) URL.revokeObjectURL(state.url);
        state.url = '';
        state.recorder = new MediaRecorder(state.stream, state.mimeType ? { mimeType: state.mimeType } : undefined);
        state.recorder.addEventListener('dataavailable', event => { if (event.data?.size) state.chunks.push(event.data); });
        state.recorder.addEventListener('stop', () => {
          state.blob = new Blob(state.chunks, { type: state.mimeType || 'audio/webm' });
          state.url = URL.createObjectURL(state.blob);
          if (playback) {
            playback.src = state.url;
            playback.hidden = false;
          }
          start.disabled = false;
          stop.disabled = true;
          clear.disabled = false;
          setVoiceStatus(container, `Voice note ready · ${readableFileSize(state.blob.size)}`);
          const form = container.closest('form');
          const uploadInput = form?.querySelector('[data-media-upload]');
          const previewRoot = form?.querySelector('[data-media-preview]');
          if (uploadInput && previewRoot) selectedMediaPreview(uploadInput, previewRoot);
          state.stream?.getTracks().forEach(track => track.stop());
          state.stream = null;
        });
        state.recorder.start();
        start.disabled = true;
        stop.disabled = false;
        clear.disabled = true;
        if (playback) playback.hidden = true;
        setVoiceStatus(container, 'Recording voice note...');
      } catch (error) {
        setVoiceStatus(container, 'Microphone permission was not granted.');
        showToast('Voice note unavailable', error.message || 'Microphone access failed.');
      }
    }

    function stopRecording() {
      if (state.recorder?.state === 'recording') state.recorder.stop();
    }

    function clearRecording() {
      if (state.recorder?.state === 'recording') state.recorder.stop();
      state.stream?.getTracks().forEach(track => track.stop());
      state.stream = null;
      state.recorder = null;
      state.chunks = [];
      state.blob = null;
      if (state.url) URL.revokeObjectURL(state.url);
      state.url = '';
      if (playback) {
        playback.removeAttribute('src');
        playback.hidden = true;
      }
      start.disabled = false;
      stop.disabled = true;
      clear.disabled = true;
      setVoiceStatus(container, 'No voice note recorded.');
      const form = container.closest('form');
      const uploadInput = form?.querySelector('[data-media-upload]');
      const previewRoot = form?.querySelector('[data-media-preview]');
      if (uploadInput && previewRoot) selectedMediaPreview(uploadInput, previewRoot);
    }

    start?.addEventListener('click', startRecording);
    stop?.addEventListener('click', stopRecording);
    clear?.addEventListener('click', clearRecording);
  }

  function initVoiceRecorders(root = document) {
    $all('[data-voice-recorder]', root).forEach(initVoiceRecorder);
  }

  function getRecordedVoiceNote(root = document) {
    const container = root.querySelector?.('[data-voice-recorder]');
    if (!container) return null;
    const state = voiceRecorderStates.get(container);
    if (!state?.blob) return null;
    const extension = extensionForAudioType(state.blob.type || state.mimeType);
    return new File([state.blob], `voice-note-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`, { type: state.blob.type || 'audio/webm' });
  }

  function clearVoiceRecorder(root = document) {
    const container = root.querySelector?.('[data-voice-recorder]');
    if (!container) return;
    $('[data-voice-clear]', container)?.click();
  }

  function googleMapsApiKey() {
    return document.querySelector('meta[name="google-maps-api-key"]')?.content?.trim() || '';
  }

  function loadGoogleMapsApi() {
    if (window.google?.maps) return Promise.resolve(window.google.maps);
    const key = googleMapsApiKey();
    if (!key) return Promise.resolve(null);
    if (googleMapsLoader) return googleMapsLoader;
    googleMapsLoader = new Promise((resolve, reject) => {
      const callbackName = `safeGuardGoogleMaps${Date.now()}`;
      window[callbackName] = () => {
        resolve(window.google.maps);
        delete window[callbackName];
      };
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        delete window[callbackName];
        googleMapsLoader = null;
        reject(new Error('Google Maps JavaScript API could not be loaded.'));
      };
      document.head.appendChild(script);
    });
    return googleMapsLoader;
  }

  function browserGeolocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Browser location is not supported.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 15000
      });
    });
  }

  async function reverseGeocode(lat, lng) {
    const maps = await loadGoogleMapsApi().catch(() => null);
    if (!maps?.Geocoder) return '';
    const geocoder = new maps.Geocoder();
    const result = await geocoder.geocode({ location: { lat, lng } }).catch(() => null);
    return result?.results?.[0]?.formatted_address || '';
  }

  async function drawGoogleMap(mapRoot, lat, lng) {
    if (!mapRoot) return;
    const maps = await loadGoogleMapsApi().catch(() => null);
    mapRoot.hidden = false;
    if (!maps?.Map) {
      mapRoot.innerHTML = `<a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener">Open location in Google Maps</a>`;
      return;
    }
    mapRoot.innerHTML = '';
    const position = { lat, lng };
    const map = new maps.Map(mapRoot, { center: position, zoom: 16, mapTypeControl: false, streetViewControl: false, fullscreenControl: false });
    new maps.Marker({ position, map, title: 'Live location' });
  }

  function setLocationFields(form, detail) {
    if (!form || !detail) return;
    const { lat, lng, accuracy, address } = detail;
    const addressInput = $('[data-location-address]', form) || form.elements?.location;
    const latInput = $('[data-location-lat]', form);
    const lngInput = $('[data-location-lng]', form);
    const accuracyInput = $('[data-location-accuracy]', form);
    const sourceInput = $('[data-location-source]', form);
    if (addressInput) addressInput.value = address || `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
    if (latInput) latInput.value = String(lat);
    if (lngInput) lngInput.value = String(lng);
    if (accuracyInput) accuracyInput.value = Math.round(accuracy || 0).toString();
    if (sourceInput) sourceInput.value = address ? 'Google Maps reverse geocoding' : 'Browser geolocation coordinates';
  }

  async function locateCurrentPosition(picker) {
    const form = picker?.closest('form');
    const status = $('[data-location-status]', picker);
    const mapRoot = $('[data-location-map]', picker);
    if (status) status.textContent = 'Locating...';
    try {
      const position = await browserGeolocation();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      const address = await reverseGeocode(lat, lng);
      setLocationFields(form, { lat, lng, accuracy, address });
      await drawGoogleMap(mapRoot, lat, lng);
      if (status) status.textContent = `${address ? 'Google location found' : 'Coordinates captured'} · ±${Math.round(accuracy || 0)}m`;
      return { lat, lng, accuracy, address };
    } catch (error) {
      if (status) status.textContent = 'Location unavailable. Enter it manually.';
      showToast('Location unavailable', error.message || 'Could not access live location.');
      return null;
    }
  }

  function renderLocationCard(report) {
    const lat = Number(report.latitude);
    const lng = Number(report.longitude);
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
    const address = escapeHtml(report.location || 'Location pending');
    const nearest = escapeHtml(report.nearestStop || 'Nearest stop pending');
    const next = escapeHtml(report.nextStop || 'Next stop pending');
    const coordinateText = hasCoordinates ? `<small>Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}${report.locationAccuracy ? ` · ±${escapeHtml(report.locationAccuracy)}m` : ''}</small><a class="audio-link" href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener">Open in Google Maps</a>` : '';
    return `<div class="map-card"><span class="pin"></span><strong>${address}</strong><small>Nearest stop: ${nearest} · Next stop: ${next}</small>${coordinateText}</div>`;
  }

  function getSettings() {
    const defaults = { sound: true, toast: true };
    const saved = localStorage.getItem('safeguard.operator.settings');
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  }

  function saveSettings(settings) {
    localStorage.setItem('safeguard.operator.settings', JSON.stringify(settings));
  }

  function connectSignalR(role = 'Operator') {
    if (connection || !window.signalR) return connection;
    try {
      connection = new signalR.HubConnectionBuilder().withUrl('/hubs/alerts').withAutomaticReconnect().build();
      connection.on('AdminAlertReceived', payload => adminCallbacks.forEach(cb => cb(payload)));
      connection.on('EscalationConfirmed', payload => showToast('Escalation sent', `${payload.id || 'Report'} sent to Admin.`));
      connection.on('VideoRiskConfirmed', payload => showToast('Video risk confirmed', `${payload.className || 'Violence/Fight'} ${payload.confidence || ''}%`.trim()));
      connection.start().then(() => connection.invoke('JoinRoleGroup', role)).catch(() => {});
    } catch (_) {}
    return connection;
  }

  async function escalateToAdmin(report) {
    const payload = { id: report.id, riskType: report.riskType, source: report.source, location: report.location, route: report.route, busId: report.busId, time: new Date().toISOString() };
    if (connection && connection.state === 'Connected') {
      await connection.invoke('EscalateReport', payload).catch(() => {});
    }
    showToast('Escalated', `${report.id} sent to Admin.`);
  }

  async function sendVideoRiskToAdmin(event) {
    if (connection && connection.state === 'Connected') {
      await connection.invoke('SendVideoRisk', event).catch(() => {});
    }
    showToast('Video risk sent', `${event.className || 'Violence/Fight'} event sent to Admin.`);
  }

  function onAdminAlert(callback) { adminCallbacks.push(callback); }

  function initChrome() {
    initVoiceRecorders(document);
    document.addEventListener('click', event => {
      const locateButton = event.target.closest('[data-locate-current]');
      if (locateButton) locateCurrentPosition(locateButton.closest('[data-location-picker]'));
    });
    const roleToggle = $('[data-role-toggle]');
    const roleMenu = $('[data-role-menu]');
    roleToggle?.addEventListener('click', () => roleMenu?.classList.toggle('open'));
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.role-switcher')) roleMenu?.classList.remove('open');
    });
    $all('[data-role-option]').forEach(btn => btn.addEventListener('click', () => {
      const role = btn.dataset.roleOption;
      const routes = {
        Operator: '/Operator/Dashboard',
        Rider: '/Rider/Dashboard',
        Management: '/Management/Dashboard',
        Admin: '/Admin/Dashboard'
      };
      if (document.body.dataset.role === role) return;
      window.location.href = routes[role] || '/Operator/Dashboard';
    }));

    const body = document.body;
    const sidebar = document.querySelector('[data-sidebar]');
    const overlay = document.querySelector('[data-sidebar-overlay]');
    const sidebarToggle = document.querySelector('[data-sidebar-toggle]');

    // Initialize sidebar state from localStorage
    const saved = localStorage.getItem('safeguard.sidebar.collapsed');
    const isCollapsed = saved === 'true';
    function applySidebarState(collapsed) {
      if (!sidebar) return;
      sidebar.setAttribute('aria-expanded', String(!collapsed));
      sidebar.dataset.collapsed = collapsed ? 'true' : 'false';
      // Ensure toggle visibility and tooltip bindings when collapsed
      const brand = sidebar.querySelector('.brand');
      const toggle = sidebar.querySelector('[data-sidebar-toggle]');
      if (collapsed && brand && toggle) {
        // show toggle when hovering/focusing brand
        brand.addEventListener('mouseenter', () => toggle.style.opacity = '1');
        brand.addEventListener('focus', () => toggle.style.opacity = '1');
        brand.addEventListener('mouseleave', () => toggle.style.opacity = '');
        brand.addEventListener('blur', () => toggle.style.opacity = '');
      }
      if (collapsed) {
        document.documentElement.style.setProperty('--app-shell-sidebar-width', 'var(--sidebar-collapsed-width)');
      } else {
        document.documentElement.style.setProperty('--app-shell-sidebar-width', 'var(--sidebar-expanded-width)');
      }
      // update toggle button aria/state
      if (sidebarToggle) {
        sidebarToggle.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
        sidebarToggle.setAttribute('aria-label', collapsed ? 'Expand sidebar' : 'Collapse sidebar');
      }
    }
    applySidebarState(isCollapsed);

    function openSidebar() {
      sidebar?.classList.add('open');
      body.classList.add('sidebar-open');
      if (overlay) { overlay.hidden = false; overlay.classList.add('open'); }
      document.documentElement.style.overflow = 'hidden';
    }
    function closeSidebar() {
      sidebar?.classList.remove('open');
      body.classList.remove('sidebar-open');
      if (overlay) { overlay.classList.remove('open'); overlay.hidden = true; }
      document.documentElement.style.overflow = '';
    }
    $('[data-mobile-menu]')?.addEventListener('click', openSidebar);
    $('[data-mobile-close]')?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);

    // Toggle collapse/expand behavior
    function toggleCollapse() {
      const collapsed = sidebar?.dataset.collapsed === 'true';
      const next = !collapsed;
      if (sidebar) sidebar.dataset.collapsed = next ? 'true' : 'false';
      applySidebarState(next);
      try { localStorage.setItem('safeguard.sidebar.collapsed', next ? 'true' : 'false'); } catch (_) {}
    }
    sidebarToggle?.addEventListener('click', (e) => { e.stopPropagation(); toggleCollapse(); });
    // allow keyboard toggling
    sidebarToggle?.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapse(); } });
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSidebar();
    });
    // Close sidebar when resizing to desktop to avoid stuck mobile drawer
    window.addEventListener('resize', () => {
      if (window.innerWidth > 991 && sidebar?.classList.contains('open')) {
        closeSidebar();
      }
    });
    // Close sidebar when a nav link is clicked on mobile
    $all('.sidebar-nav .nav-link')?.forEach(a => a.addEventListener('click', () => {
      if (window.innerWidth <= 767) closeSidebar();
    }));

    $('[data-notification-permission]')?.addEventListener('click', async () => {
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        showToast('Toasts', result === 'granted' ? 'Enabled.' : 'Permission not granted.');
      } else {
        showToast('Toasts', 'Not supported.');
      }
    });

    connectSignalR(document.body.dataset.role || 'Operator');
  }

  document.addEventListener('DOMContentLoaded', initChrome);

  return {
    $, $all, formatTime, statusClass, severityForRisk, showToast, getReports, saveReports,
    updateReport, createOperatorIncident, uploadMediaFiles, selectedMediaPreview, renderMediaAttachments, getRecordedVoiceNote, clearVoiceRecorder,
    initVoiceRecorders, locateCurrentPosition, renderLocationCard, mediaFlags, classifyMedia, getVideoAnalysisEvents, saveVideoAnalysisEvent, replaceVideoAnalysisEvents,
    getSettings, saveSettings, connectSignalR, escalateToAdmin, sendVideoRiskToAdmin, onAdminAlert, escapeHtml
  };
})();
