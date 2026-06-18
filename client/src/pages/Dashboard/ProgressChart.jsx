import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const EmptyIco = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,.08)',
    }}>
      <p style={{ fontSize: '.72rem', fontWeight: 600, color: '#94A3B8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>
          {p.value}%
          <span style={{ fontSize: '.72rem', fontWeight: 500, color: '#475569', marginLeft: 4 }}>
            {p.payload.attempts} tentative{p.payload.attempts !== 1 ? 's' : ''}
          </span>
        </p>
      ))}
    </div>
  );
};

const ProgressChart = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="ds-chart-card">
        <div className="ds-chart-card__header">
          <div>
            <p className="ds-chart-card__title">Progression sur 30 jours</p>
            <p className="ds-chart-card__sub">Évolution de votre score moyen</p>
          </div>
        </div>
        <div className="ds-empty" style={{ background: 'transparent', border: 'none', padding: '40px 0 20px' }}>
          <span className="ds-empty__ico"><EmptyIco /></span>
          <p className="ds-empty__title">Pas encore de données</p>
          <p className="ds-empty__text">Complétez des exercices pour voir votre courbe de progression ici.</p>
        </div>
      </div>
    );
  }

  const data = timeline.map(item => ({
    date:     new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    score:    Math.round(parseFloat(item.avg_score) || 0),
    attempts: parseInt(item.total_attempts) || 0,
  }));

  return (
    <div className="ds-chart-card">
      <div className="ds-chart-card__header">
        <div>
          <p className="ds-chart-card__title">Progression sur 30 jours</p>
          <p className="ds-chart-card__sub">Évolution de votre score moyen</p>
        </div>
      </div>
      <div className="ds-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              stroke="#94A3B8"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              stroke="#94A3B8"
              tick={{ fontSize: 11, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#4F46E5"
              strokeWidth={2.5}
              dot={{ fill: '#4F46E5', r: 3.5, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
              name="Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
