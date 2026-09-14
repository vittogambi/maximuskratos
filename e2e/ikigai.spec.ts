import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const SHOT_DIR = 'tmp/ikigai-qa';
mkdirSync(SHOT_DIR, { recursive: true });

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: true });
}

async function startFresh(page: Page) {
  await page.goto('/ikigai/empezar', { waitUntil: 'networkidle' });
  const anew = page.getByRole('button', { name: 'Empezar de nuevo' });
  if (await anew.isVisible()) {
    await anew.click();
  } else {
    await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  }
  await page.waitForURL(/\/ikigai\/s\/[0-9a-f-]+/i, { timeout: 20_000 });
}

async function addItem(page: Page, value: string) {
  const area = page.locator('#ik-item-text');
  if (!(await area.isVisible())) {
    await page.getByRole('button', { name: 'Escribir una pieza', exact: true }).click();
  }
  await page.locator('#ik-item-text').fill(value);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
}

async function completeFourFields(page: Page) {
  await addItem(page, 'enseñar cosas que ya aprendí');
  await addItem(page, 'ordenar sistemas complicados');
  await addItem(page, 'entrenar');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await addItem(page, 'explicar temas difíciles de forma simple');
  await addItem(page, 'organizar equipos pequeños');
  await addItem(page, 'construir procesos');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await addItem(page, 'personas que están empezando y se sienten perdidas');
  await addItem(page, 'equipos donde todo depende de una sola persona');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await addItem(page, 'capacitación');
  await addItem(page, 'consultoría');
  await addItem(page, 'crear herramientas');
  await page.getByRole('button', { name: 'Continuar' }).click();
}

test.describe.configure({ mode: 'serial' });

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = 'nextjs-portal { display: none !important; pointer-events: none !important; }';
    document.documentElement.appendChild(style);
  });
});

test('landing CTA opens the player without a false purpose claim', async ({ page }) => {
  await page.goto('/ikigai', { waitUntil: 'networkidle' });
  await expect(page.getByText('Versión en revisión').first()).toBeVisible();
  await page.getByRole('link', { name: 'Empezar mi mapa' }).first().click();
  await page.waitForURL(/\/ikigai\/empezar/i, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Empieza por ordenar las piezas.' })).toBeVisible();
  await expect(page.getByText('Versión en revisión')).toBeVisible();
  await expect(page.getByText('Mi propósito es')).toHaveCount(0);
});

test('happy path builds a direction map', async ({ page }) => {
  await startFresh(page);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByRole('contentinfo')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: /actividades te hacen sentir interesado/i }),
  ).toBeVisible();
  // Empty lens invites instead of showing a blank form.
  await expect(page.getByText('Mis piezas')).toBeVisible();
  await expect(page.getByText('0 de 5')).toBeVisible();
  await expect(page.getByText('Todavía no hay piezas en este lente.')).toBeVisible();
  await expect(page.getByText('Empieza con algo tuyo o mira ideas para inspirarte.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Escribir una pieza', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver ideas', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Todavía no lo tengo claro' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Atrás' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Paso anterior' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  await expect(
    page.getByText('Para continuar, escribe una pieza o marca que todavía no lo tienes claro.'),
  ).toBeVisible();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await shot(page, '01-explorar');
  await addItem(page, 'pieza que luego borro');
  await expect(page.getByText('1 de 5')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  await page.getByRole('button', { name: /pieza que luego borro/ }).click();
  await page.getByRole('button', { name: 'Quitar' }).click();
  await expect(page.getByText('0 de 5')).toBeVisible();
  await completeFourFields(page);
  await expect(
    page.getByText('Toca las piezas que, para ti, parecen formar parte de una misma dirección.'),
  ).toBeVisible();
  // Nothing picked yet: one tray, one invitation, no repeated empty lines.
  await expect(page.getByText('Esta dirección')).toBeVisible();
  await expect(page.getByText('Toca piezas y aparecerán aquí.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ponerlo en palabras' })).toBeDisabled();
  await page.getByRole('button', { name: 'enseñar cosas que ya aprendí' }).click();
  await page.getByRole('button', { name: 'explicar temas difíciles de forma simple' }).click();
  await page.getByRole('button', { name: 'personas que están empezando y se sienten perdidas' }).click();
  await page.getByRole('button', { name: 'capacitación' }).click();
  // The picked pieces are visible as objects inside the tray.
  const tray = page.locator('.ik-tray');
  await expect(tray.locator('.ik-token')).toHaveCount(4);
  await expect(tray.getByText('enseñar cosas que ya aprendí')).toBeVisible();
  await shot(page, '03-relacionar');
  await page.getByRole('button', { name: 'Ponerlo en palabras' }).click();
  await expect(page.getByRole('heading', { name: /dirección aparece al unir estas piezas/i })).toBeVisible();
  await expect(page.locator('.ik-chosen .ik-token')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Atrás' })).toBeVisible();
  await expect(page.getByRole('button', { name: '← Volver', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar dirección', exact: true })).toBeDisabled();
  await expect(page.getByText('Versión en revisión')).toBeVisible();
  await expect(page.locator('#hyp-text')).toHaveValue('');
  await expect(page.locator('#hyp-text')).toHaveAttribute(
    'placeholder',
    'Una dirección que quiero explorar es…',
  );
  await expect(page.locator('#hyp-text')).not.toHaveValue(/Mi propósito/);
  await page.locator('#hyp-text').fill(
    'Ayudar a personas que están empezando a dominar herramientas complejas mediante formación práctica.',
  );
  await shot(page, '04-formular');
  await page.getByRole('button', { name: 'Guardar dirección', exact: true }).click();
  await expect(page.getByText('Piezas de esta dirección')).toBeVisible();
  await expect(page.getByText('enseñar cosas que ya aprendí')).toBeVisible();
  await expect(
    page.getByText(
      'En esta versión contrastas primero una dirección. Si escribiste más, quedan en el mapa.',
    ),
  ).toBeVisible();
  await shot(page, '05-elegir');
  await page.getByRole('button', { name: 'Contrastar esta dirección' }).click();
  // One direction, six angles: the hypothesis stays visible as the subject.
  await expect(page.getByText('La dirección que estás contrastando')).toBeVisible();
  await expect(page.getByRole('heading', { name: /sostener durante años/i })).toBeVisible();
  await expect(page.getByText(/Esta dirección utiliza actividades/)).toBeVisible();
  await expect(
    page.getByText(
      'En esta versión contrastas primero una dirección. Si escribiste más, quedan en el mapa.',
    ),
  ).toHaveCount(0);
  await expect(page.getByText('Elige una respuesta o prefiere no responder.')).toHaveCount(0);
  await shot(page, '06-contraste');
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Ver mi mapa' : 'Continuar' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Esto es lo que construiste.' })).toBeVisible();
  await expect(page.getByText('Las piezas que la forman')).toBeVisible();
  await expect(page.getByText('Según tus respuestas')).toBeVisible();
  await expect(page.locator('.ik-token')).toHaveCount(4);
  await expect(page.getByText('purpose_score')).toHaveCount(0);
  await expect(page.getByText(/hipótesis \d/i)).toHaveCount(0);
  await expect(page.locator('#exp-focus')).toHaveCount(0);
  await shot(page, '07-resultado');
  await page.getByRole('button', { name: 'Ponerla a prueba' }).click();
  await page.locator('#exp-focus').fill('Si realmente disfruto enseñar esto de forma sostenida');
  await page.getByRole('radio', { name: '30 días' }).click();
  await page.locator('#exp-action').fill('Dar cuatro sesiones piloto');
  await page.locator('#exp-signal').fill('Al menos tres personas quieren continuar y yo quiero repetirlo');
  await shot(page, '08-experimento');
  await page.getByRole('button', { name: 'Guardar experimento' }).click();
  await expect(page.getByText('Tu dirección sigue siendo una hipótesis.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Esto es lo que construiste.' })).toBeVisible();
  await expect(page.locator('#exp-focus')).toHaveValue('Si realmente disfruto enseñar esto de forma sostenida');
});

test('explore idea is personalized before it becomes an answer', async ({ page }) => {
  await startFresh(page);
  await page.getByRole('button', { name: 'Ver ideas' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Todas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Creación y expresión' })).toBeVisible();
  // Contextual overlay of the same lens: the step chrome stays visible above it.
  const panel = page.locator('.ik-sheet__panel--library');
  await expect(page.locator('.ik-sheet__context')).toHaveText('Lo que te mueve');
  await expect(page.getByText('Mis piezas')).toBeVisible();
  const listBox = await panel.boundingBox();
  expect(listBox?.y).toBeGreaterThan(100);
  expect(listBox?.width).toBeLessThanOrEqual(390);
  await shot(page, '02-banco');
  // List to detail happens inside the same sheet, which shrinks to its content.
  await page.getByRole('button', { name: 'Enseñar', exact: true }).click();
  await expect(panel).toHaveCount(1);
  await expect(page.getByRole('button', { name: '← Ideas', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar' })).toHaveCount(0);
  await expect(page.locator('.ik-sheet__context')).toHaveText('Lo que te mueve');
  const detailBox = await panel.boundingBox();
  expect(detailBox?.height).toBeLessThan(listBox?.height ?? 844);
  await expect(page.getByText(/Cómo aparece esto en tu vida/)).toBeVisible();
  await expect(page.getByText('Enseñarle a gente nueva lo que ya aprendí')).toHaveCount(0);
  await page.locator('#ik-adopt-text').fill('Enseñarle a gente nueva lo que ya aprendí');
  await page.getByRole('button', { name: 'Añadir a mis ideas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Omitir' })).toHaveCount(0);
  await expect(panel).toHaveCount(0);
  await expect(page.getByText('Enseñarle a gente nueva lo que ya aprendí')).toBeVisible();
  await expect(page.getByText('1 de 5')).toBeVisible();
});

test('no hypothesis still produces a valid map', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await page.getByRole('button', { name: 'Todavía no veo una dirección clara' }).click();
  await page.getByRole('button', { name: 'Ver mi mapa' }).click();
  await expect(page.getByRole('heading', { name: 'Esto es lo que recogiste.' })).toBeVisible();
  await expect(page.getByText('Las piezas que recogiste')).toBeVisible();
  await expect(page.getByText('purpose_score')).toHaveCount(0);
});

test('empty lenses collapse into one gap instead of repeating', async ({ page }) => {
  await startFresh(page);
  const unclear = page.getByRole('button', { name: 'Todavía no lo tengo claro' });
  await expect(unclear).toHaveAttribute('aria-pressed', 'false');
  await unclear.click();
  await expect(unclear).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('button', { name: 'Atrás' })).toBeVisible();
  await expect(page.getByRole('button', { name: '← Volver' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(
    page.getByRole('heading', { name: /actividades te hacen sentir interesado/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Atrás' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Continuar' }).click();
  for (let i = 1; i < 4; i += 1) {
    await page.getByRole('button', { name: 'Todavía no lo tengo claro' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
  }
  // Conectar without pieces: a single empty state, not one line per lens.
  await expect(page.getByText('Todavía no hay piezas para conectar. Vuelve a explorar y añade al menos una.')).toBeVisible();
  await expect(page.getByText('Todavía no está claro')).toHaveCount(0);
  await page.getByRole('button', { name: 'Todavía no veo una dirección clara' }).click();
  await page.getByRole('button', { name: 'Ver mi mapa' }).click();
  await expect(page.getByText('Todavía no hay piezas en el mapa.')).toBeVisible();
  await expect(page.getByText('No anotaste nada en')).toHaveCount(0);
  await expect(page.getByText('Todavía no aparece una hipótesis suficientemente clara.')).toBeVisible();
});

test('incomplete relationship can still become a hypothesis', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await page.getByRole('button', { name: 'enseñar cosas que ya aprendí' }).click();
  await page.getByRole('button', { name: 'explicar temas difíciles de forma simple' }).click();
  await expect(page.getByText('Todavía no están claros algunos lentes.')).toBeVisible();
  await expect(page.getByText('Sin piezas todavía:')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ponerlo en palabras' }).click();
  await page.locator('#hyp-text').fill('Enseñar a personas que están empezando, aunque el sustento todavía no esté claro.');
  await page.getByRole('button', { name: 'Guardar dirección', exact: true }).click();
  await page.getByRole('button', { name: 'Contrastar esta dirección' }).click();
  for (let i = 0; i < 6; i += 1) {
    if (i === 3) {
      await page.getByRole('button', { name: 'Prefiero no responder' }).click();
    } else {
      await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    }
    await page.getByRole('button', { name: i === 5 ? 'Ver mi mapa' : 'Continuar' }).click();
  }
  await expect(page.getByText('Esta dirección todavía no toca:')).toBeVisible();
  await expect(page.getByText('No lo sabemos todavía')).toBeVisible();
  await expect(page.getByText(/hipótesis \d/i)).toHaveCount(0);
  await expect(page.getByText('Según tus respuestas')).toBeVisible();
});

test('reopen creates another revision after edit', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await page.getByRole('button', { name: 'enseñar cosas que ya aprendí' }).click();
  await page.getByRole('button', { name: 'Ponerlo en palabras' }).click();
  await page.locator('#hyp-text').fill('Ayudar a personas que están empezando mediante formación práctica.');
  await page.getByRole('button', { name: 'Guardar dirección', exact: true }).click();
  await page.getByRole('button', { name: 'Contrastar esta dirección' }).click();
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Ver mi mapa' : 'Continuar' }).click();
  }
  await page.getByRole('button', { name: 'Volver a explorar' }).first().click();
  await page.getByRole('button', { name: 'Contrastar esta dirección' }).click();
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Ver mi mapa' : 'Continuar' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Esto es lo que construiste.' })).toBeVisible();
});

test('resume incomplete session from the same device', async ({ page }) => {
  await startFresh(page);
  await expect(
    page.getByRole('heading', { name: /actividades te hacen sentir interesado/i }),
  ).toBeVisible();
  await addItem(page, 'correr al amanecer');
  await page.waitForTimeout(1200);
  await page.goto('/ikigai/empezar');
  await expect(page.getByText('Ya tienes un mapa empezado')).toBeVisible();
  await shot(page, '00-inicio');
  const resume = page.getByRole('button', { name: 'Continuar donde quedé' });
  const box = await resume.boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  await resume.click();
  await expect(page.getByText('correr al amanecer')).toBeVisible();
});

test('exit confirms that progress is saved', async ({ page }) => {
  await startFresh(page);
  await page.getByRole('button', { name: 'Salir' }).click();
  await expect(page.getByRole('heading', { name: '¿Salir por ahora?' })).toBeVisible();
  await expect(page.getByText('Tu avance queda guardado y puedes continuar después.')).toBeVisible();
  await page.getByRole('button', { name: 'Seguir aquí' }).click();
  await expect(page.getByRole('heading', { name: /actividades te hacen sentir interesado/i })).toBeVisible();
  await page.getByRole('button', { name: 'Salir' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Salir' }).click({ force: true });
  await page.waitForURL(/\/ikigai\/empezar/i, { timeout: 20_000 });
  await expect(page.getByText('Ya tienes un mapa empezado')).toBeVisible();
});

test('idea library opens as a side pane on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await startFresh(page);
  await page.getByRole('button', { name: 'Ver ideas' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
  const panel = page.locator('.ik-sheet__panel--library');
  await panel.evaluate((node) => Promise.all(node.getAnimations().map((a) => a.finished)));
  const box = await panel.boundingBox();
  expect(box?.width).toBeGreaterThan(360);
  expect(box?.width).toBeLessThan(500);
  expect(box?.x).toBeGreaterThan(700);
  expect(box?.y).toBeLessThan(8);
  await expect(page.locator('.ik-sheet__context')).toHaveText('Lo que te mueve');
  await page.getByRole('button', { name: 'Todas' }).click();
  await expect(page.getByRole('button', { name: 'Creación y expresión' })).toBeVisible();
  await shot(page, '02-banco-desktop');
});
