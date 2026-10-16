// Client-side walkaround-video capture: extract a handful of evenly spaced
// frames instead of running inference on every decoded frame. Adjacent video
// frames are near-duplicates, so literal frame-by-frame analysis wastes time
// and risks the vision model double-counting the same damage; sampling a
// bounded number of frames across the clip covers the full exterior while
// reusing the exact photo pipeline already validated server-side (domain.mjs
// still enforces 1–6 photos, 2 MiB each). The raw video is never uploaded.

export const MAX_FRAMES = 6;
export const MAX_DURATION_SECONDS = 60;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const isVideoFile = file =>
  file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);

// Pure: timestamps to sample across a clip, skipping a small margin at each
// end to avoid blank/motion-blurred start and stop frames.
export function sampleTimestamps(duration, count = MAX_FRAMES) {
  if (!Number.isFinite(duration) || duration <= 0) return [];
  const n = Math.max(1, Math.min(Math.round(count), MAX_FRAMES));
  if (n === 1) return [duration / 2];
  const margin = Math.min(duration * 0.1, 0.5, duration / 3);
  const span = Math.max(0, duration - margin * 2);
  return Array.from({ length: n }, (_, i) => margin + (span * i) / (n - 1));
}

function waitForEvent(target, event, readyLevel, timeoutMs = 20000) {
  if (target.readyState >= readyLevel) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('เปิดวิดีโอไม่สำเร็จ (หมดเวลา) กรุณาลองใหม่')); }, timeoutMs);
    const onEvent = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('เปิดวิดีโอไม่ได้ กรุณาใช้ไฟล์ MP4 หรือ WebM')); };
    function cleanup() { clearTimeout(timer); target.removeEventListener(event, onEvent); target.removeEventListener('error', onError); }
    target.addEventListener(event, onEvent, { once: true });
    target.addEventListener('error', onError, { once: true });
  });
}

function seekTo(video, time) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('อ่านเฟรมวิดีโอไม่สำเร็จ กรุณาลองใหม่')); }, 10000);
    const onSeeked = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error('อ่านเฟรมวิดีโอไม่สำเร็จ กรุณาลองใหม่')); };
    function cleanup() { clearTimeout(timer); video.removeEventListener('seeked', onSeeked); video.removeEventListener('error', onError); }
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.currentTime = time;
  });
}

async function frameBlob(canvas) {
  for (const quality of [0.85, 0.6]) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    if (blob && blob.size <= 2 * 1024 * 1024) return blob;
  }
  throw new Error('แยกภาพจากวิดีโอไม่สำเร็จ กรุณาใช้วิดีโอความละเอียดต่ำกว่านี้');
}

// Extract up to MAX_FRAMES evenly spaced frames as File objects, ready to
// pass through the same code path as manually selected photos.
export async function extractFrames(file, { count = MAX_FRAMES, onProgress } = {}) {
  if (file.size > MAX_VIDEO_BYTES) throw new Error('วิดีโอมีขนาดใหญ่เกินไป กรุณาใช้ไฟล์ไม่เกิน 100 MB');
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none';
  document.body.append(video);
  video.src = url;
  try {
    await waitForEvent(video, 'loadedmetadata', 1);
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('อ่านความยาววิดีโอไม่ได้ กรุณาใช้ไฟล์วิดีโออื่น');
    if (duration > MAX_DURATION_SECONDS) throw new Error(`วิดีโอยาวเกินไป กรุณาใช้คลิปไม่เกิน ${MAX_DURATION_SECONDS} วินาที`);
    await waitForEvent(video, 'loadeddata', 2);
    if (!video.videoWidth || !video.videoHeight) throw new Error('อ่านภาพจากวิดีโอไม่ได้ กรุณาใช้ไฟล์วิดีโออื่น');

    const limit = 1280;
    const scale = Math.min(1, limit / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const ctx = canvas.getContext('2d');

    const timestamps = sampleTimestamps(duration, count);
    const frames = [];
    for (let i = 0; i < timestamps.length; i++) {
      await seekTo(video, timestamps[i]);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await frameBlob(canvas);
      frames.push(new File([blob], `walkaround-${i + 1}.jpg`, { type: 'image/jpeg' }));
      onProgress?.(i + 1, timestamps.length);
    }
    return frames;
  } finally {
    video.remove();
    URL.revokeObjectURL(url);
  }
}
