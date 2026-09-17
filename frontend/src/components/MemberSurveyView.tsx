import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { AnswerInput, Identity, Survey } from '../api/types';

export function MemberSurveyView({ identity }: { identity: Identity }) {
  const auth = { userId: identity.userId, organizationId: identity.organizationId };
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerInput>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getActiveSurvey(auth)
      .then(setSurvey)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Could not load the active survey'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.userId]);

  function setRatingAnswer(questionId: string, ratingValue: number): void {
    setAnswers((prev) => ({ ...prev, [questionId]: { questionId, ratingValue } }));
  }

  function setYesNoAnswer(questionId: string, yesNoValue: boolean): void {
    setAnswers((prev) => ({ ...prev, [questionId]: { questionId, yesNoValue } }));
  }

  async function handleSubmit(): Promise<void> {
    if (!survey) {
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      await api.submitResponse(auth, survey.id, Object.values(answers));
      setStatus('submitted');
    } catch (err) {
      setStatus('idle');
      setError(err instanceof ApiError ? err.message : 'Could not submit your response');
    }
  }

  if (error && !survey) {
    return <p role="alert">{error}</p>;
  }

  if (!survey) {
    return <p>Loading your survey…</p>;
  }

  const allQuestionsAnswered = survey.questions.every((question) => answers[question.id] !== undefined);

  if (status === 'submitted') {
    return (
      <div>
        <h2>{survey.title}</h2>
        <p>Thanks — your response has been recorded for this week.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>{survey.title}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        {survey.questions.map((question) => (
          <fieldset key={question.id}>
            <legend>{question.text}</legend>
            {question.type === 'rating' ? (
              <div role="radiogroup" aria-label={question.text}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <label key={value}>
                    <input
                      type="radio"
                      name={question.id}
                      value={value}
                      checked={answers[question.id]?.ratingValue === value}
                      onChange={() => setRatingAnswer(question.id, value)}
                    />
                    {value}
                  </label>
                ))}
              </div>
            ) : (
              <div role="radiogroup" aria-label={question.text}>
                <label>
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id]?.yesNoValue === true}
                    onChange={() => setYesNoAnswer(question.id, true)}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id]?.yesNoValue === false}
                    onChange={() => setYesNoAnswer(question.id, false)}
                  />
                  No
                </label>
              </div>
            )}
          </fieldset>
        ))}

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={!allQuestionsAnswered || status === 'submitting'}>
          {status === 'submitting' ? 'Submitting…' : 'Submit response'}
        </button>
      </form>
    </div>
  );
}
