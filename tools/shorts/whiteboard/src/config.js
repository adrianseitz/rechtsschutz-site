// Länge kommt aus dem Timing der Episode (window.EP_TIMING, vom Renderer gesetzt); Hochformat 1080×1920 für TikTok/Reels/Shorts
const PROJECT = { duration: (window.EP_TIMING && window.EP_TIMING.total) || 10, bpm: 104, offset: 0, fps: 24, w: 1080, h: 1920 };
