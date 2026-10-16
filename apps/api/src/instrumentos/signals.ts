import { AUDIT_IDS, auditId } from './score';
import type { FormularioAnswer, FormularioSignal } from './types';

const PRODUCT = 'alertas-aud@1';

function rowOf(id: string): number | null {
  const match = /E-AUD-001!R(\d+)$/.exec(id);
  return match ? Number(match[1]) : null;
}

/** Native Excel rule, plus the versioned product adaptation for sections 4 and 5. */
export function auditSignals(answers: FormularioAnswer[]): FormularioSignal[] {
  const byId = new Map(answers.map((answer) => [answer.id, answer]));
  return AUDIT_IDS.map((id) => {
    const row = rowOf(id)!;
    const answer = byId.get(id);
    const value = answer && !answer.exception && typeof answer.value === 'number' ? answer.value : null;
    const native = row <= 20 ? 'equals 1' : row <= 30 ? 'less than or equal 2' : 'equals 2';
    const nativeFires = value == null ? null : row <= 20 ? value === 1 : row <= 30 ? value <= 2 : value === 2;
    const productFires = value == null ? null : row >= 37 ? value <= 2 : nativeFires;
    const fired = productFires === true;
    return {
      id: `alert:${id}`,
      questionId: id,
      status: value == null ? 'NOT_EVALUATED' : fired ? 'FIRED' : 'NOT_FIRED',
      ruleVersion: PRODUCT,
      nativeRule: native,
      productRule: row >= 37 ? 'less than or equal 2 (adaptation)' : native,
      message: fired ? 'Conviene revisar esta respuesta.' : null,
      nativeFires,
    } as FormularioSignal & { nativeFires: boolean | null };
  });
}

export function sleepAlert(choice: string | null, exception: boolean): FormularioSignal {
  const id = 'formulario-v1:F-RAD-001!R61';
  if (choice == null || exception) {
    return signal(id, 'NOT_EVALUATED', 'formula F61: choice < 6 or < 4', null);
  }
  const fired = choice === '< 6' || choice === '< 4';
  return signal(id, fired ? 'FIRED' : 'NOT_FIRED', 'formula F61 alerts under 6 hours. Cell C61 text says the opposite.', fired ? 'Conviene aclarar cómo descansas.' : null);
}

export function bodyFatAlert(percentUi: number | null): FormularioSignal {
  const id = 'formulario-v1:F-RAD-001!R10';
  if (percentUi == null) return signal(id, 'NOT_EVALUATED', 'F10 alerts when stored fraction is at least 0.20', null);
  const fraction = percentUi / 100;
  const fired = fraction >= 0.2;
  return signal(id, fired ? 'FIRED' : 'NOT_FIRED', 'UI percent divided by 100 before the Excel comparison', fired ? 'Conviene revisar este dato con quien te acompaña en salud.' : null);
}

function signal(questionId: string, status: FormularioSignal['status'], nativeRule: string, message: string | null): FormularioSignal {
  return {
    id: `alert:${questionId}`,
    questionId,
    status,
    ruleVersion: 'alertas-frad@1',
    nativeRule,
    productRule: nativeRule,
    message,
  };
}

export { auditId };
