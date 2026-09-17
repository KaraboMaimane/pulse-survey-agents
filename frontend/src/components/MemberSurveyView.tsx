import { useEffect, useState } from 'react';
import { CheckCircle2, MessageCircleQuestion, Star } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { AnswerInput, Identity, Survey } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

const RATING_COLORS: Record<(typeof RATING_VALUES)[number], string> = {
  1: 'border-rose-300 bg-rose-50 text-rose-700 has-[[data-checked]]:bg-rose-500 has-[[data-checked]]:text-white has-[[data-checked]]:border-rose-500 dark:bg-rose-500/10 dark:text-rose-300',
  2: 'border-orange-300 bg-orange-50 text-orange-700 has-[[data-checked]]:bg-orange-500 has-[[data-checked]]:text-white has-[[data-checked]]:border-orange-500 dark:bg-orange-500/10 dark:text-orange-300',
  3: 'border-amber-300 bg-amber-50 text-amber-700 has-[[data-checked]]:bg-amber-500 has-[[data-checked]]:text-white has-[[data-checked]]:border-amber-500 dark:bg-amber-500/10 dark:text-amber-300',
  4: 'border-lime-300 bg-lime-50 text-lime-700 has-[[data-checked]]:bg-lime-500 has-[[data-checked]]:text-white has-[[data-checked]]:border-lime-500 dark:bg-lime-500/10 dark:text-lime-300',
  5: 'border-emerald-300 bg-emerald-50 text-emerald-700 has-[[data-checked]]:bg-emerald-500 has-[[data-checked]]:text-white has-[[data-checked]]:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300',
};

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
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400" />
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="size-8" />
          </div>
          <div>
            <p className="font-medium">Thanks for your response!</p>
            <p className="text-sm text-muted-foreground">It's been recorded for this week.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-400" />
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
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                {question.type === 'rating' ? (
                  <Star className="size-4 text-amber-500" />
                ) : (
                  <MessageCircleQuestion className="size-4 text-teal-500" />
                )}
                {question.text}
              </Label>
              {question.type === 'rating' ? (
                <RadioGroup
                  aria-label={question.text}
                  value={answers[question.id]?.ratingValue?.toString() ?? null}
                  onValueChange={(value) => setRatingAnswer(question.id, String(value))}
                  className="flex flex-row gap-2"
                >
                  {RATING_VALUES.map((value) => (
                    <Label
                      key={value}
                      className={cn(
                        'relative flex size-9 items-center justify-center rounded-full border font-medium transition-colors',
                        RATING_COLORS[value],
                      )}
                    >
                      <RadioGroupItem value={value.toString()} className="absolute inset-0 size-full aspect-auto cursor-pointer opacity-0" />
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
                  className="flex flex-row gap-2"
                >
                  <Label className="relative flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 font-medium text-emerald-700 transition-colors has-[[data-checked]]:border-emerald-500 has-[[data-checked]]:bg-emerald-500 has-[[data-checked]]:text-white dark:bg-emerald-500/10 dark:text-emerald-300">
                    <RadioGroupItem value="yes" className="absolute inset-0 size-full aspect-auto cursor-pointer opacity-0" />
                    Yes
                  </Label>
                  <Label className="relative flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-4 py-1.5 font-medium text-rose-700 transition-colors has-[[data-checked]]:border-rose-500 has-[[data-checked]]:bg-rose-500 has-[[data-checked]]:text-white dark:bg-rose-500/10 dark:text-rose-300">
                    <RadioGroupItem value="no" className="absolute inset-0 size-full aspect-auto cursor-pointer opacity-0" />
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
          <Button
            type="submit"
            disabled={!allQuestionsAnswered || status === 'submitting'}
            className="bg-gradient-to-r from-primary to-fuchsia-500 hover:opacity-90"
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit response'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
