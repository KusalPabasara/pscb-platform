'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedNavigation, isBlockedAccelerator, parseLaunchArgument, requestedSession } = require('../policy.cjs');

const config = { defaultUrl: 'https://platform.example/secure-viewer', allowedOrigins: ['https://platform.example', 'http://127.0.0.1:4173'] };

test('accepts only configured HTTPS and local origins', () => {
  assert.equal(isAllowedNavigation('https://platform.example/private', config), true);
  assert.equal(isAllowedNavigation('https://attacker.example/private', config), false);
  assert.equal(isAllowedNavigation('http://platform.example/private', config), false);
  assert.equal(isAllowedNavigation('javascript:alert(1)', config), false);
});

test('parses a protected protocol launch', () => {
  const value = parseLaunchArgument('pscb-secure://open?url=https%3A%2F%2Fplatform.example%2Fprivate&session=short-token');
  assert.deepEqual(value, { url: 'https://platform.example/private', session: 'short-token' });
});

test('rejects protocol targets outside policy', () => {
  assert.throws(() => requestedSession(['pscb-secure://open?url=https%3A%2F%2Fattacker.example'], config), /allowedOrigins/);
});

test('blocks capture, clipboard, source, save, print and developer shortcuts', () => {
  for (const key of ['p', 's', 'u', 'c', 'x']) assert.equal(isBlockedAccelerator({ key, control: true }), true);
  assert.equal(isBlockedAccelerator({ key: 'F12' }), true);
  assert.equal(isBlockedAccelerator({ key: 'i', control: true, shift: true }), true);
  assert.equal(isBlockedAccelerator({ key: 'r', control: true }), false);
});
