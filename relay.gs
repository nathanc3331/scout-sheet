// Scout Sheet relay: fetches rslashfakebaseball.com API data for the Scout Sheet web page.
// Only forwards requests to the league API, nothing else.
// Usage: <web app URL>?path=/players/name/SomeName

const API = 'https://www.rslashfakebaseball.com/api';

function doGet(e) {
  const path = (e && e.parameter && e.parameter.path) || '';
  if (!/^\/(players|plateappearances)(\/[A-Za-z0-9%._~ -]*)*$/.test(path)) {
    return json_({ error: 'bad path' });
  }
  const cache = CacheService.getScriptCache();
  const hit = cache.get(path);
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON);

  const res = UrlFetchApp.fetch(API + path, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    return json_({ error: 'site answered ' + res.getResponseCode() });
  }
  const body = res.getContentText();
  // Cache for 5 minutes when small enough (cache values max out at 100 KB).
  if (body.length < 100000) cache.put(path, body, 300);
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
