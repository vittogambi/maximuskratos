import { toAuthUserMessage, type AuthErrorContext } from './auth-errors';

/** Absolute API origin (Swagger, server-side). */
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Browser fetch base — same-origin proxy in local dev avoids CORS and ad-blockers on /register. */
function apiBaseUrl(): string {
  if (typeof window === 'undefined') return API_ORIGIN;
  if (API_ORIGIN.includes('localhost:') || API_ORIGIN.includes('127.0.0.1:')) {
    return '';
  }
  return API_ORIGIN;
}

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type MeResponse = AuthUser & {
  onboardingStep: string;
  createdAt: string;
  subscription: {
    status: string;
    trialEnd: string | null;
    currentPeriodEnd: string | null;
  } | null;
};

export type AdminUser = {
  id: string;
  email: string;
  role: string;
  onboardingStep: string;
  createdAt: string;
  subscriptionStatus: string | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
};

export type Lead = {
  id: string;
  email: string;
  name: string | null;
  message: string | null;
  source: string | null;
  createdAt: string;
};

export type AdminStats = {
  users: { total: number; last7Days: number };
  leads: { total: number; last7Days: number };
};

async function parseError(
  res: Response,
  context?: AuthErrorContext,
): Promise<string> {
  let raw = res.statusText || '';
  try {
    const body = await res.json();
    if (Array.isArray(body.message)) raw = body.message.join(', ');
    else if (typeof body.message === 'string') raw = body.message;
  } catch {
    /* ignore */
  }
  if (context) {
    return toAuthUserMessage(raw, res.status, context);
  }
  return raw || 'Request failed';
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function apiRegister(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res, 'register'));
  return res.json();
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await parseError(res, 'login'));
  return res.json();
}

export async function apiRefresh(): Promise<{ accessToken: string }> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiLogout(): Promise<void> {
  await fetch(`${apiBaseUrl()}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function apiMe(accessToken: string): Promise<MeResponse> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/auth/me`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiForgotPassword(email: string): Promise<{ success: boolean }> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiResetPassword(
  token: string,
  password: string,
): Promise<{ success: boolean }> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiCreateLead(data: {
  email: string;
  name?: string;
  message?: string;
  source?: string;
}): Promise<{ success: boolean; id: string }> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiAdminUsers(accessToken: string): Promise<AdminUser[]> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/admin/users`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiAdminLeads(accessToken: string): Promise<Lead[]> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/admin/leads`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiAdminStats(accessToken: string): Promise<AdminStats> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/admin/stats`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function downloadAdminLeadsCsv(accessToken: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/admin/leads?format=csv`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await parseError(res));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function getApiDocsUrl(): string {
  return `${API_ORIGIN}/api/v1/docs`;
}

export function getApiBaseUrl(): string {
  return apiBaseUrl() || API_ORIGIN;
}

// ─── Diagnostic ───────────────────────────────────────────────────────────────

export type AnswerOptionDto = {
  id: string;
  order: number;
  textEs: string;
  value: string;
};

export type QuestionDto = {
  id: string;
  type: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SCALE_1_5' | 'FREE_TEXT' | 'RANKING';
  textEs: string;
  contextEs: string | null;
  maxSelections: number | null;
  scaleType: 'BEHAVIORAL' | 'FREQUENCY' | null;
  reasonPromptEs: string | null;
  reasonThreshold: number | null;
  options: AnswerOptionDto[];
};

export type SessionStateDto = {
  phase: string;
  completionPct: number;
  currentModuleSlug: string | null;
  currentModuleTitle: string | null;
  currentModuleIntro: string | null;
  currentModuleIcon: string | null;
  moduleProgress: number;
  selfKnowledgePct: number;
  isModuleStart: boolean;
  currentQuestionIndex: number | null;
  moduleQuestionCount: number | null;
  showWelcomeScreen: boolean;
  currentModuleOrder: number | null;
  totalModules: number;
  currentModuleEstimatedMinutes: number | null;
};

export type ModuleProgressDto = {
  slug: string;
  titleEs: string;
  iconKey: string | null;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETE';
  estimatedMinutes: number;
  answeredQuestions: number;
  totalQuestions: number;
};

export type DiagnosticProgressDto = {
  completionPct: number;
  selfKnowledgePct: number;
  modules: ModuleProgressDto[];
} | null;

export type MasterProfileDto = {
  archetypePrimary: string;
  archetypeSecondary: string | null;
  scores: Record<string, number>;
  indices: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  potentials: string[];
  bottlenecks: string[];
  priorities: string[];
  segmentTags: string[];
  generatedAt: string;
} | null;

export type NextStep =
  | { type: 'question'; data: QuestionDto }
  | { type: 'module_outro'; data: { moduleSlug: string; titleEs: string; outroText: string } }
  | { type: 'phase_end'; data: { phase: string; completionPct: number; selfKnowledgePct: number } }
  | { type: 'diagnostic_complete'; data: { archetypePrimary: string; selfKnowledgePct: number } };

export type DiagnosticState = {
  sessionState: SessionStateDto;
  nextStep: NextStep;
};

export type SubmitResponsePayload = {
  questionId: string;
  selectedOptionIds?: string[];
  freeText?: string;
  rankingOrder?: string[];
  latencyMs?: number;
  editCount?: number;
};

export async function apiDiagnosticStart(accessToken: string): Promise<DiagnosticState> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/diagnostic/start`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiDiagnosticState(accessToken: string): Promise<DiagnosticState> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/diagnostic/state`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiDiagnosticSubmitResponse(
  accessToken: string,
  payload: SubmitResponsePayload,
): Promise<DiagnosticState> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/diagnostic/response`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiDiagnosticProfile(accessToken: string): Promise<MasterProfileDto> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/diagnostic/profile`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await parseError(res));
  // NestJS returns an empty body for null — res.json() would throw
  const text = await res.text();
  if (!text.trim()) return null;
  return JSON.parse(text) as MasterProfileDto;
}

export async function apiDiagnosticProgress(accessToken: string): Promise<DiagnosticProgressDto> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/diagnostic/progress`, {
    headers: authHeaders(accessToken),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiDiagnosticWelcomeSeen(
  accessToken: string,
): Promise<{ success: boolean }> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/diagnostic/welcome-seen`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function apiDiagnosticOutroSeen(
  accessToken: string,
  moduleSlug: string,
): Promise<{ success: boolean }> {
  const res = await fetch(`${apiBaseUrl()}/api/v1/diagnostic/outro-seen/${moduleSlug}`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}
