type Level = 'info' | 'warn' | 'error' | 'debug';

const DEBUG_FLAG = 'debug:banners';

function enabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_FLAG) === '1' || import.meta.env.MODE !== 'production';
  } catch {
    return true; // default to enabled outside production
  }
}

export function logBanner(level: Level, message: string, data?: any) {
  if (!enabled()) return;
  const prefix = `[banners]`;
  const payload = data !== undefined ? data : '';
  switch (level) {
    case 'info':
      console.info(prefix, message, payload);
      break;
    case 'warn':
      console.warn(prefix, message, payload);
      break;
    case 'error':
      console.error(prefix, message, payload);
      break;
    default:
      console.debug(prefix, message, payload);
  }
}

export function enableBannerDebug() {
  try {
    localStorage.setItem(DEBUG_FLAG, '1');
  } catch {}
}

export function disableBannerDebug() {
  try {
    localStorage.removeItem(DEBUG_FLAG);
  } catch {}
}