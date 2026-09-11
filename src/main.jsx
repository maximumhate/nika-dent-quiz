import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { quizData } from './quizData';
import './styles.css';

const letters = ['А', 'Б', 'В'];

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="NIKA DENT — в начало">
      <img className="brand-logo" src="/nika-dent-logo.png" alt="NIKA DENT — учебный центр" />
    </a>
  );
}

function DentalMotif({ className = '' }) {
  return (
    <div className={`dental-motif ${className}`} aria-hidden="true">
      <span className="motif-orbit motif-orbit-a" />
      <span className="motif-orbit motif-orbit-b" />
      <span className="motif-crosshair" />
      <span className="motif-core"><i /><i /></span>
      <span className="motif-clamp"><i /><i /></span>
      <span className="motif-scan" />
      <span className="motif-caption">DENTAL / NODE 04</span>
      <span className="motif-status">HEMOSTASIS <b>READY</b></span>
    </div>
  );
}

function Topbar({ step, total, onBack }) {
  return (
    <header className="topbar" id="top">
      <Logo />
      <div className="topbar-center"><span className="topbar-line" /> <span>УЧЕБНЫЙ ЦЕНТР</span> <span className="topbar-line" /></div>
      <div className="topbar-right">
        {onBack && <button className="back-button" onClick={onBack}>← Назад</button>}
        <span className="quiz-badge">ВИКТОРИНА</span>
        {step && <span className="top-counter">{String(step).padStart(2, '0')} <em>/</em> {String(total).padStart(2, '0')}</span>}
      </div>
    </header>
  );
}

function Footer({ compact = false }) {
  return <footer className={`site-footer ${compact ? 'site-footer-compact' : ''}`}><span>© NIKA DENT</span><span className="footer-slogan">ЗНАНИЯ · ТЕХНОЛОГИИ · ПРАКТИКА · РЕЗУЛЬТАТ</span><span>СТОМАТОЛОГ БУДУЩЕГО</span></footer>;
}

function Landing({ onStart }) {
  return (
    <div className="screen landing-screen">
      <Topbar />
      <div className="landing-grid">
        <div className="landing-copy">
          <div className="kicker"><span className="kicker-dot" /> NIKA DENT / 01</div>
          <h1>Какой Вы<br /><strong>стоматолог<br />будущего?</strong></h1>
          <p className="lead">10 ситуаций из современной практики. Выберите направление, отвечайте честно — и узнайте, какой подход ближе именно Вам.</p>
          <button className="cyan-button" onClick={onStart}>Выбрать направление</button>
          <div className="landing-facts"><span><b>10</b> вопросов</span><span><b>≈ 3</b> минуты</span><span><b>3</b> подхода</span></div>
        </div>
      </div>
      <DentalMotif className="motif-hero" />
      <div className="landing-corner">01<span>/ 03</span></div>
      <Footer />
    </div>
  );
}

function SegmentPicker({ onChoose, onBack }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="screen inner-screen segments-screen">
      <Topbar onBack={onBack} />
      <main className="segments-layout">
        <div className="section-intro"><div className="kicker"><span className="kicker-dot" /> ШАГ 01 / 03</div><h1>Выберите<br /><strong>направление</strong></h1><p>Для каждого направления — свои клинические ситуации и свой взгляд на стоматологию будущего.</p><span className="vertical-caption">NIKA DENT · QUIZ</span></div>
        <div className="segment-list" role="list">
          {quizData.segments.map((segment, index) => <button key={segment.id} className={`segment-row ${hovered === segment.id ? 'is-hovered' : ''}`} onMouseEnter={() => setHovered(segment.id)} onMouseLeave={() => setHovered(null)} onClick={() => onChoose(segment)}>
            <span className="segment-number">0{index + 1}</span><span className="segment-label">{segment.label}</span><span className="segment-description">{segment.description}</span>
          </button>)}
        </div>
      </main>
      <DentalMotif className="motif-segments" />
      <Footer compact />
    </div>
  );
}

function SegmentIntro({ segment, onStart, onBack }) {
  return (
    <div className="screen inner-screen intro-screen">
      <Topbar onBack={onBack} />
      <main className="intro-layout">
        <div className="intro-copy"><div className="kicker"><span className="kicker-dot" /> ШАГ 02 / 03</div><span className="intro-index">{segment.label}</span><h1>10 ситуаций<br /><strong>из практики</strong></h1><p>Выберите вариант, который ближе всего к тому, как Вы действительно работаете. Здесь нет оценки — только повод посмотреть на привычные решения свежим взглядом.</p><button className="cyan-button" onClick={onStart}>Начать тест</button><button className="text-button" onClick={onBack}>← Выбрать другое направление</button></div>
      </main>
      <DentalMotif className="motif-intro" />
      <Footer compact />
    </div>
  );
}

function calculateResult(segment, answers) {
  const values = answers.map((answer) => answer.value);
  if (segment.scoring === 'score') {
    const score = values.reduce((sum, value) => sum + value, 0);
    const resultKey = score <= 16 ? 'classic' : score <= 24 ? 'transition' : 'future';
    return { score, resultKey, result: quizData.results.score[resultKey], counts: countAnswers(answers) };
  }
  const counts = countAnswers(answers);
  const max = Math.max(counts.A, counts.B, counts.V);
  const leaders = Object.entries(counts).filter(([, count]) => count === max);
  const resultKey = leaders.length === 1 ? leaders[0][0] : 'tie';
  const resultSet = segment.id === 'manager' ? quizData.results.manager : quizData.results.majority;
  return { score: values.reduce((sum, value) => sum + value, 0), resultKey, result: resultSet[resultKey], counts };
}

function countAnswers(answers) {
  return answers.reduce((counts, answer) => { const key = { А: 'A', Б: 'B', В: 'V' }[answer.letter] || answer.letter; counts[key] += 1; return counts; }, { A: 0, B: 0, V: 0 });
}

function Quiz({ segment, onFinish, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const question = segment.questions[currentIndex];
  const progress = ((currentIndex + 1) / segment.questions.length) * 100;

  const choose = (option) => {
    const nextAnswers = [...answers, option];
    if (currentIndex === segment.questions.length - 1) { onFinish(nextAnswers); return; }
    setAnswers(nextAnswers);
    setCurrentIndex((value) => value + 1);
  };

  return (
    <div className="screen inner-screen quiz-screen">
      <Topbar step={currentIndex + 1} total={segment.questions.length} onBack={onBack} />
      <div className="question-progress"><span style={{ width: `${progress}%` }} /></div>
      <DentalMotif className="motif-quiz" />
      <main className="quiz-layout">
        <aside className="quiz-aside"><span className="vertical-caption">{segment.label}</span><span className="aside-line" /><span className="aside-caption">N / D</span></aside>
        <div className="question-column">
          <div className="question-meta"><span>ВОПРОС {currentIndex + 1} ИЗ {segment.questions.length}</span><span className="meta-divider" /><span>{segment.label}</span></div>
          <div className="question-title"><span className="question-topic">{question.title}</span><h1>{question.prompt}</h1><p>Выберите один вариант ответа</p></div>
          <div className="answer-list" role="radiogroup" aria-label="Варианты ответа">
            {question.options.map((option, index) => <button key={option.letter} className="answer-row" onClick={() => choose(option)} role="radio" aria-checked="false"><span className="answer-letter">{letters[index]}</span><span className="answer-copy">{option.text}</span><span className="answer-arrow">→</span></button>)}
          </div>
          <div className="question-note is-visible"><span className="note-icon">✦</span><span>Выберите вариант, чтобы перейти дальше</span></div>
        </div>
      </main>
      <Footer compact />
    </div>
  );
}

function Result({ segment, answers, onRestart }) {
  const resultData = useMemo(() => calculateResult(segment, answers), [segment, answers]);
  const [saveState, setSaveState] = useState('saving');
  const sent = useRef(false);

  useEffect(() => {
    document.title = `${resultData.result.label} — NIKA DENT`;
    if (sent.current) return;
    sent.current = true;
    const payload = { sessionId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`, segmentId: segment.id, segmentLabel: segment.label, score: resultData.score, resultKey: resultData.resultKey, resultLabel: resultData.result.label, answers: answers.map((answer, index) => ({ question: index + 1, letter: answer.letter, value: answer.value, text: answer.text })) };
    fetch('/api/quiz-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((response) => { if (!response.ok) throw new Error('save failed'); setSaveState('saved'); }).catch(() => setSaveState('offline'));
  }, [answers, resultData, segment]);

  return (
    <div className="screen result-screen">
      <Topbar />
      <main className="result-layout"><div className="result-copy"><div className="kicker"><span className="kicker-dot" /> ШАГ 03 / 03</div><span className="result-segment">{segment.label}</span><div className="result-score"><strong>{resultData.score}</strong><span>/ {segment.questions.length * 3}</span></div><h1>{resultData.result.icon} {resultData.result.label}</h1><p>{resultData.result.description}</p><button className="cyan-button" onClick={onRestart}>Пройти ещё раз</button><div className="save-status"><span className={`save-dot ${saveState}`} />{saveState === 'saving' ? 'Сохраняем Ваш результат' : saveState === 'saved' ? 'Результат сохранён' : 'Результат показан на экране'}</div></div></main>
      <DentalMotif className="motif-result" />
      <Footer />
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState('landing');
  const [segment, setSegment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const selectSegment = (nextSegment) => { setSegment(nextSegment); setScreen('intro'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const startQuiz = () => { setAnswers([]); setScreen('quiz'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const finishQuiz = (nextAnswers) => { setAnswers(nextAnswers); setScreen('result'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const restart = () => { setAnswers([]); setScreen('segments'); };
  return <>{screen === 'landing' && <Landing onStart={() => setScreen('segments')} />}{screen === 'segments' && <SegmentPicker onChoose={selectSegment} onBack={() => setScreen('landing')} />}{screen === 'intro' && segment && <SegmentIntro segment={segment} onStart={startQuiz} onBack={() => setScreen('segments')} />}{screen === 'quiz' && segment && <Quiz segment={segment} onFinish={finishQuiz} onBack={() => setScreen('intro')} />}{screen === 'result' && segment && <Result segment={segment} answers={answers} onRestart={restart} />}</>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
