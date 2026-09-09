import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IkigaiDefinition } from './types';
import { ENABLED_RULE_IDS, DISABLED_RULE_IDS } from './types';

export function definitionFilePath(): string {
  return join(__dirname, '..', 'definitions', 'ikigai-v0.1.json');
}

export function loadDefinition(): IkigaiDefinition {
  const raw = readFileSync(definitionFilePath(), 'utf8');
  return JSON.parse(raw) as IkigaiDefinition;
}

export function validateDefinition(definition: IkigaiDefinition): string[] {
  const errors: string[] = [];
  const blob = JSON.stringify(definition);
  if (blob.includes('TODO_RAFA') || blob.includes('FIXME')) {
    errors.push('definition contains placeholders');
  }
  if (definition.definitionId !== 'ikigai-v0.1') {
    errors.push('definitionId must be ikigai-v0.1');
  }
  if (definition.fields.length !== 4) errors.push('expected 4 fields');
  if (definition.criteria.length !== 6) errors.push('expected 6 criteria');
  const ruleIds = definition.rules.map((r) => r.id);
  for (const id of ENABLED_RULE_IDS) {
    const rule = definition.rules.find((r) => r.id === id);
    if (!rule) errors.push(`missing rule ${id}`);
    else if (!rule.enabled) errors.push(`${id} must be enabled`);
    else if (!rule.copy.trim()) errors.push(`${id} missing copy`);
  }
  for (const id of DISABLED_RULE_IDS) {
    const rule = definition.rules.find((r) => r.id === id);
    if (!rule) errors.push(`missing rule ${id}`);
    else if (rule.enabled) errors.push(`${id} must be disabled`);
  }
  if (ruleIds.length !== ENABLED_RULE_IDS.length + DISABLED_RULE_IDS.length) {
    errors.push('unexpected extra rules');
  }
  return errors;
}
