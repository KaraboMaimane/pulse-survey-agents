import type { AnswerInput, ApiErrorBody, Identity, Survey, SurveySummary } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface AuthContext {
  userId: string;
  organizationId: string;
}

async function request<T>(path: string, auth: AuthContext | null, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    headers['X-User-Id'] = auth.userId;
    headers['X-Org-Id'] = auth.organizationId;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : (body?.message ?? response.statusText);
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  listIdentities: (): Promise<Identity[]> => request('/auth/identities', null),

  getActiveSurvey: (auth: AuthContext): Promise<Survey> => request('/surveys/active', auth),

  submitResponse: (auth: AuthContext, surveyId: string, answers: AnswerInput[]): Promise<void> =>
    request(`/surveys/${surveyId}/responses`, auth, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  getSurveySummary: (auth: AuthContext, surveyId: string): Promise<SurveySummary> =>
    request(`/surveys/${surveyId}/summary`, auth),
};
