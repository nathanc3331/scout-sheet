// Scout Sheet relay: fetches rslashfakebaseball.com API data for the Scout Sheet web page.
// Only forwards requests to the league API, nothing else.
// Usage: <web app URL>?path=/players/name/SomeName
//
// Every answer is JSON, even on failure. If the script throws, Google sends an HTML
// error page the browser can't read, and the page only sees "Failed to fetch".

const API = 'https://www.rslashfakebaseball.com/api';

function doGet(e) {
  try {
    const path = (e && e.parameter && e.parameter.path) || '';
    if (!/^\/(players|plateappearances)(\/[A-Za-z0-9%._~ '-]*)*$/.test(path)) {
      return json_({ error: 'bad path ' + path });
    }
    const cache = CacheService.getScriptCache();
    const key = Utilities.base64EncodeWebSafe(path).slice(0, 240);
    try {
      const hit = cache.get(key);
      if (hit) return text_(hit);
    } catch (err) { /* cache is best-effort */ }

    let res = null, lastErr = null;
    for (let attempt = 0; attempt < 2 && !res; attempt++) {
      try { res = UrlFetchApp.fetch(API + path, { muteHttpExceptions: true, followRedirects: true }); }
      catch (err) { lastErr = err; Utilities.sleep(500); }
    }
    if (!res) return json_({ error: 'could not reach the league site: ' + lastErr });
    if (res.getResponseCode() !== 200) {
      return json_({ error: 'site answered ' + res.getResponseCode() });
    }
    const body = res.getContentText();
    // Cache values max out at 100 KB; leave room for multi-byte characters.
    if (body.length < 30000) {
      try { cache.put(key, body, 300); } catch (err) { /* too big or quota: skip */ }
    }
    return text_(body);
  } catch (err) {
    return json_({ error: 'relay error: ' + err });
  }
}

function text_(s) {
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}

function json_(obj) {
  return text_(JSON.stringify(obj));
}
