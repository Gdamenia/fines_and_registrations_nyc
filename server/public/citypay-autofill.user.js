// ==UserScript==
// @name         CityPay Violation Number Autofill
// @namespace    plate-lookup
// @version      1.0
// @description  Auto-fills the violation number field on NYC CityPay when arriving via a #summons=... link from the Plate & VIN Lookup app. You still click Search yourself.
// @match        https://a836-citypay.nyc.gov/citypay/Parking*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // The summons number travels in the URL *hash* (#summons=1234567890), not a query
  // param or POST body — the hash never leaves the browser / never gets sent to
  // CityPay's server, so this is purely a same-browser handoff, nothing more.
  const match = location.hash.match(/summons=(\d{10})/);
  if (!match) return;
  const summons = match[1];

  function fillField() {
    const input = document.getElementById('violation-number');
    if (!input) return false;

    // Native setter is needed so the site's own validation/JS framework (which reads
    // via the input's value property) actually notices the change, not just what's
    // visually shown.
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, summons);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.focus();
    return true;
  }

  // The violation-number tab isn't always the active tab on load, and the form can be
  // rendered a beat after document-idle, so retry briefly instead of assuming it's ready.
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (fillField() || attempts > 20) clearInterval(timer);
  }, 150);
})();
