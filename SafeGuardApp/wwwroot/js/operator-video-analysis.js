document.addEventListener('DOMContentLoaded', () => {
  const C = window.SafeGuardCommon;
  const modelUrl = '/violenceDetectionModel/Yolo_nano_weights.onnx';
  const inputSize = 640;
  const frameIntervalMs = 1200;

  const frame = document.querySelector('[data-video-frame]');
  const poster = document.querySelector('[data-video-poster]');
  const video = document.querySelector('[data-live-video]');
  const overlay = document.querySelector('[data-detection-overlay]');
  const toggleButton = document.querySelector('[data-toggle-video-analysis]');
  const result = document.querySelector('[data-video-analysis-result]');
  const sourceSelect = document.querySelector('[data-video-source]');

  let running = false;
  let stream = null;
  let session = null;
  let usingFallback = false;
  let loopHandle = null;
  let lastFrameAt = 0;
  let lastEventAt = 0;

  function renderHistory() {
    const list = document.querySelector('[data-video-analysis-history]');
    if (!list) return;
    const events = C.getVideoAnalysisEvents();
    list.innerHTML = events.map(evt => `
      <li>
        <strong>${C.escapeHtml(evt.className)} · ${evt.confidence}%</strong><br>
        <small>${C.escapeHtml(evt.source)} · ${new Date(evt.time).toLocaleString()}</small><br>
        <small>${C.escapeHtml(evt.action || 'Logged')}</small>
      </li>`).join('') || '<li>No analysis events yet.</li>';
  }

  function setStatus(text, danger = false) {
    const status = document.querySelector('[data-video-analysis-status]');
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('danger', danger);
  }

  function getThreshold() {
    const raw = Number(document.querySelector('[data-video-threshold]')?.value || window.SafeGuardData.videoAnalysis.threshold || 30);
    return Math.max(1, Math.min(99, raw));
  }

  function getSourceMode() {
    return sourceSelect?.value || 'front-camera';
  }

  function getSourceLabel() {
    const selected = sourceSelect?.selectedOptions?.[0];
    return selected?.textContent?.trim() || 'Front camera';
  }

  function getCameraFacingMode() {
    const sourceMode = getSourceMode();
    if (sourceMode === 'back-camera' || sourceMode === 'rear-door-camera') return 'environment';
    return 'user';
  }

  function sizeOverlay() {
    if (!frame || !overlay) return;
    const rect = frame.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (overlay.width !== width || overlay.height !== height) {
      overlay.width = width;
      overlay.height = height;
    }
  }

  function clearOverlay() {
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  }

  function drawDetections(detections) {
    if (!overlay) return;
    sizeOverlay();
    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    detections.forEach(det => {
      const x = det.x * overlay.width;
      const y = det.y * overlay.height;
      const w = det.w * overlay.width;
      const h = det.h * overlay.height;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ef4444';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.strokeRect(x, y, w, h);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#ef4444';
      ctx.font = '700 14px system-ui, sans-serif';
      const label = `${det.className} ${Math.round(det.confidence)}%`;
      const labelWidth = Math.min(ctx.measureText(label).width + 14, overlay.width - x);
      ctx.fillRect(x, Math.max(0, y - 26), labelWidth, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, x + 7, Math.max(16, y - 9));
    });
  }

  function setResult(detected, confidence, threshold, source, mode) {
    if (!result) return;
    result.innerHTML = detected
      ? `<strong>Violence/Fight detected</strong><br><span>${confidence}% confidence · ${C.escapeHtml(source)} · ${C.escapeHtml(mode)}</span>`
      : `<strong>No confirmed fight detected</strong><br><span>${confidence}% confidence below ${threshold}% threshold · ${C.escapeHtml(source)} · ${C.escapeHtml(mode)}</span>`;
  }

  async function loadSession() {
    if (session) return session;
    if (!window.ort) throw new Error('ONNX Runtime Web is not loaded.');
    session = await window.ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'] });
    return session;
  }

  function getFrameSource() {
    if (video && !video.hidden && video.readyState >= 2) return video;
    return poster;
  }

  function makeInputTensor() {
    const source = getFrameSource();
    if (!source || !window.ort) return null;

    const scratch = document.createElement('canvas');
    scratch.width = inputSize;
    scratch.height = inputSize;
    const ctx = scratch.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0, inputSize, inputSize);
    const image = ctx.getImageData(0, 0, inputSize, inputSize).data;
    const tensorData = new Float32Array(1 * 3 * inputSize * inputSize);
    const plane = inputSize * inputSize;
    for (let i = 0; i < plane; i += 1) {
      const pixel = i * 4;
      tensorData[i] = image[pixel] / 255;
      tensorData[plane + i] = image[pixel + 1] / 255;
      tensorData[(2 * plane) + i] = image[pixel + 2] / 255;
    }
    return new window.ort.Tensor('float32', tensorData, [1, 3, inputSize, inputSize]);
  }

  function normalizeBox(x, y, w, h) {
    let nx = x;
    let ny = y;
    let nw = w;
    let nh = h;
    if (Math.max(Math.abs(x), Math.abs(y), Math.abs(w), Math.abs(h)) > 2) {
      nx = x / inputSize;
      ny = y / inputSize;
      nw = w / inputSize;
      nh = h / inputSize;
    }
    // YOLO boxes are usually center-x, center-y, width, height.
    nx -= nw / 2;
    ny -= nh / 2;
    return {
      x: Math.max(0, Math.min(0.98, nx)),
      y: Math.max(0, Math.min(0.98, ny)),
      w: Math.max(0.04, Math.min(1, nw)),
      h: Math.max(0.04, Math.min(1, nh))
    };
  }

  function parseYoloOutput(output, threshold) {
    const data = output?.data;
    const dims = output?.dims || [];
    if (!data || dims.length < 2) return [];

    const detections = [];
    const thresholdRatio = threshold / 100;

    if (dims.length === 3) {
      const a = dims[1];
      const b = dims[2];

      // Common YOLOv8 shape: [1, attributes, boxes].
      if (a <= 128 && b > a) {
        const attrs = a;
        const boxes = b;
        for (let i = 0; i < boxes; i += 1) {
          const x = data[i];
          const y = data[boxes + i];
          const w = data[(2 * boxes) + i];
          const h = data[(3 * boxes) + i];
          let score = attrs > 4 ? data[(4 * boxes) + i] : 0;
          for (let attr = 5; attr < attrs; attr += 1) {
            score = Math.max(score, data[(attr * boxes) + i]);
          }
          if (score >= thresholdRatio) {
            detections.push({ ...normalizeBox(x, y, w, h), className: 'Violence/Fight', confidence: score * 100 });
          }
        }
      }

      // Alternate shape: [1, boxes, attributes].
      if (b <= 128 && a > b) {
        const boxes = a;
        const attrs = b;
        for (let i = 0; i < boxes; i += 1) {
          const offset = i * attrs;
          const x = data[offset];
          const y = data[offset + 1];
          const w = data[offset + 2];
          const h = data[offset + 3];
          let score = attrs > 4 ? data[offset + 4] : 0;
          for (let attr = 5; attr < attrs; attr += 1) {
            score = Math.max(score, data[offset + attr]);
          }
          if (score >= thresholdRatio) {
            detections.push({ ...normalizeBox(x, y, w, h), className: 'Violence/Fight', confidence: score * 100 });
          }
        }
      }
    }

    return detections
      .sort((left, right) => right.confidence - left.confidence)
      .slice(0, 3);
  }

  async function analyzeWithOnnx(threshold) {
    const sess = await loadSession();
    const tensor = makeInputTensor();
    if (!tensor) throw new Error('Unable to read video frame.');
    const feeds = { [sess.inputNames[0]]: tensor };
    const outputs = await sess.run(feeds);
    const output = outputs[sess.outputNames[0]];
    return parseYoloOutput(output, threshold);
  }

  function analyzeWithFallback(threshold) {
    const confidence = Math.floor(18 + Math.random() * 72);
    if (confidence < threshold) return [];
    return [{ x: 0.24, y: 0.23, w: 0.48, h: 0.42, className: 'Violence/Fight', confidence }];
  }

  async function runFrame(timestamp) {
    if (!running) return;
    loopHandle = window.requestAnimationFrame(runFrame);
    if (timestamp - lastFrameAt < frameIntervalMs) return;
    lastFrameAt = timestamp;

    const source = getSourceLabel();
    const threshold = getThreshold();
    let detections = [];
    let mode = 'ONNX';

    try {
      detections = usingFallback ? analyzeWithFallback(threshold) : await analyzeWithOnnx(threshold);
    } catch (error) {
      usingFallback = true;
      mode = 'demo mode';
      detections = analyzeWithFallback(threshold);
      if (result) {
        result.innerHTML = `<strong>Model unavailable; demo mode running</strong><br><span>${C.escapeHtml(error.message || 'Could not load ONNX model.')}</span>`;
      }
    }

    if (usingFallback) mode = 'demo mode';
    const top = detections[0];
    const detected = Boolean(top);
    const confidence = top ? Math.round(top.confidence) : Math.floor(5 + Math.random() * Math.max(1, threshold - 4));
    drawDetections(detections);
    setResult(detected, confidence, threshold, source, mode);
    setStatus(detected ? 'Risk Found' : 'Scanning', detected);

    const shouldLog = detected && (Date.now() - lastEventAt > 5000);
    if (shouldLog) {
      lastEventAt = Date.now();
      const event = C.saveVideoAnalysisEvent({
        time: new Date().toISOString(),
        source,
        className: 'Violence/Fight',
        confidence,
        threshold,
        action: usingFallback ? 'Demo detection only; verify before escalation' : 'Ready to flag for Admin Review',
        model: usingFallback ? 'Fallback demo' : modelUrl
      });
      renderHistory();
      if (!usingFallback) await C.sendVideoRiskToAdmin(event);
    }
  }

  async function requestCameraStream(facingMode) {
    const cameraBase = {
      width: { ideal: 1280 },
      height: { ideal: 720 }
    };

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { ...cameraBase, facingMode: { exact: facingMode } },
        audio: false
      });
    } catch (exactError) {
      return navigator.mediaDevices.getUserMedia({
        video: { ...cameraBase, facingMode: { ideal: facingMode } },
        audio: false
      });
    }
  }

  async function startVideoSource() {
    if (!video) return;
    const sourceMode = getSourceMode();
    if (sourceMode === 'uploaded-rider-clip') {
      if (poster) poster.hidden = false;
      video.hidden = true;
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Camera access is not supported by this browser.');
    }

    const facingMode = getCameraFacingMode();
    stream = await requestCameraStream(facingMode);
    video.srcObject = stream;
    video.hidden = false;
    if (poster) poster.hidden = true;
    await video.play();
  }

  function stopVideoSource() {
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    if (video) {
      video.pause();
      video.srcObject = null;
      video.hidden = true;
    }
    if (poster) poster.hidden = false;
  }

  async function startAnalysis() {
    if (running) return;
    running = true;
    usingFallback = false;
    lastFrameAt = 0;
    clearOverlay();
    setStatus('Starting');
    if (toggleButton) toggleButton.textContent = 'Stop Analysis';

    try {
      await startVideoSource();
      await loadSession();
      setStatus('Scanning');
      C.showToast('Video analysis started', getSourceLabel());
    } catch (error) {
      usingFallback = true;
      setStatus('Demo Mode');
      if (result) {
        result.innerHTML = `<strong>Model or camera unavailable; demo mode running</strong><br><span>${C.escapeHtml(error.message || 'Check camera permission and model files.')}</span>`;
      }
      C.showToast('Video analysis demo mode', 'Add ONNX weights and allow camera access for live detection.');
    }

    sizeOverlay();
    loopHandle = window.requestAnimationFrame(runFrame);
  }

  function stopAnalysis() {
    running = false;
    if (loopHandle) window.cancelAnimationFrame(loopHandle);
    loopHandle = null;
    stopVideoSource();
    clearOverlay();
    setStatus('Stopped');
    if (toggleButton) toggleButton.textContent = 'Start Analysis';
    if (result) result.textContent = 'Video analysis stopped.';
    C.showToast('Video analysis stopped', 'Live scan paused.');
  }

  sourceSelect?.addEventListener('change', async () => {
    if (!running) {
      clearOverlay();
      if (result) result.textContent = `Selected source: ${getSourceLabel()}.`;
      return;
    }

    clearOverlay();
    stopVideoSource();
    lastFrameAt = 0;
    setStatus('Switching');

    try {
      await startVideoSource();
      usingFallback = false;
      setStatus('Scanning');
      C.showToast('Camera source switched', getSourceLabel());
    } catch (error) {
      usingFallback = true;
      setStatus('Demo Mode');
      if (result) {
        result.innerHTML = `<strong>Could not switch camera; demo mode running</strong><br><span>${C.escapeHtml(error.message || 'Check camera permission and device cameras.')}</span>`;
      }
    }
  });

  toggleButton?.addEventListener('click', () => {
    if (running) stopAnalysis();
    else startAnalysis();
  });

  window.addEventListener('resize', sizeOverlay);
  sizeOverlay();
  renderHistory();
});
