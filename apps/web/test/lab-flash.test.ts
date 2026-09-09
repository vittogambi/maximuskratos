import { afterEach, describe, expect, it } from 'vitest';
import { clearLabFlash, consumeLabFlash, setLabFlash, subscribeLabFlash } from '@/lib/lab-ui/flash';

afterEach(() => {
  clearLabFlash();
});

describe('lab flash', () => {
  it('stores a message and consumes it once', () => {
    setLabFlash('Cierre guardado');
    expect(consumeLabFlash()).toBe('Cierre guardado');
    expect(consumeLabFlash()).toBeNull();
  });

  it('keeps the message across a remount-style resubscribe', () => {
    const seen: Array<string | null> = [];
    const first = subscribeLabFlash((message) => {
      seen.push(message);
    });
    setLabFlash('Cierre guardado');
    first();

    let remount: string | null = 'unset';
    const second = subscribeLabFlash((message) => {
      remount = message;
    });
    expect(remount).toBe('Cierre guardado');
    second();
    expect(seen.at(-1)).toBe('Cierre guardado');
  });
});
