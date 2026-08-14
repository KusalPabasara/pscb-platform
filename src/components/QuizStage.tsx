import { useState } from 'react';
import type { Passage } from '../data/passages';
import type { E2TrialResult, QuizAnswer } from '../types';

export function QuizStage({ passage, onComplete }: {
  passage: Passage;
  onComplete: (answers: QuizAnswer[], noticed: E2TrialResult['noticed']) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [noticed, setNoticed] = useState<E2TrialResult['noticed'] | ''>('');
  const complete = passage.questions.every((question) => answers[question.id] !== undefined) && noticed !== '';

  function submit() {
    if (!complete || !noticed) return;
    onComplete(
      passage.questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id],
        correct: answers[question.id] === question.correctIndex,
      })),
      noticed,
    );
  }

  return (
    <section className="panel quiz-panel">
      <span className="step-label">Comprehension &amp; notice</span>
      <h1>Answer from memory</h1>
      <p className="lead">Do not return to the passage or use outside help.</p>
      {passage.questions.map((question, questionIndex) => (
        <fieldset className="quiz-question" key={question.id}>
          <legend>{questionIndex + 1}. {question.prompt}</legend>
          {question.choices.map((choice, choiceIndex) => (
            <label key={choice}>
              <input
                type="radio"
                name={question.id}
                checked={answers[question.id] === choiceIndex}
                onChange={() => setAnswers((current) => ({ ...current, [question.id]: choiceIndex }))}
              /> {choice}
            </label>
          ))}
        </fieldset>
      ))}
      <fieldset className="quiz-question">
        <legend>Did you notice anything unusual or changing about the words while reading?</legend>
        {(['yes', 'no', 'unsure'] as const).map((value) => (
          <label key={value}><input type="radio" name="noticed" checked={noticed === value} onChange={() => setNoticed(value)} /> {value[0].toUpperCase() + value.slice(1)}</label>
        ))}
      </fieldset>
      <button className="primary-button" disabled={!complete} onClick={submit}>Submit answers</button>
    </section>
  );
}
