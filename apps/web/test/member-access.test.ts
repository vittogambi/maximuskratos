import { describe, expect, it } from 'vitest';
import { continueHint } from '@/components/diagnostico/QuestionCard';
import type { MeResponse, QuestionDto } from '@/lib/api';
import { getPostAuthPath } from '@/lib/auth-redirect';
import { canUseMemberProduct, isMemberPreview } from '@/lib/member-access';

type Who = Pick<MeResponse, 'role' | 'onboardingStep' | 'access'>;

const founder: Who = {
  role: 'USER',
  onboardingStep: 'TERMS_PENDING',
  access: { canUseMemberProduct: false, isMemberPreview: false },
};
const reviewer: Who = {
  role: 'USER',
  onboardingStep: 'TERMS_PENDING',
  access: { canUseMemberProduct: true, isMemberPreview: true },
};

function question(type: QuestionDto['type']): QuestionDto {
  return {
    id: 'q',
    type,
    textEs: '¿Pregunta?',
    contextEs: null,
    maxSelections: null,
    scaleType: null,
    reasonPromptEs: null,
    reasonThreshold: null,
    options: [],
  };
}

describe('member access on the web', () => {
  it('only trusts the capability sent by /auth/me', () => {
    expect(canUseMemberProduct(reviewer)).toBe(true);
    expect(isMemberPreview(reviewer)).toBe(true);
    expect(canUseMemberProduct(founder)).toBe(false);
    expect(canUseMemberProduct(null)).toBe(false);
    expect(canUseMemberProduct({} as Who)).toBe(false);
  });

  it('routes members to the panel and admins to admin', () => {
    expect(getPostAuthPath({ ...founder, access: { canUseMemberProduct: true, isMemberPreview: false } })).toBe('/panel');
    expect(getPostAuthPath(founder)).toBe('/panel');
    expect(getPostAuthPath(reviewer)).toBe('/panel');
    expect(getPostAuthPath({ ...reviewer, onboardingStep: 'PROFILE_COMPLETE' })).toBe('/panel');
    expect(getPostAuthPath({ ...reviewer, role: 'ADMIN' })).toBe('/admin');
  });
});

describe('disabled Continuar explains itself', () => {
  it('names what is missing for each question type', () => {
    expect(continueHint(question('SCALE_1_5'))).toBe('Elige una opción para continuar.');
    expect(continueHint(question('SINGLE_CHOICE'))).toBe('Elige una opción para continuar.');
    expect(continueHint(question('MULTI_CHOICE'))).toBe('Elige al menos una opción para continuar.');
    expect(continueHint(question('FREE_TEXT'))).toBe('Escribe tu respuesta para continuar.');
  });
});
