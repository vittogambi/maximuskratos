'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { AppIcon } from '@/components/app-icon';
import {
  MOTION_DISTANCE,
  MOTION_DURATION,
  MOTION_EASE,
  interactionChevronTransition,
} from '@/components/motion/tokens';

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
            transition={reduced ? { duration: 0 } : interactionChevronTransition}
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
        transition={
          reduced
            ? { duration: 0 }
            : {
                duration: MOTION_DURATION.interaction + 0.06,
                ease: MOTION_EASE.standard,
              }
        }
        style={{ overflow: 'hidden' }}
      >
        <motion.div
          initial={false}
          animate={
            reduced || isOpen
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: MOTION_DISTANCE.micro }
          }
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: MOTION_DURATION.interaction,
                  ease: MOTION_EASE.standard,
                }
          }
        >
          <div className="ag-faq-item__answer">
            {answer.split(/\n\n+/).map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex} className="ag-faq-item__answer-text font-body-md">
                {paragraph}
              </p>
            ))}
          </div>
          {link ? (
            <Link href={link.href} className="ag-inline-link font-label-md">
              {link.label}
              <AppIcon name="arrow-right" size={14} />
            </Link>
          ) : null}
        </motion.div>
      </motion.div>
    </article>
  );
}
