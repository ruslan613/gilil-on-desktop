'use strict';

/** First check after the window is up. Not an install. */
const START_DELAY_MS = 4000;

/** Later checks while the app stays open. Four hours. */
const BACKGROUND_MS = 4 * 60 * 60 * 1000;

function shouldStartCheck(status) {
  return status !== 'checking' && status !== 'downloading';
}

/**
 * Production feed is the GitHub release channel baked into the NSIS build.
 * An override is accepted only for HTTPS, or HTTP on localhost for tests.
 * A pull-request artifact URL is not a feed.
 */
function feedUrlAllowed(url) {
  let parsed;
  try {
    parsed = new URL(String(url));
  } catch (_) {
    return false;
  }
  if (parsed.protocol === 'https:') return true;
  const local = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  return parsed.protocol === 'http:' && local;
}

module.exports = {
  START_DELAY_MS,
  BACKGROUND_MS,
  shouldStartCheck,
  feedUrlAllowed,
};
