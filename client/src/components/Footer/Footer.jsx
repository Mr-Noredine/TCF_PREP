import { useState, useEffect } from 'react';
import axios from 'axios';

const Footer = () => {
  const [total, setTotal] = useState(null);

  useEffect(() => {
    axios.get('/api/exercises/count')
      .then(r => setTotal(r.data.total))
      .catch(() => {});
  }, []);

  return (
    <footer>
      <div className="footer-content">
        <span className="footer-wordmark">TCF Prep</span>
        <div className="author-block">
          <p>Créé par <strong>MOHAMMEDI Noureddine</strong></p>
        </div>
        <p className="footer-legal">
          Plateforme de préparation à l'examen TCF —{' '}
          {total !== null ? `${total} questions` : 'niveaux A1 à C2'}, 100&nbsp;% gratuit.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
