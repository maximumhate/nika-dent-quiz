import { StrictMode, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { quizData } from './quizData';
import './styles.css';

const letters = ['А', 'Б', 'В'];

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="NIKA DENT — в начало">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
      <span className="brand-name">NIKA<span>DENT</span><small>учебный центр</small></span>
    </a>
  );
}

function ToothArtwork({ compact = false }) {
  return (
    <div className={`tooth-art ${compact ? 'tooth-art-compact' : ''}`} aria-hidden="true">
      <div className="scan-ring ring-a" /><div className="scan-ring ring-b" />
      <div className="tooth-glow" />
      <img className="tooth-photo" src="/tooth-hero.png?v=2" alt="" />
      <div className="art-code">CARE<br />CONTROL<br />FUTURE</div>
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
        <div className="landing-art"><ToothArtwork /><div className="art-label label-top">MODERN<br />DENTISTRY</div><div className="art-label label-bottom">SMILE<br />FORWARD</div></div>
      </div>
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
      <Footer compact />
    </div>
  );
}

function SegmentIntro({ segment, onStart, onBack }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submitLead = async (event) => {
    event.preventDefault();
    if (fullName.trim().length < 5 || phone.replace(/\D/g, '').length < 10) {
      setFormError('Проверьте ФИО и номер телефона');
      return;
    }
    setFormError(''); setIsSaving(true);
    const lead = { leadId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`, fullName: fullName.trim(), phone: phone.trim(), segmentId: segment.id, segmentLabel: segment.label };
    try {
      const response = await fetch('/api/quiz-leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
      if (!response.ok) throw new Error('lead save failed');
      onStart(lead);
    } catch {
      setFormError('Не удалось сохранить данные. Попробуйте ещё раз.');
    } finally { setIsSaving(false); }
  };

  return (
    <div className="screen inner-screen intro-screen">
      <Topbar onBack={onBack} />
      <main className="intro-layout">
        <div className="intro-copy"><div className="kicker"><span className="kicker-dot" /> ШАГ 02 / 03</div><span className="intro-index">{segment.label}</span><h1>10 ситуаций<br /><strong>из практики</strong></h1><p>Выберите вариант, который ближе всего к тому, как Вы действительно работаете. Здесь нет оценки — только повод посмотреть на привычные решения свежим взглядом.</p><form className="lead-form" onSubmit={submitLead}><label>Ваше имя<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Фамилия Имя Отчество" autoComplete="name" /></label><label>Телефон<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 (___) ___-__-__" type="tel" autoComplete="tel" /></label>{formError && <div className="form-error">{formError}</div>}<button className="cyan-button" disabled={isSaving} type="submit">{isSaving ? 'Сохраняем данные…' : 'Начать тест'}</button></form><button className="text-button" onClick={onBack}>← Выбрать другое направление</button></div>
        <div className="intro-art"><ToothArtwork compact /><div className="orbit-word">NEXT<br />LEVEL</div></div>
      </main>
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

function Quiz({ segment, lead, onFinish, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const question = segment.questions[currentIndex];
  const answered = selected !== null;
  const progress = ((currentIndex + (answered ? 1 : 0)) / segment.questions.length) * 100;

  const choose = (option) => setSelected(option);
  const next = () => {
    if (!answered) return;
    const nextAnswers = [...answers, selected];
    if (currentIndex === segment.questions.length - 1) { onFinish(nextAnswers); return; }
    setAnswers(nextAnswers); setSelected(null); setCurrentIndex((value) => value + 1);
  };

  return (
    <div className="screen inner-screen quiz-screen">
      <Topbar step={currentIndex + 1} total={segment.questions.length} onBack={onBack} />
      <div className="question-progress"><span style={{ width: `${progress}%` }} /></div>
      <main className="quiz-layout">
        <aside className="quiz-aside"><span className="vertical-caption">{segment.label}</span><span className="aside-line" /><span className="aside-caption">N / D</span></aside>
        <div className="question-column">
          <div className="question-meta"><span>ВОПРОС {currentIndex + 1} ИЗ {segment.questions.length}</span><span className="meta-divider" /><span>{segment.label}</span></div>
          <div className="question-title"><span className="question-topic">{question.title}</span><h1>{question.prompt}</h1><p>Выберите один вариант ответа</p></div>
          <div className="answer-list" role="radiogroup" aria-label="Варианты ответа">
            {question.options.map((option, index) => { const chosen = selected?.letter === option.letter; return <button key={option.letter} className={`answer-row ${chosen ? 'is-selected' : ''}`} onClick={() => choose(option)} role="radio" aria-checked={chosen}><span className="answer-letter">{letters[index]}</span><span className="answer-copy">{option.text}</span><span className="answer-arrow">{chosen ? '✓' : ''}</span></button>; })}
          </div>
          <div className={`question-note ${answered ? 'is-visible' : ''}`}><span className="note-icon">✦</span><span>{answered ? 'Ответ можно изменить до перехода к следующему вопросу.' : 'Выберите вариант, который ближе к Вашей практике'}</span></div>
          <div className="question-action"><span>{answered ? `${currentIndex + 1} / ${segment.questions.length}` : 'Ваш ответ'}</span><button className="cyan-button" disabled={!answered} onClick={next}>{currentIndex === segment.questions.length - 1 ? 'Получить результат' : 'Следующий вопрос'}</button></div>
        </div>
        <aside className="question-art"><ToothArtwork compact /><span className="art-counter">0{currentIndex + 1}<em>/ 10</em></span></aside>
      </main>
      <Footer compact />
    </div>
  );
}

function Result({ segment, lead, answers, onRestart }) {
  const resultData = useMemo(() => calculateResult(segment, answers), [segment, answers]);
  const [saveState, setSaveState] = useState('saving');
  const sent = useRef(false);

  useEffect(() => {
    document.title = `${resultData.result.label} — NIKA DENT`;
    if (sent.current) return;
    sent.current = true;
    const payload = { sessionId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`, leadId: lead.leadId, fullName: lead.fullName, phone: lead.phone, segmentId: segment.id, segmentLabel: segment.label, score: resultData.score, resultKey: resultData.resultKey, resultLabel: resultData.result.label, answers: answers.map((answer, index) => ({ question: index + 1, letter: answer.letter, value: answer.value, text: answer.text })) };
    fetch('/api/quiz-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((response) => { if (!response.ok) throw new Error('save failed'); setSaveState('saved'); }).catch(() => setSaveState('offline'));
  }, [answers, resultData, segment]);

  return (
    <div className="screen result-screen">
      <Topbar />
      <main className="result-layout"><div className="result-copy"><div className="kicker"><span className="kicker-dot" /> ШАГ 03 / 03</div><span className="result-segment">{segment.label}</span><div className="result-score"><strong>{resultData.score}</strong><span>/ {segment.questions.length * 3}</span></div><h1>{resultData.result.icon} {resultData.result.label}</h1><p>{resultData.result.description}</p><button className="cyan-button" onClick={onRestart}>Пройти ещё раз</button><div className="save-status"><span className={`save-dot ${saveState}`} />{saveState === 'saving' ? 'Сохраняем Ваш результат' : saveState === 'saved' ? 'Результат сохранён' : 'Результат показан на экране'}</div></div><div className="result-art"><ToothArtwork compact /><div className="result-stamp">NIKA<br />DENT<br /><span>FUTURE<br />STARTS<br />HERE</span></div></div></main>
      <Footer />
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState('landing');
  const [segment, setSegment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [lead, setLead] = useState(null);
  const selectSegment = (nextSegment) => { setSegment(nextSegment); setScreen('intro'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const startQuiz = (nextLead) => { setLead(nextLead); setAnswers([]); setScreen('quiz'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const finishQuiz = (nextAnswers) => { setAnswers(nextAnswers); setScreen('result'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const restart = () => { setAnswers([]); setLead(null); setScreen('segments'); };
  return <>{screen === 'landing' && <Landing onStart={() => setScreen('segments')} />}{screen === 'segments' && <SegmentPicker onChoose={selectSegment} onBack={() => setScreen('landing')} />}{screen === 'intro' && segment && <SegmentIntro segment={segment} onStart={startQuiz} onBack={() => setScreen('segments')} />}{screen === 'quiz' && segment && lead && <Quiz segment={segment} lead={lead} onFinish={finishQuiz} onBack={() => setScreen('intro')} />}{screen === 'result' && segment && lead && <Result segment={segment} lead={lead} answers={answers} onRestart={restart} />}</>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
