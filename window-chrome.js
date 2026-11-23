'use strict';

/**
 * Windows caption colors. They match the shell header surface
 * (--bg-elev / --ink) for the themes the switcher actually stores.
 * beige is the retired warm theme; blue is the old name for cyan.
 */

const CAPTION_HEIGHT = 32;

const CAPTION = {
  dark: { color: '#14110e', symbolColor: '#f1e6d4' },
  bitrix: { color: '#FFFFFF', symbolColor: '#333333' },
  beige: { color: '#fbf8f3', symbolColor: '#2b2622' },
  cyan: { color: '#111827', symbolColor: '#e5e7eb' },
  blue: { color: '#111827', symbolColor: '#e5e7eb' },
};

function captionForTheme(theme) {
  const id = String(theme || '').trim();
  return CAPTION[id] || CAPTION.dark;
}

function captionOptions(theme) {
  return Object.assign({ height: CAPTION_HEIGHT }, captionForTheme(theme));
}

module.exports = {
  CAPTION_HEIGHT,
  CAPTION,
  captionForTheme,
  captionOptions,
};
