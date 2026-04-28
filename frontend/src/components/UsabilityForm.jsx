import React, { useState } from 'react';

const QUESTIONS = [
  "This dashboard's capabilities meet my requirements.",
  "This dashboard is easy to use.",
];

const SCALE_LABELS = [
  'Strongly\nDisagree',
  'Disagree',
  'Somewhat\nDisagree',
  'Neutral',
  'Somewhat\nAgree',
  'Agree',
  'Strongly\nAgree',
];

function getAdjective(score) {
  if (score >= 85.6) return 'Best Imaginable';
  if (score >= 72.6) return 'Excellent';
  if (score >= 52.0) return 'Good';
  if (score >= 38.0) return 'OK';
  if (score >= 24.0) return 'Poor';
  return 'Worst Imaginable';
}

function getGrade(score) {
  if (score >= 80.3) return 'A';
  if (score >= 68)   return 'B';
  if (score >= 51)   return 'C';
  if (score >= 35)   return 'D';
  return 'F';
}

function calcScore(q1, q2) {
  return Math.round(((q1 - 1) + (q2 - 1)) / 12 * 1000) / 10;
}

function ScoreGauge({ score }) {
  const VW = 540;
  const VH = 120;
  const bx = 36, by = 62, bw = VW - 72, bh = 26;
  const circR = 21;
  const scoreX = bx + (score / 100) * bw;
  const circCY = 21;

  const ticks = [
    { v: 0,    l: '0' },
    { v: 24,   l: '24' },
    { v: 38,   l: '38' },
    { v: 52,   l: '52' },
    { v: 72.6, l: '73' },
    { v: 85.6, l: '86' },
    { v: 100,  l: '100' },
  ];

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      style={{ maxWidth: 500, display: 'block', margin: '0 auto' }}
    >
      <defs>
        <linearGradient id="barGrad" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%"    stopColor="#ff6b6b" />
          <stop offset="23%"   stopColor="#ff9a3c" />
          <stop offset="37%"   stopColor="#ffd060" />
          <stop offset="51%"   stopColor="#b5e550" />
          <stop offset="72%"   stopColor="#4ade80" />
          <stop offset="85%"   stopColor="#22c55e" />
          <stop offset="100%"  stopColor="#15803d" />
        </linearGradient>
      </defs>

      <rect x={bx} y={by} width={bw} height={bh} rx={13} fill="url(#barGrad)" />

      {ticks.map((t, i) => {
        const x = bx + (t.v / 100) * bw;
        return (
          <g key={i}>
            <line x1={x} y1={by + bh} x2={x} y2={by + bh + 5} stroke="#3a3a3a" strokeWidth={1} />
            <text
              x={x} y={by + bh + 17}
              textAnchor="middle" fill="#555"
              fontSize={10} fontFamily="system-ui, sans-serif"
            >
              {t.l}
            </text>
          </g>
        );
      })}

      <line
        x1={scoreX} y1={circCY + circR}
        x2={scoreX} y2={by}
        stroke="rgba(255,255,255,0.45)" strokeWidth={1.5}
      />

      <circle
        cx={scoreX} cy={circCY} r={circR}
        fill="#111" stroke="rgba(255,255,255,0.75)" strokeWidth={1.5}
      />
      <text
        x={scoreX} y={circCY + 5}
        textAnchor="middle" fill="white"
        fontSize={score >= 100 ? 9 : 11}
        fontWeight="700" fontFamily="system-ui, sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

export default function UsabilityForm() {
  const [step, setStep]           = useState(0);
  const [animDir, setAnimDir]     = useState('forward');
  const [name, setName]           = useState('');
  const [role, setRole]           = useState('');
  const [answers, setAnswers]     = useState([4, 4]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const score     = calcScore(answers[0], answers[1]);
  const adjective = getAdjective(score);
  const grade     = getGrade(score);

  function go(next) {
    setAnimDir(next > step ? 'forward' : 'back');
    setStep(next);
  }

  function setAnswer(qIndex, val) {
    const next = [...answers];
    next[qIndex] = val;
    setAnswers(next);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: name.trim(),
          userRole: role,
          q1Requirements: answers[0],
          q2EaseOfUse: answers[1],
        }),
      });
      const data = await res.json();
      if (data.success) {
        go(4);
      } else {
        setSubmitError('Submission failed. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection.');
    }
    setSubmitting(false);
  }

  const labelFor  = (val) => SCALE_LABELS[val - 1].replace('\n', ' ');
  const fillCalc  = (val) => `calc(${(val - 1) / 6} * (100% - 28px) + 14px)`;

  return (
    <div className="app">
      <div key={step} className={`step-wrap step-${animDir}`}>

        {/* ── Landing ── */}
        {step === 0 && (
          <div className="landing">
            <div className="landing-title">Nicotine Cessation Program Dashboard</div>
            <div className="landing-sub">Usability Scoring</div>

            <div className="instruction">
              Please explore the dashboard before responding. The mock Nicotine
              Cessation Program Dashboard has been shared with you via email.
            </div>

            <div className="landing-fields">
              <div className="field-row">
                <label className="field-label">Name</label>
                <input
                  className="name-input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && role && go(1)}
                  autoFocus
                />
              </div>
              <div className="field-row">
                <label className="field-label">Role <span className="required">*</span></label>
                <select
                  className="role-select"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                >
                  <option value="" disabled>Select your role</option>
                  <option value="CTTS">CTTS</option>
                  <option value="Physician">Physician</option>
                  <option value="Student">Student</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button
                className="arrow-btn"
                disabled={!role}
                onClick={() => go(1)}
                aria-label="Continue"
              >
                &#8594;
              </button>
            </div>
          </div>
        )}

        {/* ── Questions ── */}
        {(step === 1 || step === 2) && (
          <div className="question-page">
            <div className="q-header">
              <button className="ghost-btn" onClick={() => go(step - 1)}>&#8592;</button>
              <div className="progress-pills">
                <span className={`pill ${step >= 1 ? 'pill-active' : ''}`} />
                <span className={`pill ${step >= 2 ? 'pill-active' : ''}`} />
              </div>
              <span className="progress-text">{step} of 2</span>
            </div>

            <div className="q-text">{QUESTIONS[step - 1]}</div>

            <div className="slider-section">
              <div className="slider-endpoints">
                <span>Strongly Disagree</span>
                <span>Strongly Agree</span>
              </div>
              <input
                type="range"
                min="1" max="7" step="1"
                className="slider"
                value={answers[step - 1]}
                onChange={e => setAnswer(step - 1, Number(e.target.value))}
                style={{
                  background: `linear-gradient(to right, #4ade80 ${fillCalc(answers[step - 1])}, #272727 ${fillCalc(answers[step - 1])})`,
                }}
              />
              <div className="slider-ticks">
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <span
                    key={n}
                    className={`tick ${answers[step - 1] === n ? 'tick-active' : ''}`}
                    style={{ left: `calc(${(n - 1) / 6} * (100% - 28px) + 14px)` }}
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="selected-display">
              <span className="sel-num">{answers[step - 1]}</span>
              <span className="sel-sep"> — </span>
              <span className="sel-label">{labelFor(answers[step - 1])}</span>
            </div>

            <button className="primary-btn" onClick={() => go(step === 2 ? 3 : 2)}>
              {step === 2 ? 'Review' : 'Next'} &#8594;
            </button>
          </div>
        )}

        {/* ── Review ── */}
        {step === 3 && (
          <div className="review-page">
            <div className="review-title">Review Your Responses</div>

            <div className="review-cards">
              {QUESTIONS.map((q, i) => (
                <div className="review-card" key={i}>
                  <div className="review-q-num">Q{i + 1}</div>
                  <div className="review-q-text">{q}</div>
                  <div className="review-score-row">
                    <span className="review-num">{answers[i]}</span>
                    <span className="review-denom">/7</span>
                    <span className="review-lbl">— {labelFor(answers[i])}</span>
                  </div>
                  <button className="edit-btn" onClick={() => go(i + 1)}>Edit</button>
                </div>
              ))}
            </div>

            {submitError && <div className="error-msg">{submitError}</div>}

            <div className="review-actions">
              <button className="ghost-btn ghost-btn-lg" onClick={() => go(2)}>&#8592; Back</button>
              <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {step === 4 && (
          <div className="results-page">
            <div className="results-header">
              <div className="rh-col">
                <div className="rh-label">SCORE</div>
                <div className="rh-value">{score}</div>
              </div>
              <div className="rh-divider" />
              <div className="rh-col">
                <div className="rh-label">RATING</div>
                <div className="rh-value">{adjective}</div>
              </div>
              <div className="rh-divider" />
              <div className="rh-col">
                <div className="rh-label">GRADE</div>
                <div className="rh-value">{grade}</div>
              </div>
            </div>

            <div className="results-center">
              <div className="result-score-big">{score}</div>
              <div className="result-adj">{adjective.toUpperCase()}</div>
            </div>

            <ScoreGauge score={score} />

            <div className="thank-you">Thank you, {name}!</div>
            <div className="close-hint">You may now close this tab.</div>
          </div>
        )}

      </div>
    </div>
  );
}
