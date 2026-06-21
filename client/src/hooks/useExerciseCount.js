import { useState, useEffect } from 'react';
import axios from 'axios';

let cachedCount = null;
let fetchPromise = null;

export function useExerciseCount() {
  const [count, setCount] = useState(cachedCount);
  const [loading, setLoading] = useState(cachedCount === null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cachedCount !== null) return;

    if (!fetchPromise) {
      fetchPromise = axios.get('/api/exercises/count')
        .then(r => { cachedCount = r.data.total; return cachedCount; })
        .catch(() => { fetchPromise = null; throw new Error(); });
    }

    let mounted = true;
    fetchPromise
      .then(total => { if (mounted) { setCount(total); setLoading(false); } })
      .catch(() => { if (mounted) { setError(true); setLoading(false); } });

    return () => { mounted = false; };
  }, []);

  return { count, loading, error };
}
