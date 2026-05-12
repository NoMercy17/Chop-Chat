function relativeTime(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function initials(name) {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (name || '').substring(0, 2).toUpperCase();
}

// e.g. https://res.cloudinary.com/demo/image/upload/v1234/posts/abc.jpg → "posts/abc"
function getPublicIdFromUrl(url) {
  if (!url) return null;
  const parts = url.split('/upload/');
  if (parts.length < 2) return null;
  return parts[1]
    .replace(/^v\d+\//, '')
    .replace(/\.[^/.]+$/, '');
}

module.exports = { relativeTime, initials, getPublicIdFromUrl };
