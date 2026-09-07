const fetch = require('node-fetch');

// NY DMV "Vehicle, Snowmobile, and Boat Registrations" dataset (Socrata dataset id: w4pv-hbkt)
// Docs: https://dev.socrata.com/foundry/data.ny.gov/w4pv-hbkt
//
// NOTE: This dataset has NO plate field (by design, per the federal Driver's Privacy
// Protection Act — plate-to-registration linkage is restricted from public disclosure).
// It can only be queried by VIN.
const BASE_URL = 'https://data.ny.gov/resource/w4pv-hbkt.json';

/**
 * Look up NY DMV registration info for a given VIN.
 *
 * @param {string} vin - full VIN, e.g. "JTDZN3EU6D3199758"
 * @param {object} [opts]
 * @param {number} [opts.limit=10] - max records to return (a VIN is normally unique, but
 *   the dataset is a periodic snapshot and could contain historical duplicates)
 * @returns {Promise<object[]>}
 */
async function getRegistrationByVin(vin, opts = {}) {
  if (!vin) {
    throw new Error('vin is required');
  }
  const limit = opts.limit ?? 10;

  const url = new URL(BASE_URL);
  url.searchParams.set('$where', `upper(vin)=upper('${vin.replace(/'/g, "''")}')`);
  url.searchParams.set('$limit', String(limit));

  const headers = {};
  if (process.env.SOCRATA_APP_TOKEN) {
    headers['X-App-Token'] = process.env.SOCRATA_APP_TOKEN;
  }

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Socrata API error ${res.status}: ${body}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

module.exports = { getRegistrationByVin, BASE_URL };
