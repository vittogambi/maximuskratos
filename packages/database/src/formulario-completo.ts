import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';

/** Catálogo activo del Excel 260529 Formularios por paso. El archivo original llevaba el nombre del destinatario. */
export const FORMULARIO_COMPLETO_VERSION = 'formulario-completo@1';
/** Revisiones @1 a @6. Cada pregunta apunta a hoja y fila: `formulario-v1:HOJA!FILA`. */
export const FORMULARIO_COMPLETO_REF = 'formulario-completo';

type Option = { order: number; textEs: string; value: string };
type Item = {
  sourceRef: string;
  order: number;
  type: 'SCALE_1_5' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'FREE_TEXT';
  textEs: string;
  contextEs?: string | null;
  instrument: string;
  polarity: string;
  options: Option[];
  maxSelections?: number | null;
  allowedExceptions?: string[];
};
type ModuleDef = {
  slug: string;
  order: number;
  titleEs: string;
  introEs: string;
  formCode: string;
  questions: Item[];
};
type Catalog = {
  version: string;
  definitionRef: string;
  definitionSha256: string;
  modules: ModuleDef[];
};

function catalogPath(file: string): string {
  return join(__dirname, '../definitions', file);
}

export function loadFormularioCompleto(): Catalog {
  return JSON.parse(readFileSync(catalogPath('formulario-completo@1.json'), 'utf8')) as Catalog;
}

function loadRevision(): Catalog {
  return JSON.parse(readFileSync(catalogPath('formulario-completo@2.json'), 'utf8')) as Catalog;
}

function loadMissingRows(): Catalog {
  return JSON.parse(readFileSync(catalogPath('formulario-completo@3.json'), 'utf8')) as Catalog;
}

function loadActivityRevision(): Catalog {
  return JSON.parse(readFileSync(catalogPath('formulario-completo@4.json'), 'utf8')) as Catalog;
}

function loadFieldRevision(): Catalog {
  return JSON.parse(readFileSync(catalogPath('formulario-completo@5.json'), 'utf8')) as Catalog;
}

function loadPresentationRevision(): Catalog {
  return JSON.parse(readFileSync(catalogPath('formulario-completo@6.json'), 'utf8')) as Catalog;
}

function catalogRevision(version: string): number {
  const match = /@(\d+)$/.exec(version);
  return match ? Number(match[1]) : 0;
}

async function ensureCatalogVersion(prisma: PrismaClient, catalog: Catalog, versionName: string): Promise<void> {
  const existing = await prisma.diagnosticVersion.findUnique({ where: { version: versionName } });
  if (existing) {
    if (existing.definitionSha256 && existing.definitionSha256 !== catalog.definitionSha256) {
      const sessions = await prisma.diagnosticSession.count({ where: { versionId: existing.id } });
      if (sessions > 0) {
        throw new Error(`${versionName} ya existe con otra definición. No se reescriben preguntas con respuestas.`);
      }
      await prisma.answerOption.deleteMany({ where: { question: { module: { versionId: existing.id } } } });
      await prisma.question.deleteMany({ where: { module: { versionId: existing.id } } });
      await prisma.diagnosticModule.deleteMany({ where: { versionId: existing.id } });
      await prisma.diagnosticVersion.delete({ where: { id: existing.id } });
    } else {
      return;
    }
  }

  const version = await prisma.diagnosticVersion.create({
    data: {
      version: versionName,
      isActive: false,
      publishedAt: new Date(),
      definitionRef: FORMULARIO_COMPLETO_REF,
      definitionSha256: catalog.definitionSha256,
    },
  });

  for (const mod of catalog.modules) {
    const dbModule = await prisma.diagnosticModule.create({
      data: {
        versionId: version.id,
        phase: 'FASE1',
        dimensionKey: mod.formCode,
        slug: mod.slug,
        order: mod.order,
        titleEs: mod.titleEs,
        introEs: mod.introEs,
        outroTemplateEs: 'Así queda esta sección.',
        iconKey: 'columns',
        estimatedMinutes: 8,
        isConditional: false,
      },
    });
    for (const item of mod.questions) {
      const dbQuestion = await prisma.question.create({
        data: {
          moduleId: dbModule.id,
          order: item.order,
          type: item.type,
          textEs: item.textEs,
          contextEs: item.contextEs ?? null,
          sourceRef: item.sourceRef,
          instrument: item.instrument,
          polarity: item.polarity,
          maxSelections: item.maxSelections ?? null,
          allowedExceptions: item.allowedExceptions ?? [],
          scaleType: item.type === 'SCALE_1_5' ? 'BEHAVIORAL' : null,
        },
      });
      if (item.options.length) {
        await prisma.answerOption.createMany({
          data: item.options.map((opt) => ({
            questionId: dbQuestion.id,
            order: opt.order,
            textEs: opt.textEs,
            value: opt.value,
            scoreDeltas: {},
            flags: [],
            tags: [],
          })),
        });
      }
    }
  }
}

export async function ensureFormularioCompleto(prisma: PrismaClient): Promise<void> {
  await ensureCatalogVersion(prisma, loadFormularioCompleto(), FORMULARIO_COMPLETO_VERSION);
  await ensureCatalogVersion(prisma, loadRevision(), 'formulario-completo@2');
  await ensureCatalogVersion(prisma, loadMissingRows(), 'formulario-completo@3');
  await ensureCatalogVersion(prisma, loadActivityRevision(), 'formulario-completo@4');
  await ensureCatalogVersion(prisma, loadFieldRevision(), 'formulario-completo@5');
  await ensureCatalogVersion(prisma, loadPresentationRevision(), 'formulario-completo@6');
  await prisma.question.updateMany({
    where: { sourceRef: 'formulario-v1:F-RAD-001!R6', contextEs: '@numero:años:1:120' },
    data: { contextEs: '@fecha:nacimiento:1:120', textEs: 'Fecha de nacimiento' },
  });
  await prisma.question.updateMany({
    where: { sourceRef: { in: ['formulario-v1:F-RAD-001!R7', 'formulario-v1:F-RAD-001!R8'] } },
    data: { allowedExceptions: [] },
  });
  await prisma.question.updateMany({
    where: { sourceRef: 'formulario-v1:F-RAD-001!R9' },
    data: { allowedExceptions: ['UNKNOWN', 'DECLINED'] },
  });
  await ensurePartnerGate(prisma);
  await ensureOriginAlignmentScale(prisma);
  await prisma.diagnosticModule.updateMany({
    where: { slug: 'f-rad-003-proy', introEs: 'Proyección' },
    data: { introEs: '' },
  });
  await prisma.diagnosticModule.updateMany({
    where: { slug: 'e-per-dificultades' },
    data: {
      titleEs: 'Dificultades',
      introEs: 'Lo que niegas, te somete. Lo que aceptas, te transforma (Carl Jung). Identificar patrones específicos de conducta, pensamiento y emoción que evita reconocer en su vida cotidiana, revelando la forma concreta que adopta su Sombra, con el fin de recuperar energía psíquica y reducir interferencias en la construcción de identidad y hábitos. La Sombra evoca eso que está oculto dentro de nosotros, y por ende, parte integral de lo que somos.',
    },
  });
  await prisma.diagnosticModule.updateMany({
    where: { slug: 'e-per-origen' },
    data: { introEs: 'Mis antepasados habitan en mí' },
  });
  const profileIntros: Record<string, string> = {
    'e-per-vision': 'Lo que me gustaría llegar a ser. Tu visión es la imagen de la persona que deseas llegar a ser: el yo ideal. Defina su dirección vital y el tipo de hombre que quiere encarnar en el futuro. El Timón evoca el sentido de orientación, de cambio de curso.',
    'e-per-valores': 'Los principios que me guían. Los valores son los pilares que guían nuestras decisiones. Identifíquelos para actuar con coherencia frente a su visión. Los Pilares evocan el sentido de estructura soportante de todo lo que hacemos.',
    'e-per-estandares': 'La identidad se construye sobre la base de los estándares, no de la motivación. Los estándares son sus reglas personales. Traducen sus valores en acciones concretas y hábitos diarios. La Corona de Laurel evoca la excelencia en todo lo que hacemos.',
    'e-per-identidad': 'Diga el débil, fuerte soy (Joel 3:10). Definir, clarificar y tensionar la identidad actual del cliente versus la identidad aspiracional que declara querer encarnar, identificando las brechas críticas entre discurso, hábitos y estándares personales, con el fin de establecer una base sólida para la transformación personal sostenida en el tiempo. El Cubo 3D evoca la coherencia entre nuestras dimensiones, lo que pensamos vs lo que hacemos.',
    'e-per-personalidad':
      'Factores de la personalidad (E-PER-007). Radiografía en el modelo OCEAN (Big Five) para alinear tu propósito con tus tendencias naturales, potenciar fortalezas y anticipar autosabotajes. El Humano evoca la materia prima, la esencia de lo que somos, la base a transformar.',
  };
  for (const [slug, introEs] of Object.entries(profileIntros)) {
    await prisma.diagnosticModule.updateMany({ where: { slug }, data: { introEs } });
  }
  const versions = await prisma.diagnosticVersion.findMany({ where: { definitionRef: FORMULARIO_COMPLETO_REF } });
  const active = [...versions].sort((left, right) => catalogRevision(left.version) - catalogRevision(right.version)).at(-1);
  if (!active) return;
  await prisma.diagnosticVersion.updateMany({ data: { isActive: false } });
  await prisma.diagnosticVersion.update({ where: { id: active.id }, data: { isActive: true } });
}

const PARTNER_INTRO = 'Si no hay pareja ahora, puedes responder por la última relación. Si no tienes ni has tenido, esta parte se salta.';
const PARTNER_GATE_REF = 'mk:f-rad-002-pareja-puerta';
const PARTNER_NEVER = 'No tengo ni he tenido pareja';

const ORIGIN_ALIGNMENT_REF = 'formulario-v1:E-PER-000!R10';

async function ensureOriginAlignmentScale(prisma: PrismaClient): Promise<void> {
  const questions = await prisma.question.findMany({ where: { sourceRef: ORIGIN_ALIGNMENT_REF } });
  for (const question of questions) {
    if (question.type !== 'SCALE_1_5' || question.scaleType !== 'BEHAVIORAL') {
      await prisma.question.update({
        where: { id: question.id },
        data: { type: 'SCALE_1_5', scaleType: 'BEHAVIORAL' },
      });
    }
    const options = await prisma.answerOption.count({ where: { questionId: question.id } });
    if (options > 0) continue;
    await prisma.answerOption.createMany({
      data: [1, 2, 3, 4, 5].map((value, index) => ({
        questionId: question.id,
        order: index + 1,
        textEs: String(value),
        value: String(value),
        scoreDeltas: {},
        flags: [],
        tags: [],
      })),
    });
  }
}

async function ensurePartnerGate(prisma: PrismaClient): Promise<void> {
  const modules = await prisma.diagnosticModule.findMany({ where: { slug: 'f-rad-002-s1' } });
  for (const mod of modules) {
    if (mod.introEs !== PARTNER_INTRO) {
      await prisma.diagnosticModule.update({ where: { id: mod.id }, data: { introEs: PARTNER_INTRO } });
    }
    const gate = await prisma.question.findFirst({ where: { moduleId: mod.id, sourceRef: PARTNER_GATE_REF } });
    if (!gate) {
      await prisma.question.create({
        data: {
          moduleId: mod.id,
          order: 0,
          type: 'SINGLE_CHOICE',
          textEs: '¿Sobre qué relación respondes esta parte?',
          contextEs: null,
          sourceRef: PARTNER_GATE_REF,
          instrument: 'relations',
          polarity: 'DIRECT',
          allowedExceptions: [],
          options: {
            create: [
              'Tengo pareja ahora',
              'No tengo pareja ahora. Respondo por la última relación',
              PARTNER_NEVER,
            ].map((text, index) => ({
              order: index + 1,
              textEs: text,
              value: text,
              scoreDeltas: {},
              flags: [],
              tags: [],
            })),
          },
        },
      });
    }
    const scales = await prisma.question.findMany({
      where: { moduleId: mod.id, type: 'SCALE_1_5' },
    });
    const follow = `@sigue:0:!${PARTNER_NEVER}`;
    for (const scale of scales) {
      if (scale.contextEs?.includes('@sigue:0:')) continue;
      await prisma.question.update({
        where: { id: scale.id },
        data: { contextEs: scale.contextEs ? `${scale.contextEs}|${follow}` : follow },
      });
    }
  }
}
