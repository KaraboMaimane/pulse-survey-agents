import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Identity, Survey, SurveySummary } from '../api/types';

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
    return <p role="alert">{error}</p>;
  }

  if (!survey || !summary) {
    return <p>Loading summary…</p>;
  }

  return (
    <div>
      <h2>{survey.title} — weekly summary</h2>
      <p>
        Window: {formatDate(summary.windowStart)} – {formatDate(summary.windowEnd)}
      </p>
      <p>
        <strong>{summary.completionCount}</strong> of <strong>{summary.organizationMemberCount}</strong> members
        responded (<strong>{Math.round(summary.completionRate * 100)}%</strong> completion rate)
      </p>

      <table>
        <thead>
          <tr>
            <th>Question</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {summary.questionRollups.map((entry) => (
            <tr key={entry.questionId}>
              <td>{entry.text}</td>
              <td>
                {entry.rollup.type === 'rating' ? (
                  <span>
                    Average {entry.rollup.average.toFixed(1)} / 5 ({entry.rollup.count} responses)
                  </span>
                ) : (
                  <span>
                    Yes: {entry.rollup.yesCount} · No: {entry.rollup.noCount}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString();
}
