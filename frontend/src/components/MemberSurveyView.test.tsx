import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemberSurveyView } from './MemberSurveyView';
import { api } from '../api/client';
import type { Identity, Survey } from '../api/types';

vi.mock('../api/client', () => ({
  api: {
    getActiveSurvey: vi.fn(),
    submitResponse: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

const identity: Identity = {
  userId: 'user-1',
  userName: 'Ben Member',
  role: 'member',
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

describe('MemberSurveyView', () => {
  beforeEach(() => {
    vi.mocked(api.getActiveSurvey).mockResolvedValue(survey);
    vi.mocked(api.submitResponse).mockResolvedValue(undefined);
  });

  it('submit button is disabled until every question is answered, then submits', async () => {
    const user = userEvent.setup();
    render(<MemberSurveyView identity={identity} />);

    await screen.findByText('Weekly Pulse');
    const submitButton = screen.getByRole('button', { name: /submit response/i });
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: '4' }));
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: 'Yes' }));
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    await waitFor(() => {
      expect(api.submitResponse).toHaveBeenCalledWith(
        { userId: 'user-1', organizationId: 'org-1' },
        'survey-1',
        expect.arrayContaining([
          { questionId: 'q1', ratingValue: 4 },
          { questionId: 'q2', yesNoValue: true },
        ]),
      );
    });

    expect(await screen.findByText(/thanks for your response/i)).toBeInTheDocument();
  });
});
