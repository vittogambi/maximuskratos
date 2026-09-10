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
    await page.getByRole('button', { name: 'Añadir', exact: true }).click();
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

test('landing CTA opens the player without a false purpose claim', async ({ page }) => {
  await page.goto('/ikigai', { waitUntil: 'networkidle' });
  await expect(page.getByText('Versión en revisión').first()).toBeVisible();
  await page.getByRole('link', { name: 'Construir mi mapa' }).first().click();
  await page.waitForURL(/\/ikigai\/empezar/i, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Construye una hipótesis de dirección.' })).toBeVisible();
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
  await shot(page, '01-explorar');
  await completeFourFields(page);
  await expect(
    page.getByText('Toca las piezas que, para ti, parecen formar parte de una misma dirección.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'enseñar cosas que ya aprendí' }).click();
  await page.getByRole('button', { name: 'explicar temas difíciles de forma simple' }).click();
  await page.getByRole('button', { name: 'personas que están empezando y se sienten perdidas' }).click();
  await page.getByRole('button', { name: 'capacitación' }).click();
  await shot(page, '03-relacionar');
  await page.getByRole('button', { name: 'Ponerlo en palabras' }).click();
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
  await page.getByRole('button', { name: 'Guardar' }).click();
  await shot(page, '05-elegir');
  await page.getByRole('button', { name: 'Contrastar esta dirección' }).click();
  await expect(page.getByRole('heading', { name: /sostener durante años/i })).toBeVisible();
  await shot(page, '06-contraste');
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('button', { name: 'De acuerdo', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Ver mi mapa' : 'Continuar' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Esto es lo que empieza a aparecer.' })).toBeVisible();
  await expect(page.getByText('Cómo se construye')).toBeVisible();
  await expect(page.getByText('purpose_score')).toHaveCount(0);
  await shot(page, '07-resultado');
  await page.locator('#exp-focus').fill('Si realmente disfruto enseñar esto de forma sostenida');
  await page.getByRole('button', { name: '30 días' }).click();
  await page.locator('#exp-action').fill('Dar cuatro sesiones piloto');
  await page.locator('#exp-signal').fill('Al menos tres personas quieren continuar y yo quiero repetirlo');
  await shot(page, '08-experimento');
  await page.getByRole('button', { name: 'Guardar experimento' }).click();
  await expect(page.getByText('Tu dirección sigue siendo una hipótesis.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Esto es lo que empieza a aparecer.' })).toBeVisible();
  await expect(page.locator('#exp-focus')).toHaveValue('Si realmente disfruto enseñar esto de forma sostenida');
});

test('explore idea is personalized before it becomes an answer', async ({ page }) => {
  await startFresh(page);
  await page.getByRole('button', { name: 'Explorar ideas' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Todas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Creación y expresión' })).toBeVisible();
  const panel = page.locator('.ik-sheet__panel--library');
  const box = await panel.boundingBox();
  expect(box?.y).toBeGreaterThan(40);
  expect(box?.width).toBeLessThanOrEqual(390);
  await shot(page, '02-banco');
  await page.getByRole('button', { name: 'Enseñar', exact: true }).click();
  await expect(page.getByText(/Cómo aparece esto en tu vida/)).toBeVisible();
  await expect(page.getByText('Enseñarle a gente nueva lo que ya aprendí')).toHaveCount(0);
  await page.locator('#ik-adopt-text').fill('Enseñarle a gente nueva lo que ya aprendí');
  await page.getByRole('button', { name: 'Añadir a mis ideas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Omitir' })).toHaveCount(0);
  await expect(page.getByText('Enseñarle a gente nueva lo que ya aprendí')).toBeVisible();
});

test('no hypothesis still produces a valid map', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await page.getByRole('button', { name: 'Todavía no veo una dirección clara' }).click();
  await page.getByRole('button', { name: 'Ver mi mapa' }).click();
  await expect(page.getByText('Todavía no aparece una dirección suficientemente clara.')).toBeVisible();
  await expect(page.getByText('purpose_score')).toHaveCount(0);
});

test('incomplete relationship can still become a hypothesis', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await page.getByRole('button', { name: 'enseñar cosas que ya aprendí' }).click();
  await page.getByRole('button', { name: 'explicar temas difíciles de forma simple' }).click();
  await expect(page.getByText('Todavía no están claros algunos lentes.')).toBeVisible();
  await page.getByRole('button', { name: 'Ponerlo en palabras' }).click();
  await page.locator('#hyp-text').fill('Enseñar a personas que están empezando, aunque el sustento todavía no esté claro.');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: 'Contrastar esta dirección' }).click();
  for (let i = 0; i < 6; i += 1) {
    if (i === 3) {
      await page.getByRole('button', { name: 'Prefiero no responder' }).click();
    } else {
      await page.getByRole('button', { name: 'De acuerdo', exact: true }).click();
    }
    await page.getByRole('button', { name: i === 5 ? 'Ver mi mapa' : 'Continuar' }).click();
  }
  await expect(page.getByText('Todavía no está definido.').first()).toBeVisible();
  await expect(page.getByText('No lo sabemos todavía')).toBeVisible();
});

test('reopen creates another revision after edit', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await page.getByRole('button', { name: 'enseñar cosas que ya aprendí' }).click();
  await page.getByRole('button', { name: 'Ponerlo en palabras' }).click();
  await page.locator('#hyp-text').fill('Ayudar a personas que están empezando mediante formación práctica.');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await page.getByRole('button', { name: 'Contrastar esta dirección' }).click();
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('button', { name: 'De acuerdo', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Ver mi mapa' : 'Continuar' }).click();
  }
  await page.getByRole('button', { name: 'Volver a explorar' }).click();
  await page.getByRole('button', { name: 'Contrastar esta dirección' }).click();
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('button', { name: 'De acuerdo', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Ver mi mapa' : 'Continuar' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Esto es lo que empieza a aparecer.' })).toBeVisible();
});

test('resume incomplete session from the same device', async ({ page }) => {
  await startFresh(page);
  await expect(
    page.getByRole('heading', { name: /actividades te hacen sentir interesado/i }),
  ).toBeVisible();
  await addItem(page, 'correr al amanecer');
  await page.waitForTimeout(1200);
  await page.goto('/ikigai/empezar');
  await expect(page.getByText('Tienes un mapa empezado')).toBeVisible();
  await shot(page, '00-inicio');
  const resume = page.getByRole('button', { name: 'Continuar donde quedé' });
  const box = await resume.boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  await resume.click();
  await expect(page.getByText('correr al amanecer')).toBeVisible();
});

test('idea library opens as a side pane on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await startFresh(page);
  await page.getByRole('button', { name: 'Explorar ideas' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar', exact: true })).toBeVisible();
  const panel = page.locator('.ik-sheet__panel--library');
  const box = await panel.boundingBox();
  expect(box?.width).toBeGreaterThan(360);
  expect(box?.width).toBeLessThan(500);
  expect(box?.x).toBeGreaterThan(700);
  expect(box?.y).toBeLessThan(8);
  await page.getByRole('button', { name: 'Todas' }).click();
  await expect(page.getByRole('button', { name: 'Creación y expresión' })).toBeVisible();
  await shot(page, '02-banco-desktop');
});
