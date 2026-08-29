import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const questions = [
  {
    eyebrow: 'База',
    question: 'Как часто стоматологи рекомендуют чистить зубы?',
    options: ['Один раз в день', 'Два раза в день', 'После каждого приёма пищи', 'Только вечером'],
    answer: 1,
    note: 'Оптимальный ритм — утром и вечером, примерно по две минуты. После еды лучше прополоскать рот водой.',
  },
  {
    eyebrow: 'Гигиена',
    question: 'Сколько времени должна занимать полноценная чистка зубов?',
    options: ['Около 30 секунд', 'Около 1 минуты', 'Около 2 минут', 'Не меньше 5 минут'],
    answer: 2,
    note: 'Две минуты помогают аккуратно пройти все поверхности зубов, линию дёсен и язык.',
  },
  {
    eyebrow: 'Профилактика',
    question: 'Зачем нужна зубная нить?',
    options: ['Чтобы отбелить эмаль', 'Чтобы освежить дыхание', 'Чтобы очистить промежутки между зубами', 'Чтобы заменить щётку'],
    answer: 2,
    note: 'Нить или межзубные ёршики удаляют налёт там, куда щетинки обычной щётки не достают.',
  },
  {
    eyebrow: 'Привычки',
    question: 'Что лучше сделать после сладкого напитка?',
    options: ['Сразу чистить зубы', 'Прополоскать рот водой', 'Съесть ещё сладкого', 'Ничего — напиток не влияет на эмаль'],
    answer: 1,
    note: 'Вода смывает часть кислот и сахаров. Чистить зубы сразу после кислых продуктов не стоит — подождите около 30 минут.',
  },
  {
    eyebrow: 'Эмаль',
    question: 'Какой минерал помогает зубной эмали быть устойчивее?',
    options: ['Фтор', 'Железо', 'Йод', 'Калий'],
    answer: 0,
    note: 'Фтор укрепляет эмаль и помогает ей противостоять кислотам. Его количество в пасте подбирают с учётом возраста и рекомендаций специалиста.',
  },
  {
    eyebrow: 'Осмотр',
    question: 'Как часто стоит приходить на профилактический осмотр?',
    options: ['Только если что-то болит', 'Раз в 3–5 лет', 'Обычно раз в полгода', 'Каждый месяц'],
    answer: 2,
    note: 'Для многих людей комфортный интервал — раз в полгода, но точную частоту лучше определить со своим стоматологом.',
  },
  {
    eyebrow: 'Щётка',
    question: 'Когда пора менять зубную щётку?',
    options: ['Раз в неделю', 'Примерно раз в 3 месяца', 'Раз в год', 'Когда щётка потеряется'],
    answer: 1,
    note: 'Меняйте щётку примерно раз в три месяца и раньше, если щетинки распушились после болезни.',
  },
  {
    eyebrow: 'Дёсны',
    question: 'Что может быть признаком, что дёснам нужно внимание?',
    options: ['Кровоточивость при чистке', 'Белые зубы', 'Свежесть дыхания', 'Ровный край зуба'],
    answer: 0,
    note: 'Регулярная кровоточивость — повод не прекращать чистку, а записаться на консультацию и разобраться с причиной.',
  },
];

function Logo() {
  return (
    <a className="logo" href="/" aria-label="NIKA DENT — на главную">
      <span className="logo-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span className="logo-type">NIKA <b>DENT</b></span>
    </a>
  );
}

function SparkIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8c.5 5.7 3.5 8.7 9.2 9.2-5.7.5-8.7 3.5-9.2 9.2-.5-5.7-3.5-8.7-9.2-9.2 5.7-.5 8.7-3.5 9.2-9.2Z" /></svg>;
}

function App() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);

  const current = questions[step];
  const progress = ((step + (selected !== null ? 1 : 0)) / questions.length) * 100;
  const score = useMemo(() => answers.reduce((sum, answer, index) => sum + (answer === questions[index].answer ? 1 : 0), 0), [answers]);

  useEffect(() => {
    document.title = finished ? `Результат ${score} из ${questions.length} — NIKA DENT` : `Вопрос ${step + 1} — NIKA DENT`;
  }, [finished, score, step]);

  const choose = (index) => {
    if (selected !== null) return;
    setSelected(index);
  };

  const next = () => {
    if (selected === null) return;
    const nextAnswers = [...answers, selected];
    setAnswers(nextAnswers);
    if (step === questions.length - 1) {
      setFinished(true);
      return;
    }
    setStep((value) => value + 1);
    setSelected(null);
  };

  const restart = () => {
    setStep(0);
    setSelected(null);
    setAnswers([]);
    setFinished(false);
  };

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    const resultTitle = percentage >= 75 ? 'Отличный результат' : percentage >= 50 ? 'Хорошая база' : 'Есть что освежить';
    return (
      <main className="page result-page">
        <header className="topbar"><Logo /><span className="topbar-note">Викторина о здоровье улыбки</span></header>
        <section className="result-shell" aria-live="polite">
          <div className="result-orbit orbit-one" /><div className="result-orbit orbit-two" />
          <div className="result-kicker"><SparkIcon /> ВИКТОРИНА ЗАВЕРШЕНА</div>
          <div className="result-score"><span>{score}</span><small>/{questions.length}</small></div>
          <h1>{resultTitle}</h1>
          <p className="result-copy">Вы ответили правильно на {percentage}% вопросов. Знания о профилактике — уже отличный шаг к здоровой улыбке.</p>
          <button className="primary-button result-button" onClick={restart}>Пройти ещё раз <span>↗</span></button>
          <div className="result-footnote">Результат — для себя, а не для оценки. При сомнениях всегда советуйтесь со стоматологом.</div>
        </section>
        <footer className="footer"><span>© NIKA DENT</span><span>Улыбка начинается с заботы</span></footer>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar"><Logo /><span className="topbar-note">Викторина о здоровье улыбки</span><span className="counter"><b>{String(step + 1).padStart(2, '0')}</b> / {String(questions.length).padStart(2, '0')}</span></header>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>

      <section className="quiz-layout">
        <aside className="intro-rail">
          <div className="rail-label">N / D 01</div>
          <div className="rail-vertical">ПРОВЕРЬТЕ СЕБЯ</div>
          <div className="rail-dot" />
        </aside>
        <div className="quiz-content">
          <div className="question-meta"><span className="meta-number">0{step + 1}</span><span className="eyebrow">{current.eyebrow}</span><span className="meta-line" /></div>
          <div className="question-heading"><h1>{current.question}</h1><p>Выберите один вариант ответа</p></div>
          <div className="options" role="radiogroup" aria-label="Варианты ответа">
            {current.options.map((option, index) => {
              const isSelected = selected === index;
              const isCorrect = selected !== null && index === current.answer;
              const isWrong = isSelected && selected !== current.answer;
              return <button key={option} className={`option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} onClick={() => choose(index)} role="radio" aria-checked={isSelected}>
                <span className="option-index">{String.fromCharCode(65 + index)}</span><span className="option-text">{option}</span><span className="option-state">{selected !== null && isCorrect ? '✓' : isSelected ? '×' : '↗'}</span>
              </button>;
            })}
          </div>
          <div className={`answer-note ${selected !== null ? 'visible' : ''}`} aria-live="polite"><span className="note-mark"><SparkIcon /></span><p>{selected !== null ? current.note : 'После ответа здесь появится короткое пояснение'}</p></div>
          <div className="quiz-actions"><span className="hint">{selected === null ? 'Выберите ответ, чтобы продолжить' : selected === current.answer ? 'Верно — так держать' : 'Почти. Запомните на будущее'}</span><button className="primary-button" disabled={selected === null} onClick={next}>{step === questions.length - 1 ? 'Узнать результат' : 'Следующий вопрос'} <span>↗</span></button></div>
        </div>
        <aside className="visual-rail" aria-hidden="true">
          <div className="tooth-illustration"><div className="tooth-shape"><div className="tooth-highlight" /></div><span className="illustration-caption">CARE<br />IS A<br />CHOICE</span></div>
          <div className="visual-index">0{step + 1}<span>/ 08</span></div>
        </aside>
      </section>
      <footer className="footer"><span>© NIKA DENT</span><span>Улыбка начинается с заботы</span><span>Листайте в своём ритме</span></footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
