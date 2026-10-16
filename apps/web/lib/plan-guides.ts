export function valueHelpTemplate(valueRef: string): string {
  return `Valor: ${valueRef}. Esta semana escribo la conducta. Excepción: ninguna.`;
}

/** Same rule as the server. A starter with brackets, or the untouched value sentence, is still an example. */
export function unfinishedHelp(note: string | null | undefined, valueRef: string | null | undefined): string | null {
  const text = note?.trim() ?? '';
  if (text.includes('[')) return 'El ejemplo todavía tiene huecos. Escribe el artefacto con tus palabras.';
  const value = valueRef?.trim();
  if (value && text === valueHelpTemplate(value)) {
    return 'Escribe qué cambia esta semana por ese valor. El ejemplo no se guarda solo.';
  }
  return null;
}

export type FormularioGuide = {
  id: string;
  title: string;
  whenUseful: string;
  steps: string[];
  artifactLabel: string;
  starter: string;
};

export const FORMULARIO_GUIDES: FormularioGuide[] = [
  {
    id: 'resultado',
    title: 'Convertir una intención en resultado',
    whenUseful: 'Cuando sabes que quieres avanzar y el resultado sigue siendo una frase amplia.',
    steps: ['Nombra a quién sirve.', 'Escribe el resultado observable.', 'Di qué queda fuera.'],
    artifactLabel: 'Entregable delimitado',
    starter: 'Ayudo a [persona] a lograr [resultado]. Queda fuera [renuncia].',
  },
  {
    id: 'prioridades',
    title: 'Elegir prioridades y renuncias',
    whenUseful: 'Cuando varias cosas parecen urgentes.',
    steps: ['Elige una.', 'Nombra lo que espera.', 'Escribe por qué.'],
    artifactLabel: 'Prioridad y renuncia',
    starter: 'Ahora: [prioridad]. Espera: [lo demás]. Razón: [motivo].',
  },
  {
    id: 'semana',
    title: 'Planificar una semana real',
    whenUseful: 'Cuando el tiempo existe en teoría y no en la agenda.',
    steps: ['Mira una ventana real.', 'Pon la acción ahí.', 'Protege lo que no se mueve.'],
    artifactLabel: 'Ventana de la semana',
    starter: 'Haré [acción] el [día], durante [minutos]. Protejo [límite].',
  },
  {
    id: 'friccion',
    title: 'Iniciar una tarea y reducir fricción',
    whenUseful: 'Cuando empiezas y te vas a otra cosa.',
    steps: ['Define la salida antes de abrir.', 'Quita una distracción.', 'Empieza por la primera frase.'],
    artifactLabel: 'Primera frase',
    starter: 'La primera frase es: [frase]. No abro [distracción] hasta terminarla.',
  },
  {
    id: 'aprender',
    title: 'Aprender una habilidad',
    whenUseful: 'Cuando el bloqueo es no saber hacer el paso.',
    steps: ['Mira un ejemplo.', 'Haz un intento corto.', 'Anota qué corregir.'],
    artifactLabel: 'Intento y corrección',
    starter: 'Intenté [qué]. El ejemplo muestra [qué]. Corrijo [qué].',
  },
  {
    id: 'estandar',
    title: 'Traducir un valor en estándar',
    whenUseful: 'Cuando un valor no cambia la semana.',
    steps: ['Elige el valor.', 'Escribe la conducta de esta semana.', 'Di la excepción, si la hay.'],
    artifactLabel: 'Estándar de la semana',
    starter: 'Valor: [valor]. Esta semana: [conducta]. Excepción: [ninguna o cuál].',
  },
  {
    id: 'conversacion',
    title: 'Preparar una conversación',
    whenUseful: 'Cuando hace falta un pedido concreto y seguro.',
    steps: ['Hecho.', 'Impacto.', 'Necesidad.', 'Pedido.'],
    artifactLabel: 'Guion',
    starter: 'Hecho: [hecho]. Impacto: [impacto]. Necesidad: [necesidad]. Pedido: [pedido].',
  },
  {
    id: 'dinero',
    title: 'Ordenar una decisión económica',
    whenUseful: 'Cuando hay que ver obligaciones antes de un proyecto.',
    steps: ['Lista lo esencial.', 'Separa lo que no decides ahora.', 'No propongas deuda ni inversión.'],
    artifactLabel: 'Lista para decidir',
    starter: 'Esencial: [qué]. No decido ahora: [qué]. Pregunta abierta: [cuál].',
  },
  {
    id: 'cuidado',
    title: 'Organizar un cuidado',
    whenUseful: 'Cuando hay un límite de salud y quieres seguir con algo compatible.',
    steps: ['Anota el límite.', 'Prepara qué preguntar.', 'Elige una tarea que no lo contradiga.'],
    artifactLabel: 'Preparación de consulta',
    starter: 'Límite: [cuál]. Preguntaré: [qué]. Mientras tanto haré: [tarea compatible].',
  },
  {
    id: 'hipotesis',
    title: 'Explorar una hipótesis',
    whenUseful: 'Cuando todavía no hay un propósito cerrado.',
    steps: ['Escribe la hipótesis.', 'Define una experiencia pequeña.', 'Di qué observarías.'],
    artifactLabel: 'Pregunta del experimento',
    starter: 'Hipótesis: [cuál]. Experiencia: [cuál]. Observaré: [qué].',
  },
  {
    id: 'revisar',
    title: 'Revisar y ajustar',
    whenUseful: 'Cuando ya hubo un intento y hay que decidir el siguiente.',
    steps: ['Qué ocurrió.', 'Qué cambió.', 'Qué harás ahora.'],
    artifactLabel: 'Ajuste',
    starter: 'Ocurrió: [qué]. Cambió: [qué]. Ahora: [mantener, reducir o sustituir].',
  },
];
