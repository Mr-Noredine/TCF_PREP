export const STATUS = {
  TODO: 'a-faire',
  DONE: 'reussi',
  REVIEW: 'a-revoir',
};

export function getExerciseBestScore(exercise) {
  const raw = exercise?.best_score ?? exercise?.last_score ?? exercise?.bestScore ?? null;
  if (raw === null || raw === undefined || raw === '') return null;
  const score = Number(raw);
  return Number.isFinite(score) ? score : null;
}

export function getExerciseStatus(exercise) {
  const score = getExerciseBestScore(exercise);
  if (score === null) return STATUS.TODO;
  return score >= 70 ? STATUS.DONE : STATUS.REVIEW;
}

export function summarizeExercises(exercises = []) {
  const summary = {
    total: exercises.length,
    attempted: 0,
    done: 0,
    review: 0,
    todo: 0,
    averageScore: 0,
  };

  let scoreSum = 0;
  let scoredCount = 0;

  exercises.forEach(exercise => {
    const status = getExerciseStatus(exercise);
    const score = getExerciseBestScore(exercise);

    if (status === STATUS.DONE) summary.done += 1;
    else if (status === STATUS.REVIEW) summary.review += 1;
    else summary.todo += 1;

    if (score !== null) {
      summary.attempted += 1;
      scoreSum += score;
      scoredCount += 1;
    }
  });

  summary.averageScore = scoredCount > 0 ? scoreSum / scoredCount : 0;
  return summary;
}

export function summarizeByCategoryLevel(exercises = []) {
  const groups = new Map();

  exercises.forEach(exercise => {
    const key = `${exercise.category_slug || 'unknown'}::${exercise.level || ''}`;
    if (!groups.has(key)) {
      groups.set(key, {
        category_name: exercise.category_name,
        category_slug: exercise.category_slug,
        icon_color: exercise.icon_color,
        level: exercise.level,
        total_exercises: 0,
        completed_exercises: 0,
        average_score: 0,
        done: 0,
        review: 0,
        todo: 0,
      });
    }

    const group = groups.get(key);
    const status = getExerciseStatus(exercise);
    const score = getExerciseBestScore(exercise);

    group.total_exercises += 1;
    if (status === STATUS.DONE) group.done += 1;
    else if (status === STATUS.REVIEW) group.review += 1;
    else group.todo += 1;

    if (score !== null) {
      group.completed_exercises += 1;
      group.average_score += score;
    }
  });

  return Array.from(groups.values()).map(group => ({
    ...group,
    average_score: group.completed_exercises > 0
      ? group.average_score / group.completed_exercises
      : 0,
  }));
}
