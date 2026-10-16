export type ActivityGuide = {
  lead: string;
  prompt: string;
  helpLead: string;
  help: string[];
  examples: string[];
  close: string;
};

function bullets(block: string): string[] {
  return block
    .split('*')
    .map((item) => item.replace(/\s+/g, ' ').trim().replace(/[.…]+$/, ''))
    .filter((item) => item.length > 0 && !item.endsWith(':'));
}

/** The workbook packs the guide, the help and the examples into one cell. */
export function activityGuide(text: string | null | undefined): ActivityGuide | null {
  if (!text?.includes('Frase guía')) return null;
  const prompt = text.match(/Frase guía\s+[“"]([^”"]+)[”"]/)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
  if (!prompt) return null;
  const lead = text.split('Frase guía')[0]?.replace(/\s+/g, ' ').trim() ?? '';
  const helpBlock = text.split('Ayudas para responder')[1]?.split('Ejemplos')[0] ?? '';
  const exampleBlock = text.split('Ejemplos')[1]?.split('Frase final')[0] ?? '';
  const close = text.split('Frase final')[1]?.replace(/\s+/g, ' ').trim().replace(/[.…:]+$/, '') ?? '';
  const helpLead = /Piensa en actividades que/i.test(helpBlock)
    ? 'Piensa en actividades que:'
    : /Piensa en/i.test(helpBlock)
      ? 'Piensa en:'
      : '';
  return {
    lead,
    prompt,
    helpLead,
    help: bullets(helpBlock),
    examples: bullets(exampleBlock),
    close,
  };
}
