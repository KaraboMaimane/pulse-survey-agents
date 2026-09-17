import { useEffect, useState, type ReactNode } from 'react';
import { CalendarRange, CheckSquare, TrendingUp, Users } from 'lucide-react';
import { api, ApiError } from '../api/client';
import type { Identity, Survey, SurveySummary } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

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
        <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
          <TrendingUp className="size-4" />
          Weekly summary
        </p>
        <h2 className="text-xl font-semibold tracking-tight">{survey.title}</h2>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <CalendarRange className="size-3.5" />
          {formatDate(summary.windowStart)} – {formatDate(summary.windowEnd)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Responses"
          value={summary.completionCount.toString()}
          icon={<CheckSquare className="size-4" />}
          accent="from-sky-500 to-cyan-400"
        />
        <StatCard
          label="Org members"
          value={summary.organizationMemberCount.toString()}
          icon={<Users className="size-4" />}
          accent="from-violet-500 to-fuchsia-500"
        />
        <StatCard
          label="Completion rate"
          value={`${Math.round(summary.completionRate * 100)}%`}
          icon={<TrendingUp className="size-4" />}
          accent="from-emerald-500 to-teal-400"
        />
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
                  <TableCell>
                    {entry.rollup.type === 'rating' ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          {entry.rollup.average.toFixed(1)} / 5
                        </Badge>
                        <span className="text-sm text-muted-foreground">{entry.rollup.count} responses</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                          Yes: {entry.rollup.yesCount}
                        </Badge>
                        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                          No: {entry.rollup.noCount}
                        </Badge>
                      </div>
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

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card size="sm" className="overflow-hidden">
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${accent}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}
