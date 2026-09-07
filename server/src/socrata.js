const fetch = require('node-fetch');

// NYC Open Parking and Camera Violations dataset (Socrata dataset id: nc67-uf89)
// Docs: https://data.cityofnewyork.us/City-Government/Open-Parking-and-Camera-Violations/nc67-uf89
//
// NOTE: an earlier version of this file pointed at "pxdn-gtu9". That id is NOT the base
// dataset — its own metadata reports `"assetType": "filter"`, meaning it's a saved/filtered
// view derived from this dataset, not the full table. It silently returned empty results for
// plates that do have real violations. nc67-uf89 is the actual dataset ("assetType": "dataset").
const BASE_URL = 'https://data.cityofnewyork.us/resource/nc67-uf89.json';

/**
 * Look up violations for a given plate + state using Socrata's SoQL query params.
 * plate/state are matched case-insensitively via upper(); Socrata stores plate in upper already
 * but we normalize just in case.
 *
 * @param {string} plate - e.g. "ABC1234"
 * @param {string} state - 2-letter state code, e.g. "NY"
 * @param {object} [opts]
 * @param {number} [opts.limit=50] - max records to return
 * @returns {Promise<object[]>}
 */
async function getViolationsByPlate(plate, state, opts = {}) {
  if (!plate || !state) {
    throw new Error('plate and state are both required');
  }
  const limit = opts.limit ?? 50;

  const where = `upper(plate)=upper('${plate.replace(/'/g, "''")}') AND upper(state)=upper('${state.replace(/'/g, "''")}')`;

  const url = new URL(BASE_URL);
  url.searchParams.set('$where', where);
  url.searchParams.set('$limit', String(limit));
  url.searchParams.set('$order', 'issue_date DESC');

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

module.exports = { getViolationsByPlate, BASE_URL };
