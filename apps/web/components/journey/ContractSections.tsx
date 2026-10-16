import { AppIcon } from '@/components/app-icon';
import type { AppIconName } from '@/components/icons/registry';
import styles from './RoadmapContract.module.css';

const ANCHORS = ['origen', 'identidad', 'direccion', 'relaciones', 'finanzas'];
const STANDARDS = new Set(['Trascendencia', 'Familia', 'Amistad', 'Trabajo significativo', 'Trabajo', 'Cualquier otro', 'Cualquier otro que usted desee', 'Estándar', 'Estándares']);
const FACTORS = new Set(['Apertura', 'Responsabilidad', 'Extraversión', 'Amabilidad', 'Sensibilidad emocional']);

type Item = {
  label: string;
  text: string;
  category?: string;
  descriptor?: string;
  commitment?: string;
  kind?: 'plan';
};

function lines(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

const PLAN_LEAD = /^Plan financiero integrado\. (Reestructuración|Calibración|Fluido)\.\s+([\s\S]+)$/;

function planReading(text: string): { band: string; steps: string[] } | null {
  const match = PLAN_LEAD.exec(text.trim());
  if (!match) return null;
  const steps = match[2].split(/(?<=\.)\s+/).map((step) => step.trim()).filter(Boolean);
  return steps.length ? { band: match[1], steps } : null;
}

function isPair(sectionIndex: number, row: Item): boolean {
  if (sectionIndex === 0) return STANDARDS.has(row.label);
  if (sectionIndex === 1) return FACTORS.has(row.label);
  return sectionIndex === 4 && row.kind !== 'plan';
}

function ContentRow({ row, sectionIndex }: { row: Item; sectionIndex: number }) {
  if (row.category && row.descriptor && row.commitment) {
    return (
      <article className={styles.relationship}>
        <header className={styles.relationshipHeader}>
          <h3 className={styles.subheading}>{row.label}</h3>
          <p className={styles.category}>{row.category}</p>
        </header>
        <p className={styles.descriptor}>{row.descriptor}</p>
        <p className={styles.commitment}>{row.commitment}</p>
      </article>
    );
  }

  if (row.kind === 'plan') {
    const plan = planReading(row.text);
    if (!plan) {
      return (
        <div className={styles.financialPlan}>
          <h3 className={styles.subheading}>{row.label}</h3>
          <p className={styles.copy}>{row.text}</p>
        </div>
      );
    }
    return (
      <div className={styles.financialPlan}>
        <header className={styles.relationshipHeader}>
          <h3 className={styles.subheading}>Plan financiero integrado</h3>
          <p className={styles.category}>{plan.band}</p>
        </header>
        <div className={styles.planSteps}>
          {plan.steps.map((step, index) => <p key={index}>{step}</p>)}
        </div>
      </div>
    );
  }

  const filled = lines(row.text);
  const values = sectionIndex === 0 && row.label.includes('valores fundamentales');
  const purpose = sectionIndex === 2 && row.label.includes('IKIGAI');

  return (
    <div className={styles.narrative}>
      {row.label ? <p className={styles.clause}>{row.label}</p> : null}
      {values && filled.length > 0 ? (
        <ul className={styles.values}>
          {filled.map((line, index) => <li key={index}>{line}</li>)}
        </ul>
      ) : filled.length > 0 ? (
        <div className={purpose ? styles.purpose : styles.response}>
          {filled.map((line, index) => <p key={index}>{line}</p>)}
        </div>
      ) : null}
    </div>
  );
}

export function ContractSections({ articles }: { articles: { title: string; items: Item[] }[] }) {
  return (
    <>
      {articles.map((section, sectionIndex) => {
        const blocks = [];
        for (let index = 0; index < section.items.length;) {
          const row = section.items[index];
          if (isPair(sectionIndex, row)) {
            const start = index;
            const pairs: Item[] = [];
            while (index < section.items.length && isPair(sectionIndex, section.items[index])) {
              pairs.push(section.items[index]);
              index += 1;
            }
            blocks.push(
              <dl className={styles.pairs} key={start}>
                {pairs.map((pair, pairIndex) => (
                  <div className={styles.pair} key={pairIndex}>
                    <dt>{pair.label}</dt>
                    <dd>{pair.text}</dd>
                  </div>
                ))}
              </dl>,
            );
          } else {
            blocks.push(<ContentRow key={index} row={row} sectionIndex={sectionIndex} />);
            index += 1;
          }
        }

        const icon = SHEET_ANCHORS[sectionIndex]?.icon;
        return (
          <section key={section.title} id={ANCHORS[sectionIndex]} aria-labelledby={`hdrp-heading-${sectionIndex}`} className={styles.chapter}>
            <h2 id={`hdrp-heading-${sectionIndex}`} className={styles.chapterTitle}>
              {icon ? <AppIcon name={icon} size={22} /> : null}
              <span>{section.title}</span>
            </h2>
            <div className={styles.flow}>{blocks}</div>
          </section>
        );
      })}
    </>
  );
}

export const SHEET_ANCHORS: { href: string; label: string; icon: AppIconName }[] = [
  { href: '#origen', label: 'Origen', icon: 'anchor' },
  { href: '#identidad', label: 'Identidad', icon: 'rubik' },
  { href: '#direccion', label: 'Dirección', icon: 'helm' },
  { href: '#relaciones', label: 'Relaciones', icon: 'handshake' },
  { href: '#finanzas', label: 'Finanzas', icon: 'wallet' },
  { href: '#ratificacion', label: 'Ratificación', icon: 'circle-check' },
];
