import fs from 'node:fs';
import process from 'node:process';
import express from 'express';
import { google } from 'googleapis';

const app = express();
const port = Number(process.env.PORT || 3000);
const sheetName = process.env.GOOGLE_SHEET_NAME || 'Результаты';
const resultHeaders = [
  'Дата и время', 'ID прохождения', 'ID контакта', 'ФИО', 'Телефон', 'Направление', 'Баллы', 'Результат',
  'Ответов А', 'Ответов Б', 'Ответов В',
  ...Array.from({ length: 10 }, (_, index) => `Вопрос ${index + 1}`),
];
const leadHeaders = ['Дата и время', 'ID контакта', 'ФИО', 'Телефон', 'Направление', 'Статус'];

app.use(express.json({ limit: '64kb' }));

let sheetsClient;
const setupPromises = new Map();

function getCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64) {
    return JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64, 'base64').toString('utf8'));
  }
  const candidates = ['/app/credentials.json', new URL('../credentials.json', import.meta.url)];
  for (const candidate of candidates) {
    try { return JSON.parse(fs.readFileSync(candidate, 'utf8')); } catch { /* try the next source */ }
  }
  throw new Error('Google service account credentials are not configured');
}

function getSheetsClient() {
  if (!sheetsClient) {
    const auth = new google.auth.GoogleAuth({ credentials: getCredentials(), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

function sheetRange(tabName, range) {
  return `'${tabName.replaceAll("'", "''")}'!${range}`;
}

async function ensureSheetReady(tabName, tabHeaders) {
  if (setupPromises.has(tabName)) return setupPromises.get(tabName);
  const setupPromise = (async () => {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID || process.env.SHEETS_ID;
    if (!spreadsheetId) throw new Error('GOOGLE_SHEET_ID is not configured');
    const sheets = getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
    const hasTab = spreadsheet.data.sheets?.some((item) => item.properties?.title === tabName);
    if (!hasTab) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] } });
    const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range: sheetRange(tabName, `A1:${tabHeaders.length === 6 ? 'F' : 'U'}1`) });
    if (!existing.data.values?.length) {
      await sheets.spreadsheets.values.update({ spreadsheetId, range: sheetRange(tabName, `A1:${tabHeaders.length === 6 ? 'F' : 'U'}1`), valueInputOption: 'RAW', requestBody: { values: [tabHeaders] } });
    }
    return { sheets, spreadsheetId };
  })();
  setupPromises.set(tabName, setupPromise);
  try { return await setupPromise; } catch (error) { setupPromises.delete(tabName); throw error; }
}

function cleanCell(value) {
  const text = String(value ?? '').trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') return 'Некорректные данные';
  if (!payload.sessionId || !payload.segmentId || !payload.segmentLabel || !payload.resultLabel) return 'Не хватает данных прохождения';
  if (!Array.isArray(payload.answers) || payload.answers.length !== 10) return 'Нужно сохранить все 10 ответов';
  if (!payload.answers.every((answer, index) => answer?.question === index + 1 && ['А', 'Б', 'В'].includes(answer.letter))) return 'Некорректные ответы';
  if (!Number.isFinite(payload.score) || payload.score < 10 || payload.score > 30) return 'Некорректный результат';
  return null;
}

function validateLead(payload) {
  if (!payload || typeof payload !== 'object') return 'Некорректные данные';
  if (!payload.leadId || !payload.fullName || !payload.phone || !payload.segmentLabel) return 'Не хватает контактных данных';
  if (String(payload.fullName).trim().length < 5 || String(payload.phone).replace(/\D/g, '').length < 10) return 'Проверьте ФИО и телефон';
  return null;
}

app.get('/api/health', (_request, response) => response.json({ ok: true, sheetsConfigured: Boolean(process.env.GOOGLE_SHEET_ID || process.env.SHEETS_ID) }));

app.post('/api/quiz-leads', async (request, response) => {
  const validationError = validateLead(request.body);
  if (validationError) return response.status(400).json({ ok: false, error: validationError });
  try {
    const { sheets, spreadsheetId } = await ensureSheetReady('Лиды', leadHeaders);
    const row = [new Date().toISOString(), cleanCell(request.body.leadId), cleanCell(request.body.fullName), cleanCell(request.body.phone), cleanCell(request.body.segmentLabel), 'Начат'];
    await sheets.spreadsheets.values.append({ spreadsheetId, range: sheetRange('Лиды', 'A:F'), valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', requestBody: { values: [row] } });
    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error('Google Sheets lead append failed:', error.message);
    return response.status(503).json({ ok: false, error: 'Не удалось сохранить данные' });
  }
});

app.post('/api/quiz-results', async (request, response) => {
  const validationError = validatePayload(request.body);
  if (validationError) return response.status(400).json({ ok: false, error: validationError });
  try {
    const { sheets, spreadsheetId } = await ensureSheetReady(sheetName, resultHeaders);
    const answers = request.body.answers;
    const counts = answers.reduce((result, answer) => { result[answer.letter] += 1; return result; }, { А: 0, Б: 0, В: 0 });
    const row = [
      new Date().toISOString(), cleanCell(request.body.sessionId), cleanCell(request.body.leadId), cleanCell(request.body.fullName), cleanCell(request.body.phone), cleanCell(request.body.segmentLabel), request.body.score,
      cleanCell(request.body.resultLabel), counts.А, counts.Б, counts.В,
      ...answers.map((answer) => cleanCell(`${answer.letter}. ${answer.text || ''}`)),
    ];
    await sheets.spreadsheets.values.append({ spreadsheetId, range: sheetRange(sheetName, 'A:U'), valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', requestBody: { values: [row] } });
    return response.status(201).json({ ok: true });
  } catch (error) {
    console.error('Google Sheets append failed:', error.message);
    return response.status(503).json({ ok: false, error: 'Не удалось сохранить результат' });
  }
});

app.listen(port, () => console.log(`NIKA DENT results API listening on ${port}`));
