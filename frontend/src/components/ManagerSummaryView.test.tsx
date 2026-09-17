import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ManagerSummaryView } from './ManagerSummaryView';
import { api } from '../api/client';
import type { Identity, Survey, SurveySummary } from '../api/types';

vi.mock('../api/client', () => ({
  api: {
    getActiveSurvey: vi.fn(),
    getSurveySummary: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

const identity: Identity = {
  userId: 'manager-1',
  userName: 'Ava Manager',
  role: 'manager',
  organizationId: 'org-1',
  organizationName: 'Acme Co',
};

const survey: Survey = {
  id: 'survey-1',
  title: 'Weekly Pulse',
  isActive: true,
  questions: [
    { id: 'q1', text: 'How was your week?', type: 'rating', orderIndex: 0 },
    { id: 'q2', text: 'Did you feel supported?', type: 'yes_no', orderIndex: 1 },
  ],
};

const summary: SurveySummary = {
  surveyId: 'survey-1',
  windowStart: '2026-09-10T00:00:00.000Z',
  windowEnd: '2026-09-17T00:00:00.000Z',
  completionCount: 2,
  organizationMemberCount: 4,
  completionRate: 0.5,
  questionRollups: [
    { questionId: 'q1', text: 'How was your week?', rollup: { type: 'rating', average: 4.5, count: 2 } },
    { questionId: 'q2', text: 'Did you feel supported?', rollup: { type: 'yes_no', yesCount: 1, noCount: 1 } },
  ],
};

describe('ManagerSummaryView', () => {
  beforeEach(() => {
    vi.mocked(api.getActiveSurvey).mockResolvedValue(survey);
    vi.mocked(api.getSurveySummary).mockResolvedValue(summary);
  });

  it('renders completion rate and per-question rollups', async () => {
    render(<ManagerSummaryView identity={identity} />);

    expect(await screen.findByText(/weekly pulse — weekly summary/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/average 4\.5 \/ 5 \(2 responses\)/i)).toBeInTheDocument();
    expect(screen.getByText(/yes: 1 · no: 1/i)).toBeInTheDocument();
  });
});
