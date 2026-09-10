import fs from 'node:fs';
import { google } from 'googleapis';

const credentials = JSON.parse(fs.readFileSync(new URL('../credentials.json', import.meta.url), 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
const sheets = google.sheets({ version: 'v4', auth });
const title = 'NIKA DENT — результаты викторины';
const sheetName = 'Результаты';
const headers = [
  'Дата и время', 'ID прохождения', 'Направление', 'Баллы', 'Результат',
  'Ответов А', 'Ответов Б', 'Ответов В',
  ...Array.from({ length: 10 }, (_, index) => `Вопрос ${index + 1}`),
];

const created = await sheets.spreadsheets.create({ requestBody: { properties: { title }, sheets: [{ properties: { title: sheetName } }] } });
const spreadsheetId = created.data.spreadsheetId;
await sheets.spreadsheets.values.update({ spreadsheetId, range: `'${sheetName}'!A1:R1`, valueInputOption: 'RAW', requestBody: { values: [headers] } });
console.log(`GOOGLE_SHEET_ID=${spreadsheetId}`);
console.log(`URL=https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);
