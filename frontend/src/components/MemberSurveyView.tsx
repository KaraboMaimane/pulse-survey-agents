import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { AnswerInput, Identity, Survey } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

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

  function setRatingAnswer(questionId: string, value: string): void {
    setAnswers((prev) => ({ ...prev, [questionId]: { questionId, ratingValue: Number(value) } }));
  }

  function setYesNoAnswer(questionId: string, value: string): void {
    setAnswers((prev) => ({ ...prev, [questionId]: { questionId, yesNoValue: value === 'yes' } }));
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
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn't load your survey</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!survey) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const allQuestionsAnswered = survey.questions.every((question) => answers[question.id] !== undefined);

  if (status === 'submitted') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <div>
            <p className="font-medium">Thanks for your response!</p>
            <p className="text-sm text-muted-foreground">It's been recorded for this week.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{survey.title}</CardTitle>
        <CardDescription>Answer every question below, then submit your response for this week.</CardDescription>
      </CardHeader>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <CardContent className="space-y-6">
          {survey.questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <Label className="text-sm font-medium">{question.text}</Label>
              {question.type === 'rating' ? (
                <RadioGroup
                  aria-label={question.text}
                  value={answers[question.id]?.ratingValue?.toString() ?? null}
                  onValueChange={(value) => setRatingAnswer(question.id, String(value))}
                  className="flex flex-row gap-4"
                >
                  {RATING_VALUES.map((value) => (
                    <Label key={value} className="flex items-center gap-1.5 font-normal">
                      <RadioGroupItem value={value.toString()} />
                      {value}
                    </Label>
                  ))}
                </RadioGroup>
              ) : (
                <RadioGroup
                  aria-label={question.text}
                  value={
                    answers[question.id]?.yesNoValue === undefined
                      ? null
                      : answers[question.id]?.yesNoValue
                        ? 'yes'
                        : 'no'
                  }
                  onValueChange={(value) => setYesNoAnswer(question.id, String(value))}
                  className="flex flex-row gap-4"
                >
                  <Label className="flex items-center gap-1.5 font-normal">
                    <RadioGroupItem value="yes" />
                    Yes
                  </Label>
                  <Label className="flex items-center gap-1.5 font-normal">
                    <RadioGroupItem value="no" />
                    No
                  </Label>
                </RadioGroup>
              )}
            </div>
          ))}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={!allQuestionsAnswered || status === 'submitting'}>
            {status === 'submitting' ? 'Submitting…' : 'Submit response'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
