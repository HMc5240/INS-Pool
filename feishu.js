const APP_ID = 'cli_a954becedd3d9cd5';
const APP_SECRET = 'Bh8ZHCl7lvdw4TtgMSda7bktmIMB7BjV';
const APP_TOKEN = 'KhMUbsh8YaYdF8sNxaucaGK1nvd';
const TABLE_ID = 'tblfWVt2HMmjVsgS';
const BASE = 'https://open.feishu.cn/open-apis';

async function getToken() {
  const res = await fetch(`${BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
  });
  const data = await res.json();
  return data.tenant_access_token;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = await getToken();
    const { action, recordId } = req.query;
    const tableUrl = `${BASE}/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    if (action === 'list') {
      let all = [], pageToken = null;
      do {
        const url = tableUrl + '?page_size=100' + (pageToken ? `&page_token=${pageToken}` : '');
        const r = await fetch(url, { headers });
        const d = await r.json();
        if (d.data && d.data.items) all = all.concat(d.data.items);
        pageToken = d.data && d.data.has_more ? d.data.page_token : null;
      } while (pageToken);
      return res.status(200).json({ records: all });
    }

    if (action === 'create') {
      const r = await fetch(tableUrl, { method: 'POST', headers, body: JSON.stringify({ fields: req.body.fields }) });
      return res.status(200).json(await r.json());
    }

    if (action === 'update') {
      const r = await fetch(`${tableUrl}/${recordId}`, { method: 'PUT', headers, body: JSON.stringify({ fields: req.body.fields }) });
      return res.status(200).json(await r.json());
    }

    if (action === 'delete') {
      const r = await fetch(`${tableUrl}/${recordId}`, { method: 'DELETE', headers });
      return res.status(200).json(await r.json());
    }

    return res.status(400).json({ error: 'unknown action' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
