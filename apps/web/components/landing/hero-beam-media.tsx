'use client';

import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import {
  MOTION_DURATION,
  MOTION_EASE,
  heroMediaTransition,
} from '@/components/motion/tokens';
import { LANDING_IMAGES, LANDING_VIDEO } from '@/lib/assets';

/** Cut at peak beam, before the clip fades back to darkness. */
const BEAM_CUTOFF_S = 2.05;
/** Hold the paused peak frame, then soft-crossfade to the crisp still. */
const HANDOFF_HOLD_MS = 280;
const HANDOFF_FADE_MS = 700;

/**
 * Skip replaying when the user soft-navigates back to `/` in the same SPA lifetime.
 * A full refresh resets this and plays the beam again.
 */
let beamPlayedThisDocument = false;

function prefersDataSaver(): boolean {
  if (typeof navigator === 'undefined') return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData);
}

function waitForIntro(): Promise<void> {
  return new Promise((resolve) => {
    if (document.documentElement.getAttribute('data-mk-intro') !== '1') {
      resolve();
      return;
    }
    const done = () => {
      observer.disconnect();
      window.clearTimeout(safety);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (document.documentElement.getAttribute('data-mk-intro') !== '1') done();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mk-intro'],
    });
    const safety = window.setTimeout(done, 1600);
  });
}

/**
 * Homepage signature: play the beam once, hold the peak frame, then hand off
 * to the high-res JPEG (same face mid as the video — no lateral jump).
 */
export function HeroBeamMedia() {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);

  /** Video layer over the stills; fades out after handoff. */
  const [videoOpacity, setVideoOpacity] = useState(0);
  /** Lit still on top of dark once the peak is reached / motion skipped. */
  const [showLitStill, setShowLitStill] = useState(
    () => Boolean(reduced) || beamPlayedThisDocument,
  );

  const mx = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 24, mass: 0.55 });

  useEffect(() => {
    if (reduced || prefersDataSaver() || beamPlayedThisDocument) {
      setVideoOpacity(0);
      setShowLitStill(true);
      return;
    }

    const id = ++runId.current;
    let cutTimer: number | undefined;
    let handoffTimer: number | undefined;

    const freezeAtCutoff = () => {
      if (runId.current !== id) return;
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      try {
        if (Math.abs(v.currentTime - BEAM_CUTOFF_S) > 0.04) {
          v.currentTime = BEAM_CUTOFF_S;
        }
      } catch {
        /* ignore */
      }
      // Lit is already under the video (same crop). Reveal it, then fade video.
      setShowLitStill(true);
      beamPlayedThisDocument = true;
      handoffTimer = window.setTimeout(() => {
        if (runId.current !== id) return;
        setVideoOpacity(0);
      }, HANDOFF_HOLD_MS);
    };

    const onTimeUpdate = () => {
      const v = videoRef.current;
      if (!v || runId.current !== id) return;
      if (v.currentTime >= BEAM_CUTOFF_S) {
        v.removeEventListener('timeupdate', onTimeUpdate);
        freezeAtCutoff();
      }
    };

    const run = async () => {
      await waitForIntro();
      if (runId.current !== id) return;

      const v = videoRef.current;
      if (!v) return;

      v.muted = true;
      v.playsInline = true;
      v.playbackRate = 1;

      try {
        if (v.readyState < 2) {
          await new Promise<void>((resolve) => {
            const ready = () => {
              v.removeEventListener('canplay', ready);
              resolve();
            };
            v.addEventListener('canplay', ready, { once: true });
            v.load();
            window.setTimeout(resolve, 800);
          });
        }
        if (runId.current !== id) return;

        v.currentTime = 0;
        await v.play();
      } catch {
        setShowLitStill(true);
        return;
      }

      if (runId.current !== id) return;

      requestAnimationFrame(() => {
        if (runId.current !== id) return;
        setVideoOpacity(1);
      });

      v.addEventListener('timeupdate', onTimeUpdate);
      cutTimer = window.setTimeout(() => {
        if (runId.current !== id) return;
        const el = videoRef.current;
        if (!el || el.currentTime < BEAM_CUTOFF_S - 0.05) return;
        el.removeEventListener('timeupdate', onTimeUpdate);
        freezeAtCutoff();
      }, (BEAM_CUTOFF_S + 0.35) * 1000);
    };

    void run();

    return () => {
      runId.current += 1;
      if (cutTimer) window.clearTimeout(cutTimer);
      if (handoffTimer) window.clearTimeout(handoffTimer);
      const v = videoRef.current;
      if (v) {
        v.removeEventListener('timeupdate', onTimeUpdate);
        if (!beamPlayedThisDocument) v.pause();
      }
    };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mq.matches) return;
    const el = wrapRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 5);
    };
    const onLeave = () => mx.set(0);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [reduced, mx]);

  const fade = `opacity ${HANDOFF_FADE_MS}ms cubic-bezier(${MOTION_EASE.standard.join(',')})`;

  return (
    <div ref={wrapRef} className="ag-sticky-bg ag-hero-bg" style={{ backgroundColor: '#0e0e0e' }}>
      <motion.div
        className="ag-hero-bg__media"
        style={{ position: 'absolute', inset: 0, x: sx }}
        initial={reduced ? false : { scale: 1.03, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { ...heroMediaTransition, duration: MOTION_DURATION.heroMedia }}
      >
        {/* Both stills always mounted — no src swap flash at handoff. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.statueBeamDark}
          alt=""
          aria-hidden
          className="ag-hero-bg__beam"
          decoding="async"
          style={{ opacity: showLitStill ? 0 : 1 }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LANDING_IMAGES.statueBeamLit}
          alt="Estatua"
          className="ag-hero-bg__beam"
          fetchPriority="high"
          decoding="async"
          style={{ opacity: showLitStill ? 1 : 0 }}
        />

        <video
          ref={videoRef}
          className="ag-hero-bg__beam"
          src={LANDING_VIDEO.statueBeam}
          muted
          playsInline
          preload="auto"
          aria-hidden
          style={{
            opacity: videoOpacity,
            transition: fade,
          }}
        />
      </motion.div>
      <div className="ag-hero-bg__scrim" aria-hidden />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(to bottom, transparent, transparent, #0e0e0e)',
        }}
      />
    </div>
  );
}
