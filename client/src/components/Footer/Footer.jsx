import { useExerciseCount } from '../../hooks/useExerciseCount';

const Footer = () => {
  const { count, loading, error } = useExerciseCount();

  let countText;
  if (loading) countText = 'niveaux A1 à C2';
  else if (error) countText = '600+ questions';
  else countText = `${count} questions`;

  return (
    <footer>
      <div className="footer-content">
        <span className="footer-wordmark">TCF Prep</span>
        <div className="author-block">
          <p>Créé par <strong>MOHAMMEDI Noureddine</strong></p>
        </div>
        <p className="footer-legal">
          Plateforme de préparation à l'examen TCF — {countText}, 100&nbsp;% gratuit.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
