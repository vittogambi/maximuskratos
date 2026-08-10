# Manual device checklist (NOT VERIFIED in lab)

Playwright WebKit ≠ Safari iOS. Run this on real devices before calling Browser PASS final.

## Devices

1. iPhone (Safari) — recent iOS
2. Android phone (Chrome)

## For each device (≈5 min)

### Home `/`

- [ ] First visit: intro veil appears, then hero (dark → beam → lit)
- [ ] Soft navigate away and back: lit still stays, video does not replay
- [ ] `prefers-reduced-motion`: lit still immediately, no video
- [ ] No horizontal scroll on Home, Precios, Contacto
- [ ] Mobile nav opens/closes; focus not trapped after close
- [ ] Primary CTA reaches `/register`

### Precios `/precios`

- [ ] Plans load (not stuck on skeleton)
- [ ] Frequency selector works
- [ ] CTA to register works

### Auth

- [ ] Register → lands in panel (early access)
- [ ] Logout → login works
- [ ] Forgot password form submits without stack traces

### Network

- [ ] Enable Network Link Conditioner / Chrome slow 4G once: page never blank indefinitely; loading states visible

Record pass/fail + iOS/Android versions in QA_FINAL_REPORT follow-up.
