/**
 * Вішліст на день народження: бекенд на Google Apps Script.
 * Подарунки захардкоджені в index.html, тут зберігаються лише резерви.
 * Таблиця (перший аркуш), рядок 1 — заголовки (будь-які), далі:
 * A ID подарунка | B Хто дарує | C Токен (не чіпати)
 */

function doGet() {
  return withLock_(() => {
    const reserved = {};
    for (const r of rows_().data) if (r[0]) reserved[r[0]] = r[1];
    return json_({ reserved });
  });
}

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (_) { return json_({ error: 'bad_request' }); }
  return withLock_(() => {
    if (req.action === 'reserve') return json_(reserve_(String(req.id || ''), String(req.name || '')));
    if (req.action === 'cancel') return json_(cancel_(String(req.id || ''), String(req.token || '')));
    return json_({ error: 'unknown_action' });
  });
}

function reserve_(id, name) {
  name = name.trim().slice(0, 60);
  if (!name) return { error: 'no_name' };
  if (!/^[a-z0-9-]{1,40}$/.test(id)) return { error: 'not_found' };
  const { sh, data } = rows_();
  if (data.some((r) => r[0] === id)) return { ok: false };   // вже хтось зарезервував
  const token = Utilities.getUuid();
  // "'" на початку не дає імені стати формулою
  sh.appendRow([id, "'" + name, token]);
  return { ok: true, token };
}

function cancel_(id, token) {
  const { sh, data } = rows_();
  const i = data.findIndex((r) => r[0] === id);
  if (i < 0 || !token || data[i][2] !== token) return { ok: false };
  sh.deleteRow(i + 2);
  return { ok: true };
}

function rows_() {
  const sh = SpreadsheetApp.getActive().getSheets()[0];
  const n = sh.getLastRow() - 1;
  const data = n > 0 ? sh.getRange(2, 1, n, 3).getDisplayValues() : [];
  return { sh, data };
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
