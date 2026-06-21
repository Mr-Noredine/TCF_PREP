import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { examenService } from '../../services/examenService';
import AnswerExplanation from '../../components/AnswerExplanation/AnswerExplanation';
import '../../styles/examen.css';

const IcoArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const EPREUVE_LABELS = {
  comprehension_orale:  'Compréhension orale',
  comprehension_ecrite: 'Compréhension écrite',
  structures_langue:    'Structures de la langue',
};

// Map epreuve → library filter slug
const EPREUVE_SLUG = {
  comprehension_orale:  'listening_comprehension',
  comprehension_ecrite: 'reading_comprehension',
  structures_langue:    'grammar',
};

function levelClass(l) {
  if (!l || l.startsWith('Inférieur')) return 'exb-level--none';
  if (l.startsWith('A')) return `exb-level--${l}`;
  if (l.startsWith('B')) return `exb-level--${l}`;
  if (l.startsWith('C')) return `exb-level--${l}`;
  return 'exb-level--none';
}

function barColor(pct) {
  if (pct >= 70) return '#15966B';
  if (pct >= 40) return '#4338CA';
  return '#D97706';
}

function fmtDuration(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m} min ${sec} s` : `${sec} s`;
}

// Derive correct answer text from choices + answer field
function getCorrectText(choices, answer) {
  if (!choices) return answer;
  const parsed = typeof choices === 'string' ? JSON.parse(choices) : choices;
  if (!isNaN(parseInt(answer))) {
    return parsed[parseInt(answer)] ?? answer;
  }
  return answer;
}

function getGivenText(choices, given) {
  if (given === null || given === undefined) return null;
  if (!choices) return given;
  const parsed = typeof choices === 'string' ? JSON.parse(choices) : choices;
  if (!isNaN(parseInt(given))) {
    return parsed[parseInt(given)] ?? given;
  }
  return given;
}

function isCorrect(answer, choices, given) {
  if (given === null || given === undefined) return false;
  const parsed = typeof choices === 'string' ? JSON.parse(choices ?? '[]') : (choices || []);
  let correctIdx;
  if (!isNaN(parseInt(answer))) {
    correctIdx = parseInt(answer);
  } else {
    correctIdx = parsed.findIndex(c => c.trim().toLowerCase() === answer.trim().toLowerCase());
  }
  return parseInt(given) === correctIdx;
}

const ExamenResultats = () => {
  const { sessionId } = useParams();
  const navigate      = useNavigate();

  const [data,       setData]      = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [filterOnly, setFilter]    = useState(false); // show only wrong answers

  useEffect(() => {
    examenService.getResultats(sessionId)
      .then(d => setData(d))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--tx-3)' }}>
        Calcul des résultats…
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <p>Résultats introuvables.</p>
        <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/examen')}>
          Retour
        </button>
      </div>
    );
  }

  const { session, questions, answers } = data;
  const answerMap = {};
  for (const a of answers) answerMap[a.question_order] = a.answer_given;

  const scoreByEpreuve = typeof session.score_by_epreuve === 'string'
    ? JSON.parse(session.score_by_epreuve)
    : (session.score_by_epreuve || {});

  const levelEst = session.level_estimate || '—';
  const pct      = Math.round(session.percentage || 0);
  const score    = session.score ?? 0;
  const total    = session.total_questions ?? questions.length;

  // Find weakest epreuve
  let weakEpreuve = null;
  let weakPct = Infinity;
  for (const [ep, d] of Object.entries(scoreByEpreuve)) {
    if (d.percentage < weakPct) { weakPct = d.percentage; weakEpreuve = ep; }
  }

  const displayQuestions = filterOnly
    ? questions.filter(q => !isCorrect(q.answer, q.choices, answerMap[q.question_order]))
    : questions;

  return (
    <main>
      <div className="exb-results">

        {/* ── Level badge ── */}
        <div className="exb-level-wrap">
          <div className={`exb-level-badge ${levelClass(levelEst)}`}>
            {levelEst.startsWith('Inférieur') ? '< A1' : levelEst}
          </div>
          <h1 className="exb-level-title">Niveau estimé</h1>
          <p className="exb-level-score">
            {score} / {total} · {pct} % · {fmtDuration(session.duration_seconds)}
          </p>
          <p className="exb-disclaimer">
            Estimation indicative — ne remplace pas un test TCF officiel.
          </p>
        </div>

        {/* ── Per-epreuve breakdown ── */}
        {Object.keys(scoreByEpreuve).length > 0 && (
          <div className="exb-breakdown">
            {Object.entries(scoreByEpreuve).map(([ep, d]) => (
              <div key={ep} className="exb-epreuve-card">
                <div className="exb-epreuve-card__name">
                  {EPREUVE_LABELS[ep] || ep}
                </div>
                <div className="exb-epreuve-card__score">
                  {d.correct}<span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--tx-3)' }}>/{d.total}</span>
                </div>
                <div className="exb-epreuve-card__pct">{d.percentage} %</div>
                <div className="exb-epreuve-bar">
                  <div
                    className="exb-epreuve-bar__fill"
                    style={{ width: `${d.percentage}%`, background: barColor(d.percentage) }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Weak epreuve recommendation */}
        {weakEpreuve && weakPct < 70 && (
          <div style={{
            padding: '14px 18px', background: 'var(--primary-light)',
            border: '1px solid var(--primary-mid)', borderRadius: '10px',
            fontSize: '0.875rem', color: 'var(--primary)', marginBottom: '1rem',
          }}>
            Point faible : <strong>{EPREUVE_LABELS[weakEpreuve]}</strong> ({weakPct} %).{' '}
            <Link
              to={`/exercices?category=${EPREUVE_SLUG[weakEpreuve]}`}
              style={{ color: 'var(--primary)', fontWeight: 700 }}
            >
              Entraînez-vous ici →
            </Link>
          </div>
        )}

        {/* ── Detailed correction ── */}
        <div className="exb-correction">
          <div className="exb-correction__header">
            <h2 className="exb-correction__title">Correction détaillée</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className={`exb-filter-btn${!filterOnly ? ' exb-filter-btn--active' : ''}`}
                onClick={() => setFilter(false)}
              >
                Toutes ({questions.length})
              </button>
              <button
                className={`exb-filter-btn${filterOnly ? ' exb-filter-btn--active' : ''}`}
                onClick={() => setFilter(true)}
              >
                Erreurs ({questions.filter(q => !isCorrect(q.answer, q.choices, answerMap[q.question_order])).length})
              </button>
            </div>
          </div>

          {displayQuestions.map(q => {
            const given      = answerMap[q.question_order];
            const correct    = isCorrect(q.answer, q.choices, given);
            const givenText  = getGivenText(q.choices, given);
            const correctTxt = getCorrectText(q.choices, q.answer);

            return (
              <div key={q.question_order} className={`exb-qitem exb-qitem--${correct ? 'correct' : 'wrong'}`}>
                <div className="exb-qitem__header">
                  <span className="exb-qitem__num">Q{q.question_order}</span>
                  <span className={`exb-qitem__status exb-qitem__status--${correct ? 'ok' : 'err'}`}>
                    {correct ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--tx-3)' }}>
                    {EPREUVE_LABELS[q.epreuve] || q.epreuve} · {q.level}
                  </span>
                </div>

                <div className="exb-qitem__prompt">{q.prompt}</div>

                <div className="exb-qitem__answers">
                  {given !== null && given !== undefined ? (
                    <div className={`exb-qitem__ans exb-qitem__ans--given-${correct ? 'ok' : 'err'}`}>
                      {correct ? '✓' : '✗'} Votre réponse : <strong>{givenText}</strong>
                    </div>
                  ) : (
                    <div className="exb-qitem__ans exb-qitem__ans--skipped">
                      Sans réponse
                    </div>
                  )}
                  {!correct && (
                    <div className="exb-qitem__ans exb-qitem__ans--correct">
                      ✓ Bonne réponse : <strong>{correctTxt}</strong>
                    </div>
                  )}
                </div>

                {(q.explanation || q.distractors) && (
                  <div className="exb-qitem__explanation">
                    <AnswerExplanation
                      explanation={q.explanation}
                      distractors={q.distractors}
                      compact
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Actions ── */}
        <div className="exb-results-actions">
          <button
            className="btn-primary"
            style={{ fontSize: '0.9rem', padding: '11px 26px', minHeight: '44px' }}
            onClick={() => navigate('/examen')}
          >
            Refaire un examen <IcoArrow />
          </button>

          <Link to="/exercices" className="exb-link-btn">
            Bibliothèque d'exercices
          </Link>

          <Link to="/dashboard" className="exb-link-btn">
            Mon dashboard
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ExamenResultats;
