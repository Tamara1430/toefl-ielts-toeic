interface McqLike {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

/** Shuffles each question's answer options (and remaps correctIndex) so a
 * reused bank question still feels fresh — the correct answer isn't always
 * in the same position. */
export function shuffleQuestionOptions<T extends McqLike>(questions: T[]): T[] {
  return questions.map((q) => {
    const indices = q.options.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const newOptions = indices.map((i) => q.options[i]);
    const newCorrectIndex = indices.indexOf(q.correctIndex);
    return { ...q, options: newOptions, correctIndex: newCorrectIndex };
  });
}
