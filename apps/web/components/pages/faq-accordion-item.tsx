'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';

type FaqAccordionItemProps = {
  id: string;
  question: string;
  answer: string;
  link?: { href: string; label: string };
  isOpen: boolean;
  onToggle: () => void;
  reduced: boolean;
};

/** Acordeón FAQ compartido (landing, precios, etc.). */
export function FaqAccordionItem({
  id,
  question,
  answer,
  link,
  isOpen,
  onToggle,
  reduced,
}: FaqAccordionItemProps) {
  const answerId = `faq-answer-${id}`;

  return (
    <article className={`ag-faq-item${isOpen ? ' ag-faq-item--open' : ''}`}>
      <h3 className="ag-faq-item__heading" id={`faq-q-${id}`}>
        <button
          type="button"
          className="ag-faq-item__trigger"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={answerId}
        >
          <span className="ag-faq-item__question font-headline-sm">{question}</span>
          <motion.span
            className="ag-faq-item__chevron-wrap"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            aria-hidden
          >
            <AppIcon name="chevron-down" size={18} className="ag-faq-item__chevron" />
          </motion.span>
        </button>
      </h3>
      <motion.div
        id={answerId}
        className="ag-faq-item__answer-wrap"
        aria-labelledby={`faq-q-${id}`}
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          duration: reduced ? 0 : 0.32,
          ease: [0.2, 0.8, 0.2, 1],
        }}
        style={{ overflow: 'hidden' }}
      >
        <p className="ag-faq-item__answer-text font-body-md">{answer}</p>
        {link ? (
          <Link href={link.href} className="ag-inline-link font-label-md">
            {link.label}
            <AppIcon name="arrow-right" size={14} />
          </Link>
        ) : null}
      </motion.div>
    </article>
  );
}
