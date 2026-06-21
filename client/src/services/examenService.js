import axios from 'axios';

export const examenService = {
  createSession: (format) =>
    axios.post('/api/examens', { format }).then(r => r.data),

  getSession: (sessionId) =>
    axios.get(`/api/examens/${sessionId}`).then(r => r.data),

  submitAnswer: (sessionId, questionOrder, answerGiven) =>
    axios.post(`/api/examens/${sessionId}/reponse`, {
      question_order: questionOrder,
      answer_given:   answerGiven,
    }).then(r => r.data),

  terminerExamen: (sessionId) =>
    axios.post(`/api/examens/${sessionId}/terminer`).then(r => r.data),

  getResultats: (sessionId) =>
    axios.get(`/api/examens/${sessionId}/resultats`).then(r => r.data),

  getHistory: (limit = 5) =>
    axios.get('/api/examens/historique', { params: { limit } }).then(r => r.data),

  getLastLevel: () =>
    axios.get('/api/examens/last-level').then(r => r.data),
};
