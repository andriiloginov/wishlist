/**
 * Вішліст на новосілля: бекенд на Google Apps Script.
 * Таблиця (перший аркуш), рядок 1 — заголовки:
 * A Назва | B Посилання | C Ціна | D Нотатка | E Хто дарує | F Токен (не чіпати) | G ID (не чіпати)
 */

const COLS = 7;

function doGet() {
  return withLock_(() => json_({ items: list_() }));
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

function list_() {
  const { sh, data } = rows_();
  return data
    .map((r, i) => {
      if (!r[0].trim()) return null;
      if (!r[6]) {                                   // новий рядок — даємо йому ID
        r[6] = Utilities.getUuid().slice(0, 8);
        sh.getRange(i + 2, 7).setValue(r[6]);
      }
      return { id: r[6], title: r[0], link: r[1], price: r[2], note: r[3], reserved_by: r[4] || null };
    })
    .filter(Boolean);
}

function reserve_(id, name) {
  name = name.trim().slice(0, 60);
  if (!name) return { error: 'no_name' };
  const { sh, data } = rows_();
  const i = data.findIndex((r) => r[6] === id);
  if (i < 0) return { error: 'not_found' };
  if (data[i][4]) return { ok: false };             // вже хтось зарезервував
  const token = Utilities.getUuid();
  // "'" на початку не дає імені стати формулою
  sh.getRange(i + 2, 5, 1, 2).setValues([["'" + name, token]]);
  return { ok: true, token };
}

function cancel_(id, token) {
  const { sh, data } = rows_();
  const i = data.findIndex((r) => r[6] === id);
  if (i < 0 || !token || data[i][5] !== token) return { ok: false };
  sh.getRange(i + 2, 5, 1, 2).clearContent();
  return { ok: true };
}

function rows_() {
  const sh = SpreadsheetApp.getActive().getSheets()[0];
  const n = sh.getLastRow() - 1;
  const data = n > 0 ? sh.getRange(2, 1, n, COLS).getDisplayValues() : [];
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
