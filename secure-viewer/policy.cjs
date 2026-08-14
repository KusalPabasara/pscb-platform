'use strict';

function normalizeOrigin(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function allowedOriginSet(config) {
  return new Set((config.allowedOrigins || []).map(normalizeOrigin).filter(Boolean));
}

function validateTarget(value, config) {
  try {
    const url = new URL(value);
    return allowedOriginSet(config).has(url.origin) ? url.toString() : null;
  } catch {
    return null;
  }
}

function parseLaunchArgument(argument) {
  if (!argument?.startsWith('pscb-secure://')) return null;
  try {
    const launch = new URL(argument);
    if (launch.hostname !== 'open') return null;
    return { url: launch.searchParams.get('url'), session: launch.searchParams.get('session') };
  } catch {
    return null;
  }
}

function requestedSession(argv, config) {
  const protocol = argv.map(parseLaunchArgument).find(Boolean);
  const directUrl = argv.find((argument) => argument.startsWith('--url='))?.slice(6);
  const directSession = argv.find((argument) => argument.startsWith('--session='))?.slice(10);
  const target = validateTarget(protocol?.url || directUrl || config.defaultUrl, config);
  if (!target) throw new Error('The requested URL is not in viewer.config.json allowedOrigins.');
  return { url: target, session: protocol?.session || directSession || null };
}

function isAllowedNavigation(value, config) {
  return validateTarget(value, config) !== null;
}

function isBlockedAccelerator(input) {
  const key = String(input.key || '').toLowerCase();
  if (key === 'f12' || key === 'printscreen') return true;
  if (!(input.control || input.meta)) return false;
  if (['p', 's', 'u', 'c', 'x'].includes(key)) return true;
  return Boolean(input.shift && ['i', 'j', 'c'].includes(key));
}

module.exports = { allowedOriginSet, isAllowedNavigation, isBlockedAccelerator, normalizeOrigin, parseLaunchArgument, requestedSession, validateTarget };
