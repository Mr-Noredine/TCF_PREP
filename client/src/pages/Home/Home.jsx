import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/home.css';

const IcoArrow = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const IcoClock = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoTarget = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IcoFile = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IcoMic = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const IcoRefresh = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>;
const IcoCheck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>;

const features = [
  { icon: IcoClock, title: 'Examens blancs chronométrés', text: 'Des sessions Express ou complètes avec compréhension orale, structures de la langue et compréhension écrite.' },
  { icon: IcoMic, title: 'Expression écrite et orale', text: 'Des espaces dédiés pour vous entraîner à produire, pas seulement à reconnaître les bonnes réponses.' },
  { icon: IcoRefresh, title: 'Révision ciblée des erreurs', text: 'Les exercices réussis, à revoir et à faire sont séparés pour guider vos prochaines sessions.' },
  { icon: IcoFile, title: 'Supports authentiques', text: 'Affiches, SMS, courriels, articles, annonces et audio simulé pour se rapprocher du format TCF.' },
];

const steps = [
  ['Évaluez votre niveau', 'Commencez par un entraînement ou un examen blanc pour identifier vos priorités.'],
  ['Entraînez-vous par compétence', 'Filtrez par catégorie, niveau et type de document pour travailler précisément.'],
  ['Passez l’examen blanc', 'Mesurez votre progression dans un format chronométré et structuré.'],
];

const Home = () => {
  const [exerciseCount, setExerciseCount] = useState(null);

  useEffect(() => {
    let mounted = true;
    axios.get('/api/exercises/count')
      .then(res => { if (mounted) setExerciseCount(res.data.total); })
      .catch(() => { if (mounted) setExerciseCount(null); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__overlay" />
        <div className="landing-hero__inner">
          <p className="landing-eyebrow">Préparation TCF · A1 à C2</p>
          <h1 id="landing-title">Préparez le TCF sérieusement, à votre rythme</h1>
          <p className="landing-hero__text">
            Entraînez-vous avec des supports proches du TCF, des corrections détaillées et un suivi clair de vos progrès.
          </p>
          <div className="landing-hero__actions" aria-label="Actions principales">
            <Link className="landing-btn landing-btn--primary" to="/auth?mode=register">Commencer gratuitement <IcoArrow /></Link>
            <Link className="landing-btn landing-btn--secondary" to="/auth?mode=register&next=examen">Voir un exemple d’examen</Link>
          </div>
        </div>
      </section>

      <section className="landing-proof" aria-label="Chiffres clés">
        <div className="landing-proof__inner">
          <div><strong>{exerciseCount ?? '—'}</strong><span>exercices</span></div>
          <div><strong>5</strong><span>catégories</span></div>
          <div><strong>6</strong><span>niveaux A1-C2</span></div>
          <div><strong>2</strong><span>formats d’examen blanc</span></div>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="features-title">
        <div className="landing-section__head">
          <p className="landing-kicker">Ce que vous travaillez</p>
          <h2 id="features-title">Un entraînement construit autour des vraies compétences</h2>
          <p>Pas de promesse magique : vous progressez parce que chaque réponse donne une information utile.</p>
        </div>
        <div className="landing-feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <article className="landing-feature" key={title}>
              <span className="landing-feature__icon"><Icon /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-how" aria-labelledby="how-title">
        <div className="landing-how__inner">
          <div className="landing-section__head landing-section__head--left">
            <p className="landing-kicker">Méthode</p>
            <h2 id="how-title">Comment ça marche</h2>
          </div>
          <ol className="landing-steps">
            {steps.map(([title, text], index) => (
              <li key={title}>
                <span>{index + 1}</span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section landing-section--cred" aria-labelledby="cred-title">
        <div className="landing-cred">
          <div>
            <p className="landing-kicker">Pédagogie</p>
            <h2 id="cred-title">Aligné CECRL, corrigé sans surpromettre</h2>
            <p>
              Les exercices sont classés de A1 à C2 et les corrections expliquent la règle ou l’indice du support. Le but n’est pas de garantir un score, mais de rendre votre travail plus précis et plus régulier.
            </p>
          </div>
          <ul>
            <li><IcoCheck /> Corrections avec règle et distracteurs expliqués</li>
            <li><IcoCheck /> Supports écrits et audio variés</li>
            <li><IcoCheck /> Progression par statut : réussi, à revoir, à faire</li>
          </ul>
        </div>
      </section>

      <section className="landing-final" aria-labelledby="final-title">
        <div>
          <p className="landing-kicker">Prêt à travailler</p>
          <h2 id="final-title">Commencez par une session courte</h2>
          <p>Créez un compte, choisissez une compétence, puis revenez à vos erreurs quand vous voulez.</p>
        </div>
        <Link className="landing-btn landing-btn--primary" to="/auth?mode=register">Commencer gratuitement <IcoArrow /></Link>
      </section>
    </div>
  );
};

export default Home;
