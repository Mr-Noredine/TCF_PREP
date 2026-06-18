import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { exercisesService } from '../../services/exercisesService';
import { getExerciseBestScore, getExerciseStatus, summarizeExercises } from '../../utils/exerciseStatus';
import '../../styles/exercises.css';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IcoGrid     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const IcoBook     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const IcoEdit     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>;
const IcoLibrary  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const IcoFileText = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoArrow    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IcoChevronLeft = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>;
const IcoCheck    = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoRefresh  = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>;
const IcoPlay     = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
const IcoEmpty    = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;

// ─── Metadata ─────────────────────────────────────────────────────────────────

const CAT_META = {
  reading_comprehension: { color: '#4338CA', bg: '#EEF0FB', Icon: IcoFileText },
  grammar:               { color: '#5B54C9', bg: '#F0EFFA', Icon: IcoBook     },
  conjugation:           { color: '#4F6BD6', bg: '#EEF2FC', Icon: IcoEdit     },
  vocabulary:            { color: '#6366A8', bg: '#F0F1F7', Icon: IcoLibrary  },
};

const LVL_META = {
  A1: { label: 'Débutant',      cls: 'lv-easy'   },
  A2: { label: 'Élémentaire',   cls: 'lv-easy'   },
  B1: { label: 'Intermédiaire', cls: 'lv-medium' },
  B2: { label: 'Avancé',        cls: 'lv-medium' },
  C1: { label: 'Supérieur',     cls: 'lv-hard'   },
  C2: { label: 'Maîtrise',      cls: 'lv-hard'   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBtnLabel(status) {
  if (status === 'reussi')   return 'Refaire';
  if (status === 'a-revoir') return 'Revoir';
  return 'Commencer';
}

function getScoreTheme(rawScore) {
  const s = parseFloat(rawScore);
  if (s >= 70) return { color: '#15966B', bg: '#EDFBF5' };
  if (s >= 40) return { color: '#D97706', bg: '#FEF8EC' };
  return { color: '#DC2626', bg: '#FEF2F2' };
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="ec-card ec-card--sk" aria-hidden="true">
    <div className="ec-ico ec-ico--sk" />
    <div className="ec-main">
      <div className="ec-sk ec-sk--sm" style={{ width: 90 }} />
      <div className="ec-sk ec-sk--lg" style={{ width: '72%', marginTop: 4 }} />
      <div className="ec-sk ec-sk--sm" style={{ width: 150, marginTop: 6 }} />
    </div>
    <div className="ec-right">
      <div className="ec-sk ec-sk--sm" style={{ width: 70 }} />
      <div className="ec-sk ec-sk--md" style={{ width: 100 }} />
    </div>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState = () => (
  <div className="ex-empty">
    <span className="ex-empty__ico"><IcoEmpty /></span>
    <h3 className="ex-empty__title">Aucun exercice trouvé</h3>
    <p className="ex-empty__text">
      Aucun exercice ne correspond au niveau sélectionné.
    </p>
  </div>
);

// ─── ExerciceCard — premium horizontal card ───────────────────────────────────

const ExerciceCard = ({ ex, index, onStart }) => {
  const m        = CAT_META[ex.category_slug] || { color: '#4338CA', bg: '#EEF0FB', Icon: IcoBook };
  const lv       = LVL_META[ex.level]         || { label: ex.level, cls: 'lv-medium' };
  const st       = getExerciseStatus(ex);
  const Icon     = m.Icon;
  const bestScore = getExerciseBestScore(ex);
  const hasScore = bestScore !== null;
  const score    = hasScore ? Math.round(bestScore) : null;
  const sc       = hasScore ? getScoreTheme(bestScore) : null;
  const btnLbl   = getBtnLabel(st);
  const typeLabel = ex.type === 'mcq' ? 'QCM' : ex.type === 'fill_blank' ? 'Texte à trous' : (ex.type || '');
  const exNum    = ex.id ? parseInt(ex.id.split('_').pop(), 10) || null : null;

  return (
    <article
      className={`ec-card ec-card--${st}`}
      style={{ '--cc': m.color, '--cb': m.bg, animationDelay: `${Math.min(index, 30) * 20}ms` }}
      onClick={() => onStart(ex)}
      tabIndex="0"
      onKeyDown={e => e.key === 'Enter' && onStart(ex)}
      role="button"
      aria-label={`Exercice ${ex.category_name} niveau ${ex.level}`}
    >
      {/* Category icon */}
      <div className="ec-ico" aria-hidden="true">
        <Icon />
      </div>

      {/* Main content */}
      <div className="ec-main">
        <span className="ec-cat">{ex.category_name}</span>
        <p className="ec-title">{ex.prompt}</p>
        <div className="ec-meta">
          <span className={`ec-badge ec-badge--level ${lv.cls}`}>{ex.level} — {lv.label}</span>
          {typeLabel && <span className="ec-badge ec-badge--type">{typeLabel}</span>}
          {exNum && <span className="ec-badge ec-badge--num">Exercice {exNum}</span>}
        </div>
      </div>

      {/* Right: status + score + CTA */}
      <div className="ec-right">
        <div className="ec-status-row">
          {st === 'reussi'   && (
            <span className="ec-status ec-status--done">
              <IcoCheck /> Réussi
            </span>
          )}
          {st === 'a-revoir' && (
            <span className="ec-status ec-status--review">
              <IcoRefresh /> À revoir
            </span>
          )}
          {st === 'a-faire'  && (
            <span className="ec-status ec-status--new">
              <IcoPlay /> À faire
            </span>
          )}
          {score !== null && (
            <span className="ec-score" style={{ color: sc.color, background: sc.bg }}>
              {score}%
            </span>
          )}
        </div>

        <button
          className={`ec-btn ec-btn--${st}`}
          onClick={e => { e.stopPropagation(); onStart(ex); }}
          aria-label={`${btnLbl} — ${ex.category_name} ${ex.level}`}
        >
          {btnLbl} <IcoArrow />
        </button>
      </div>
    </article>
  );
};


// ─── CategoryCard — first step selection ─────────────────────────────────────

const CategoryCard = ({ cat, index, summary, onSelect }) => {
  const m = CAT_META[cat.slug] || { color: '#4338CA', bg: '#EEF0FB', Icon: IcoBook };
  const Icon = m.Icon;
  const donePct = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

  return (
    <button
      type="button"
      className="ex-category-card"
      style={{ '--cc': m.color, '--cb': m.bg, animationDelay: `${Math.min(index, 12) * 35}ms` }}
      onClick={() => onSelect(cat.slug)}
      aria-label={`Voir les exercices : ${cat.name}`}
    >
      <span className="ex-category-card__top">
        <span className="ex-category-card__ico" aria-hidden="true"><Icon /></span>
        <span className="ex-category-card__count">{summary.total} exercices</span>
      </span>

      <span className="ex-category-card__body">
        <span className="ex-category-card__name">{cat.name}</span>
        <span className="ex-category-card__desc">
          {summary.levels.length
            ? `Niveaux ${summary.levels.join(', ')}`
            : 'Aucun niveau disponible'}
        </span>
      </span>

      <span className="ex-category-card__progress" aria-label={`${donePct}% réussi`}>
        <span className="ex-category-card__progress-bar">
          <span style={{ width: `${donePct}%` }} />
        </span>
        <span>{summary.done} réussis</span>
      </span>

      <span className="ex-category-card__footer">
        <span>{summary.review} à revoir</span>
        <span className="ex-category-card__action">Voir les exercices <IcoArrow /></span>
      </span>
    </button>
  );
};

// ─── CategoryOverview — selected category context ────────────────────────────

const CategoryOverview = ({ cat, summary, levels, activeLevel, onLevelSelect, onBack, onStartFirst, canStart }) => {
  const m = CAT_META[cat?.slug] || { color: '#4338CA', bg: '#EEF0FB', Icon: IcoBook };
  const Icon = m.Icon;
  const donePct = summary?.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

  return (
    <section
      className="ex-category-overview"
      style={{ '--cc': m.color, '--cb': m.bg }}
      aria-label={`Résumé : ${cat?.name}`}
    >
      <div className="ex-category-overview__main">
        <div className="ex-category-overview__icon" aria-hidden="true"><Icon /></div>
        <div className="ex-category-overview__title-block">
          <button className="ex-category-overview__back" onClick={onBack} type="button">
            <IcoChevronLeft /> Catégories
          </button>
          <span className="ex-category-overview__kicker">Catégorie sélectionnée</span>
          <h2>{cat?.name}</h2>
          <div className="ex-category-overview__progress" aria-label={`${donePct}% réussi`}>
            <span className="ex-category-overview__bar"><span style={{ width: `${donePct}%` }} /></span>
            <strong>{donePct}%</strong>
          </div>
        </div>
      </div>

      <div className="ex-category-overview__stats" aria-label="Progression de la catégorie">
        <div className="ex-category-overview__stat">
          <span>{summary.total}</span>
          <small>Total</small>
        </div>
        <div className="ex-category-overview__stat ex-category-overview__stat--done">
          <span>{summary.done}</span>
          <small>Réussis</small>
        </div>
        <div className="ex-category-overview__stat ex-category-overview__stat--review">
          <span>{summary.review}</span>
          <small>À revoir</small>
        </div>
        <div className="ex-category-overview__stat">
          <span>{summary.todo}</span>
          <small>À faire</small>
        </div>
      </div>

      <div className="ex-category-overview__actions">
        <div className="ex-category-overview__levels" role="group" aria-label="Niveau rapide">
          <button
            className={`ex-level-chip${activeLevel === 'tous' ? ' ex-level-chip--on' : ''}`}
            onClick={() => onLevelSelect('tous')}
            type="button"
          >Tous</button>
          {levels.map(lv => (
            <button
              key={lv}
              className={`ex-level-chip${activeLevel === lv ? ' ex-level-chip--on' : ''}`}
              onClick={() => onLevelSelect(lv)}
              type="button"
            >{lv}</button>
          ))}
        </div>
        <button className="ex-category-overview__start" onClick={onStartFirst} disabled={!canStart} type="button">
          Démarrer <IcoArrow />
        </button>
      </div>
    </section>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const Exercises = () => {
  const navigate = useNavigate();

  const [exercises,    setExercises]  = useState([]);
  const [categories,   setCategories] = useState([]);
  const [loading,      setLoading]    = useState(true);

  const [activeFilter, setFilter]     = useState('tous');
  const [activeLevel,  setLevel]      = useState('tous');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [listRes, catRes] = await Promise.all([
        exercisesService.getList(),
        exercisesService.getCategories(),
      ]);
      setExercises(listRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Erreur chargement exercices:', err);
    } finally {
      setLoading(false);
    }
  };

  const isCategorySelection = activeFilter === 'tous';
  const activeCategoryExercises = isCategorySelection
    ? []
    : exercises.filter(e => e.category_slug === activeFilter);
  const levels = [...new Set(activeCategoryExercises.map(e => e.level))].sort();

  const getCategorySummary = slug => {
    const items = exercises.filter(e => e.category_slug === slug);
    return {
      ...summarizeExercises(items),
      levels: [...new Set(items.map(e => e.level))].sort(),
    };
  };

  const selectCategory = slug => {
    setFilter(slug);
    setLevel('tous');
  };

  const backToCategories = () => {
    setFilter('tous');
    setLevel('tous');
  };

  const filtered = activeCategoryExercises.filter(ex => (
    activeLevel === 'tous' || ex.level === activeLevel
  ));

  const hasExerciseFilter = activeLevel !== 'tous';

  const globalSummary = summarizeExercises(exercises);
  const totalDone   = globalSummary.done;
  const totalReview = globalSummary.review;
  const totalNew    = globalSummary.todo;

  const handleStart = useCallback((ex) => {
    const exerciseList = filtered.map(e => ({
      id: e.id, category_name: e.category_name, category_slug: e.category_slug, level: e.level,
    }));
    const currentIndex = filtered.findIndex(e => e.id === ex.id);
    navigate(`/exercice/${ex.id}`, { state: { exercises: exerciseList, currentIndex } });
  }, [filtered, navigate]);

  const activeCategory = categories.find(c => c.slug === activeFilter);
  const activeCatName = activeCategory?.name;
  const activeCategorySummary = activeCategory ? getCategorySummary(activeCategory.slug) : null;
  const startFirstVisibleExercise = () => {
    if (filtered.length > 0) handleStart(filtered[0]);
  };

  return (
    <>
      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <section className="ex-hero" aria-label="Bibliothèque d'exercices">
        <div className="ex-hero__orbs" aria-hidden="true">
          <div className="ex-orb ex-orb--a" />
          <div className="ex-orb ex-orb--b" />
          <div className="ex-orb ex-orb--c" />
        </div>

        <div className="ex-hero__inner">
          <p className="ex-hero__eyebrow animate-fade-up">
            <span className="ex-hero__pip" aria-hidden="true" />
            Bibliothèque d'exercices TCF
          </p>

          <h1 className="ex-hero__h1 animate-fade-up-1">
            Choisissez votre<br />
            <em className="ex-hero__accent">exercice</em>
          </h1>

          <p className="ex-hero__sub animate-fade-up-2">
            Chaque exercice est individuel et tracé. Voyez exactement ce que vous avez fait,
            ce qui est à revoir, et progressez sans jamais vous répéter inutilement.
          </p>

          {!loading && (
            <div className="ex-hero__stats animate-fade-up-3">
              <div className="ex-stat">
                <span className="ex-stat__num">{exercises.length}</span>
                <span className="ex-stat__lbl">Exercices</span>
              </div>
              <div className="ex-stat-sep" />
              <div className="ex-stat" style={{ color: '#15966B' }}>
                <span className="ex-stat__num">{totalDone}</span>
                <span className="ex-stat__lbl">Réussis</span>
              </div>
              <div className="ex-stat-sep" />
              <div className="ex-stat" style={{ color: '#D97706' }}>
                <span className="ex-stat__num">{totalReview}</span>
                <span className="ex-stat__lbl">À revoir</span>
              </div>
              <div className="ex-stat-sep" />
              <div className="ex-stat">
                <span className="ex-stat__num">{totalNew}</span>
                <span className="ex-stat__lbl">À faire</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══ RESULTS ═══════════════════════════════════════════════════════════ */}
      <section className="ex-results">
        <div className="ex-results__inner">
          {!isCategorySelection && activeCategory && activeCategorySummary && (
            <CategoryOverview
              cat={activeCategory}
              summary={activeCategorySummary}
              levels={levels}
              activeLevel={activeLevel}
              onLevelSelect={setLevel}
              onBack={backToCategories}
              onStartFirst={startFirstVisibleExercise}
              canStart={filtered.length > 0}
            />
          )}

          {/* Section header */}
          <div className="ex-section-header">
            <div className="ex-section-header__left">
              <h2 className="ex-section-header__title">
                {isCategorySelection ? 'Choisissez une catégorie' : activeCatName}
              </h2>
              {!loading && (
                <p className="ex-section-header__count">
                  {isCategorySelection ? (
                    <>
                      <strong>{categories.length}</strong>{' '}
                      {categories.length === 1 ? 'catégorie' : 'catégories'} pour <strong>{exercises.length}</strong> exercices
                    </>
                  ) : (
                    <>
                      <strong>{filtered.length}</strong>{' '}
                      {filtered.length === 1 ? 'exercice' : 'exercices'}
                      {hasExerciseFilter && (filtered.length !== activeCategoryExercises.length
                        ? (filtered.length === 1 ? ' filtré' : ' filtrés')
                        : ''
                      )}
                      {' '}sur <strong>{activeCategoryExercises.length}</strong> dans cette catégorie
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="ex-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : isCategorySelection ? (
            <div className="ex-category-grid">
              {categories.map((cat, i) => (
                <CategoryCard
                  key={cat.id || cat.slug}
                  cat={cat}
                  index={i}
                  summary={getCategorySummary(cat.slug)}
                  onSelect={selectCategory}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="ex-grid">
              {filtered.map((ex, i) => (
                <ExerciceCard key={ex.id} ex={ex} index={i} onStart={handleStart} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Exercises;
