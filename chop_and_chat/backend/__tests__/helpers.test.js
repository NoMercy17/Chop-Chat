const { relativeTime, initials, getPublicIdFromUrl } = require('../utils/helpers');

// ─── relativeTime ────────────────────────────────────────────────────────────

describe('relativeTime', () => {
  const secsAgo = (s) => new Date(Date.now() - s * 1000);

  test('returns "just now" for timestamps under 60 seconds ago', () => {
    expect(relativeTime(secsAgo(30))).toBe('just now');
  });

  test('returns "just now" for a timestamp 1 second ago', () => {
    expect(relativeTime(secsAgo(1))).toBe('just now');
  });

  test('returns minutes for timestamps between 1 and 59 minutes ago', () => {
    expect(relativeTime(secsAgo(90))).toBe('1m ago');
    expect(relativeTime(secsAgo(30 * 60))).toBe('30m ago');
    expect(relativeTime(secsAgo(59 * 60))).toBe('59m ago');
  });

  test('returns hours for timestamps between 1 and 23 hours ago', () => {
    expect(relativeTime(secsAgo(3600))).toBe('1h ago');
    expect(relativeTime(secsAgo(12 * 3600))).toBe('12h ago');
    expect(relativeTime(secsAgo(23 * 3600))).toBe('23h ago');
  });

  test('returns days for timestamps 24+ hours ago', () => {
    expect(relativeTime(secsAgo(24 * 3600))).toBe('1d ago');
    expect(relativeTime(secsAgo(3 * 24 * 3600))).toBe('3d ago');
  });

  test('accepts ISO string dates', () => {
    const isoDate = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(relativeTime(isoDate)).toBe('2h ago');
  });
});

// ─── initials ────────────────────────────────────────────────────────────────

describe('initials', () => {
  test('returns first and last initial for a full name', () => {
    expect(initials('John Doe')).toBe('JD');
  });

  test('uses first and last word when more than two words are given', () => {
    expect(initials('Alice Bob Smith')).toBe('AS');
  });

  test('returns first two characters for a single-word name', () => {
    expect(initials('Madonna')).toBe('MA');
  });

  test('returns empty string for an empty string', () => {
    expect(initials('')).toBe('');
  });

  test('returns empty string for null', () => {
    expect(initials(null)).toBe('');
  });

  test('returns uppercase initials', () => {
    expect(initials('alice doe')).toBe('AD');
  });
});

// ─── getPublicIdFromUrl ───────────────────────────────────────────────────────

describe('getPublicIdFromUrl', () => {
  test('extracts public ID from a versioned Cloudinary URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1234567/posts/abc.jpg';
    expect(getPublicIdFromUrl(url)).toBe('posts/abc');
  });

  test('extracts public ID from a Cloudinary URL without version', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/profile_photos/user42.png';
    expect(getPublicIdFromUrl(url)).toBe('profile_photos/user42');
  });

  test('strips the file extension from the public ID', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/folder/image.webp';
    expect(getPublicIdFromUrl(url)).toBe('folder/image');
  });

  test('returns null when the URL has no /upload/ segment', () => {
    expect(getPublicIdFromUrl('https://example.com/image.jpg')).toBeNull();
  });

  test('returns null for a null input', () => {
    expect(getPublicIdFromUrl(null)).toBeNull();
  });

  test('returns null for an empty string', () => {
    expect(getPublicIdFromUrl('')).toBeNull();
  });
});

// ─── Performance ─────────────────────────────────────────────────────────────

describe('Performance — 10,000 calls each', () => {
  test('relativeTime completes 10,000 calls within 500ms', () => {
    const date = new Date(Date.now() - 3600 * 1000);
    const start = Date.now();
    for (let i = 0; i < 10000; i++) relativeTime(date);
    const elapsed = Date.now() - start;
    console.log(`  relativeTime x10,000: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(500);
  });

  test('initials completes 10,000 calls within 500ms', () => {
    const start = Date.now();
    for (let i = 0; i < 10000; i++) initials('John Doe');
    const elapsed = Date.now() - start;
    console.log(`  initials x10,000: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(500);
  });

  test('getPublicIdFromUrl completes 10,000 calls within 500ms', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1234/posts/abc.jpg';
    const start = Date.now();
    for (let i = 0; i < 10000; i++) getPublicIdFromUrl(url);
    const elapsed = Date.now() - start;
    console.log(`  getPublicIdFromUrl x10,000: ${elapsed}ms`);
    expect(elapsed).toBeLessThan(500);
  });
});
