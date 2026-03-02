require('dotenv').config({ path: '.env' });
const { Client } = require('@notionhq/client');

function firstPlainText(prop) {
  if (!prop || typeof prop !== 'object') return null;
  if (prop.type === 'rich_text' && Array.isArray(prop.rich_text) && prop.rich_text[0]?.plain_text) {
    return prop.rich_text[0].plain_text;
  }
  if (prop.type === 'title' && Array.isArray(prop.title) && prop.title[0]?.plain_text) {
    return prop.title[0].plain_text;
  }
  return null;
}

(async () => {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  let cursor;
  let total = 0;
  let hit = null;

  while (true) {
    const res = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 100,
      start_cursor: cursor,
    });

    total += res.results.length;

    for (const row of res.results) {
      if (!('properties' in row)) continue;
      const props = row.properties;
      const vals = [];
      for (const key of Object.keys(props)) {
        const t = firstPlainText(props[key]);
        if (t) vals.push([key, t]);
      }
      if (vals.some(([, v]) => String(v).toLowerCase().includes('sunscreen'))) {
        hit = {
          keys: Object.keys(props),
          values: vals,
        };
        break;
      }
    }

    if (hit || !res.has_more) break;
    cursor = res.next_cursor;
  }

  console.log('totalScanned', total);
  if (!hit) {
    console.log('no sunscreen-like row found');
    return;
  }

  console.log('keys', hit.keys);
  console.log('values', hit.values.slice(0, 20));
})();
