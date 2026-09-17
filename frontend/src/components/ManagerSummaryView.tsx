import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Identity, Survey, SurveySummary } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export function ManagerSummaryView({ identity }: { identity: Identity }) {
  const auth = { userId: identity.userId, organizationId: identity.organizationId };
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getActiveSurvey(auth)
      .then(async (activeSurvey) => {
        setSurvey(activeSurvey);
        const surveySummary = await api.getSurveySummary(auth, activeSurvey.id);
        setSummary(surveySummary);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : 'Could not load the summary'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity.userId]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn't load the summary</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!survey || !summary) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Weekly summary</p>
        <h2 className="text-xl font-semibold tracking-tight">{survey.title}</h2>
        <p className="text-sm text-muted-foreground">
          Window: {formatDate(summary.windowStart)} – {formatDate(summary.windowEnd)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Responses" value={summary.completionCount.toString()} />
        <StatCard label="Org members" value={summary.organizationMemberCount.toString()} />
        <StatCard label="Completion rate" value={`${Math.round(summary.completionRate * 100)}%`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Per-question results</CardTitle>
          <CardDescription>Rollups for the current 7-day window.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.questionRollups.map((entry) => (
                <TableRow key={entry.questionId}>
                  <TableCell className="font-medium">{entry.text}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.rollup.type === 'rating' ? (
                      <span>
                        Average {entry.rollup.average.toFixed(1)} / 5 ({entry.rollup.count} responses)
                      </span>
                    ) : (
                      <span>
                        Yes: {entry.rollup.yesCount} · No: {entry.rollup.noCount}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}
