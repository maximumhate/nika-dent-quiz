import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync(new URL('../Викторина.md', import.meta.url), 'utf8').replace(/\r/g, '');
const lines = source.split('\n');

const clean = (value) => value
  .replace(/\\([\\`*_{}\[\]()#+.!?<>-])/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

const slugify = (value) => clean(value)
  .toLowerCase()
  .replace(/ё/g, 'е')
  .replace(/[^а-яa-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const branchMeta = [
  ['стоматолог-терапевт', 'therapist', 'Стоматолог-терапевт', 'Терапия, реставрация и эндодонтия', 'majority'],
  ['стоматолог-хирург', 'surgeon', 'Стоматолог-хирург', 'Хирургия, имплантация и управление рисками', 'majority'],
  ['стоматолог-ортодонт', 'orthodontist', 'Стоматолог-ортодонт', 'Диагностика, биомеханика и цифровое планирование', 'majority'],
  ['детский стоматолог', 'pediatric', 'Детский стоматолог', 'Лечение ребёнка, профилактика и сохранение витальности', 'majority'],
  ['стоматолог-гигиенист', 'hygienist', 'Стоматолог-гигиенист', 'Биоплёнка, пародонт и индивидуальная профилактика', 'majority'],
  ['стоматолог-ортопед', 'prosthodontist', 'Стоматолог-ортопед', 'Препарирование, реставрации и цифровой workflow', 'majority'],
  ['ассистент стоматолога', 'assistant', 'Ассистент стоматолога', 'Четыре руки, стерилизация и безопасность', 'score'],
  ['руководитель стоматологической клиники', 'manager', 'Руководитель клиники', 'Команда, расписание, пациенты и развитие', 'majority'],
  ['студент-стоматолог', 'student', 'Студент-стоматолог', 'Современное мышление и готовность к практике', 'score'],
];

const branchStarts = [];
for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  const branchMatch = line.match(/^###\s+\*\*Ветка:\s*(.+?)\*\*$/i);
  const managerMatch = line.match(/^##\s+\*\*«Насколько Вы руководитель стоматологии будущего\?»\*\*$/i);
  const studentMatch = line.match(/^##\s+\*\*«Насколько Вы студент-стоматолог будущего\?»\*\*$/i);
  const branchName = branchMatch?.[1] || (managerMatch ? 'руководитель стоматологической клиники' : studentMatch ? 'студент-стоматолог' : null);
  if (!branchName) continue;
  const metadata = branchMeta.find(([name]) => name === clean(branchName));
  if (metadata) branchStarts.push({ index, metadata });
}

const questionPattern = /^(?:#|##|###)\s+\*\*(?:\d+\\?\.\s*)?ВОПРОС\s+(\d+)\s+ИЗ\s+10\*\*$/i;
const parseQuestion = (block, number) => {
  const controlsIndex = block.findIndex((line) => /Кнопки/i.test(line));
  const controls = controlsIndex >= 0 ? block.slice(controlsIndex + 1) : block;
  const optionLines = [];
  for (const line of controls) {
    if (/^\s*(?:###|##|#|---)/.test(line)) break;
    const match = line.match(/^\s*\*\*([АБВ])\.\s*(.+?)\*\*\s*$/);
    if (match) optionLines.push({ letter: match[1], text: clean(match[2]) });
  }

  const beforeControls = controlsIndex >= 0 ? block.slice(0, controlsIndex) : block;
  const titleLine = beforeControls.find((line) => /^##\s+\*\*(.+?)\*\*\s*$/.test(line));
  const title = titleLine ? clean(titleLine.match(/^##\s+\*\*(.+?)\*\*\s*$/)[1]) : `Вопрос ${number}`;
  const promptCandidates = beforeControls
    .map((line) => line.match(/^\s*\*\*(.+?)\*\*\s*$/)?.[1])
    .filter(Boolean)
    .map(clean)
    .filter((value) => value !== title && !/^Кнопки/i.test(value));
  const prompt = promptCandidates[0] || title;

  return {
    id: `q${number}`,
    number,
    title,
    prompt,
    options: optionLines.map((option, index) => ({ ...option, value: index + 1 })),
  };
};

const segments = branchStarts.map(({ index, metadata }, branchIndex) => {
  const end = branchStarts[branchIndex + 1]?.index ?? lines.length;
  const branchLines = lines.slice(index, end);
  const questions = [];
  for (let i = 0; i < branchLines.length; i += 1) {
    const match = branchLines[i].match(questionPattern);
    if (!match) continue;
    const number = Number(match[1]);
    const nextQuestion = branchLines.slice(i + 1).findIndex((line) => questionPattern.test(line));
    const block = branchLines.slice(i + 1, nextQuestion >= 0 ? i + 1 + nextQuestion : branchLines.length);
    const question = parseQuestion(block, number);
    if (question.options.length === 3) questions.push(question);
  }
  const [sourceName, id, label, description, scoring] = metadata;
  return { id, label, description, scoring, sourceName, questions };
});

const expectedIds = branchMeta.map(([, id]) => id);
for (const segment of segments) {
  if (segment.questions.length !== 10) throw new Error(`${segment.id}: expected 10 questions, found ${segment.questions.length}`);
}
if (segments.length !== expectedIds.length) throw new Error(`Expected ${expectedIds.length} segments, found ${segments.length}`);

const results = {
  majority: {
    A: { label: 'Классическая школа', icon: '📚', description: 'В вашей практике сильна опора на проверенные подходы. Следующая точка роста — выбирать решения по клинической ситуации, а не только по привычке.' },
    B: { label: 'На пути к стоматологии будущего', icon: '⚡', description: 'Современные подходы уже стали частью вашей практики. Следующий шаг — объединить отдельные инструменты в понятную систему.' },
    V: { label: 'Стоматолог будущего', icon: '🚀', description: 'Вы выбираете современные технологии осознанно: понимаете их показания, ограничения и пользу для конкретного пациента.' },
    tie: { label: 'От современной практики к стоматологии будущего', icon: '◈', description: 'В вашей практике встречаются разные подходы. Это хорошая точка для осознанного выбора метода под клиническую задачу.' },
  },
  score: {
    classic: { label: 'Классическая школа', icon: '📚', description: 'В вашем представлении о профессии пока преобладают традиционные подходы. Это закономерная отправная точка — современная стоматология развивается быстро.' },
    transition: { label: 'Новое поколение стоматологов', icon: '⚡', description: 'Вы уже хорошо ориентируетесь в направлении развития профессии. Следующий шаг — превращать знания о технологиях в клинические навыки.' },
    future: { label: 'Стоматолог будущего на старте', icon: '🚀', description: 'Вы смотрите шире университетской программы и понимаете: современность — это не самое новое оборудование, а обоснованный выбор метода.' },
  },
  manager: {
    A: { label: 'Классическая модель управления', icon: '🏥', description: 'Многие процессы пока зависят от ручного контроля. Следующая точка роста — понятные системные инструменты для команды, пациентов и расписания.' },
    B: { label: 'Современная клиника', icon: '⚡', description: 'Основные процессы уже выстроены. Следующий уровень — убрать ручную рутину там, где технологии действительно освобождают время команды.' },
    V: { label: 'Стоматология будущего', icon: '🚀', description: 'Сильные управленческие процессы дополнены цифровыми инструментами. Технология для вас имеет смысл только там, где улучшает сам процесс.' },
    tie: { label: 'Клиника в переходе', icon: '◈', description: 'В клинике уже есть современные практики, но они развиты неравномерно. Хорошая точка роста — собрать их в единую систему.' },
  },
};

const output = `// Generated from Викторина.md — do not edit by hand.\nexport const quizData = ${JSON.stringify({ segments, results }, null, 2)};\n`;
writeFileSync(new URL('../src/quizData.js', import.meta.url), output);
console.log(`Generated ${segments.length} segments × 10 questions`);
