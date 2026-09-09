import type { TraceNode, TraceRef, TraceSource, TraceStep } from '../types';

export function node(
  step: TraceStep,
  nodeId: string,
  input: {
    inputs?: TraceRef[];
    output: unknown;
    rule_id: string | null;
    source: TraceSource;
    reason: string;
    children?: TraceNode[];
  },
): TraceNode {
  return {
    step,
    node_id: nodeId,
    inputs: input.inputs ?? [],
    output: input.output,
    rule_id: input.rule_id,
    source: input.source,
    reason: input.reason,
    children: input.children,
  };
}

export function walkTrace(
  root: TraceNode,
  visit: (item: TraceNode) => void,
): void {
  visit(root);
  for (const child of root.children ?? []) walkTrace(child, visit);
}

export function indexTrace(root: TraceNode): Map<string, TraceNode> {
  const map = new Map<string, TraceNode>();
  walkTrace(root, (item) => {
    map.set(item.node_id, item);
  });
  return map;
}

export function collectNodeIds(root: TraceNode): string[] {
  const ids: string[] = [];
  walkTrace(root, (item) => ids.push(item.node_id));
  return ids;
}
