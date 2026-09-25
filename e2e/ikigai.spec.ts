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

async function pickIdea(page: Page, name: string) {
  const button = page.getByRole('button', { name, exact: true });
  if (await button.isVisible().catch(() => false)) {
    await button.click();
    return;
  }
  for (const circle of ['Lo que amas', 'En lo que eres bueno', 'Lo que el mundo necesita', 'Por lo que te pueden pagar']) {
    const tag = page.getByRole('button', { name: circle });
    if (await tag.count()) await tag.click();
    if (await button.isVisible().catch(() => false)) break;
  }
  await button.click();
}

async function openComposer(page: Page) {
  const area = page.locator('#hyp-text');
  if (!(await area.isVisible())) await page.getByRole('button', { name: 'Darles forma' }).click();
  await area.waitFor({ state: 'visible' });
}

async function addItem(page: Page, value: string) {
  await page.locator('#ik-piece-in').fill(value);
  await page.getByRole('button', { name: 'Añadir al círculo' }).click();
}

async function nextLens(page: Page) {
  await page.locator('#ik-next').click();
}

async function completeFourFields(page: Page) {
  await addItem(page, 'enseñar cosas que ya aprendí');
  await addItem(page, 'ordenar sistemas complicados');
  await addItem(page, 'entrenar');
  await nextLens(page);
  await addItem(page, 'explicar temas difíciles de forma simple');
  await addItem(page, 'organizar equipos pequeños');
  await addItem(page, 'construir procesos');
  await nextLens(page);
  await addItem(page, 'personas que están empezando y se sienten perdidas');
  await addItem(page, 'equipos donde todo depende de una sola persona');
  await nextLens(page);
  await addItem(page, 'capacitación');
  await addItem(page, 'consultoría');
  await addItem(page, 'crear herramientas');
  await nextLens(page);
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
  await expect(page.getByText('AMAS', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Añadir al círculo' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Ver ideas', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Todavía no lo tengo claro' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Atrás' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Paso anterior' })).toHaveCount(0);
  await expect(page.locator('#ik-next')).toBeDisabled();
  await expect(
    page.getByText('Para seguir, coloca una idea en el círculo o marca que todavía no lo tienes claro.'),
  ).toBeVisible();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await shot(page, '01-explorar');
  await addItem(page, 'pieza que luego borro');
  await expect(page.getByText('1 idea').first()).toBeVisible();
  await expect(page.locator('#ik-next')).toBeEnabled();
  await page.getByRole('button', { name: /pieza que luego borro/ }).click();
  await page.getByRole('button', { name: 'Quitar' }).click();
  await expect(page.getByText('AMAS', { exact: true })).toBeVisible();
  await completeFourFields(page);
  await expect(page.getByRole('heading', { name: 'Conecta tus ideas' })).toBeVisible();
  await expect(page.getByText('PASIÓN', { exact: true })).toBeVisible();
  await expect(page.getByText('IKIGAI', { exact: true })).toBeVisible();
  await pickIdea(page, 'enseñar cosas que ya aprendí');
  await pickIdea(page, 'explicar temas difíciles de forma simple');
  await pickIdea(page, 'personas que están empezando y se sienten perdidas');
  await pickIdea(page, 'capacitación');
  await openComposer(page);
  await page.locator('#hyp-text').fill('adadada');
  await expect(page.getByText('Escribe al menos 12 caracteres')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar posibilidad', exact: true })).toBeDisabled();
  await shot(page, '03-relacionar');
  await page.locator('#hyp-text').fill(
    'Ayudar a personas que están empezando a dominar herramientas complejas mediante formación práctica.',
  );
  await shot(page, '04-formular');
  await page.getByRole('button', { name: 'Guardar posibilidad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Conecta tus ideas' })).toBeVisible();
  await expect(page.getByText('Guardada. Todavía no la has elegido para explorar.')).toBeVisible();
  await shot(page, '05-elegir');
  await page.getByRole('button', { name: 'Explorar esta posibilidad' }).click();
  // One direction, six angles: the hypothesis stays visible as the subject.
  await expect(page.getByText('La dirección que estás contrastando')).toBeVisible();
  await expect(page.getByRole('heading', { name: /sostener durante años/i })).toBeVisible();
  await expect(page.getByText(/Esta dirección utiliza actividades/)).toBeVisible();
  await expect(page.getByText('Elige una respuesta o prefiere no responder.')).toBeVisible();
  await shot(page, '06-contraste');
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Guardar mi mapa' : 'Continuar' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Esto es lo que construiste.' })).toBeVisible();
  await expect(page.getByText('Las piezas que la forman')).toBeVisible();
  await expect(page.getByText('Según tus respuestas')).toBeVisible();
  await expect(page.locator('.ik-rcard--lead .ik-rpieces li')).toHaveCount(4);
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
  await page.getByRole('button', { name: 'Guardar la prueba' }).click();
  await expect(page.getByText('Quedó guardada.')).toBeVisible();
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
  await expect(page.locator('.ik-sheet__context')).toHaveText('Lo que amas');
  await expect(page.getByRole('heading', { name: /actividades te hacen sentir interesado/i })).toBeVisible();
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
  await expect(page.locator('.ik-sheet__context')).toHaveText('Lo que amas');
  const detailBox = await panel.boundingBox();
  expect(detailBox?.height).toBeLessThan(listBox?.height ?? 844);
  await expect(page.getByText(/Cómo aparece esto en tu vida/)).toBeVisible();
  await expect(page.getByText('Enseñarle a gente nueva lo que ya aprendí')).toHaveCount(0);
  await page.locator('#ik-adopt-text').fill('Enseñarle a gente nueva lo que ya aprendí');
  await page.getByRole('button', { name: 'Añadir a mis ideas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Omitir' })).toHaveCount(0);
  await expect(panel).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lo que amas: Enseñarle a gente nueva lo que ya aprendí' })).toBeVisible();
  await expect(page.getByText('1 idea').first()).toBeVisible();
});

test('no hypothesis still produces a valid map', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await page.getByRole('button', { name: 'Todavía no veo una dirección clara' }).click();
  await page.getByRole('button', { name: 'Guardar mi mapa' }).click();
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
  await expect(page.locator('#ik-next')).toBeEnabled();
  await nextLens(page);
  await expect(page.getByRole('button', { name: 'Atrás' })).toBeVisible();
  await expect(page.getByRole('button', { name: '← Volver' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(
    page.getByRole('heading', { name: /actividades te hacen sentir interesado/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Atrás' })).toHaveCount(0);
  await nextLens(page);
  for (let i = 1; i < 4; i += 1) {
    await page.getByRole('button', { name: 'Todavía no lo tengo claro' }).click();
    await nextLens(page);
  }
  await expect(page.getByText('AMAS', { exact: true })).toBeVisible();
  await expect(page.getByText('BUENO', { exact: true })).toBeVisible();
  await expect(page.getByText('NECESITA', { exact: true })).toBeVisible();
  await expect(page.getByText('PAGAR', { exact: true })).toBeVisible();
  await expect(page.getByText('Aquí todavía no has escrito ideas.')).toHaveCount(0);
  await expect(page.getByText('Todavía no está claro')).toHaveCount(0);
  await page.getByRole('button', { name: 'Todavía no veo una dirección clara' }).click();
  await page.getByRole('button', { name: 'Guardar mi mapa' }).click();
  await expect(page.getByText('Todavía no hay piezas en el mapa.')).toBeVisible();
  await expect(page.getByText('No anotaste nada en')).toHaveCount(0);
  await expect(page.getByText('Todavía no aparece una hipótesis suficientemente clara.')).toBeVisible();
});

test('incomplete relationship can still become a hypothesis', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await pickIdea(page, 'enseñar cosas que ya aprendí');
  await pickIdea(page, 'explicar temas difíciles de forma simple');
  await openComposer(page);
  await page.locator('#hyp-text').fill('Enseñar a personas que están empezando, aunque el sustento todavía no esté claro.');
  await page.getByRole('button', { name: 'Guardar posibilidad', exact: true }).click();
  await page.getByRole('button', { name: 'Explorar esta posibilidad' }).click();
  for (let i = 0; i < 6; i += 1) {
    if (i === 3) {
      await page.getByRole('button', { name: 'Prefiero no responder' }).click();
    } else {
      await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    }
    await page.getByRole('button', { name: i === 5 ? 'Guardar mi mapa' : 'Continuar' }).click();
  }
  await expect(page.getByText('Esta dirección todavía no toca:')).toBeVisible();
  await expect(page.getByText('No lo sabemos todavía')).toBeVisible();
  await expect(page.getByText(/hipótesis \d/i)).toHaveCount(0);
  await expect(page.getByText('Según tus respuestas')).toBeVisible();
});

test('reopen creates another revision after edit', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await pickIdea(page, 'enseñar cosas que ya aprendí');
  await openComposer(page);
  await page.locator('#hyp-text').fill('Ayudar a personas que están empezando mediante formación práctica.');
  await page.getByRole('button', { name: 'Guardar posibilidad', exact: true }).click();
  await page.getByRole('button', { name: 'Explorar esta posibilidad' }).click();
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Guardar mi mapa' : 'Continuar' }).click();
  }
  await page.getByRole('button', { name: 'Volver a explorar' }).first().click();
  await page.getByRole('button', { name: 'Explorar esta posibilidad' }).click();
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    await page.getByRole('button', { name: i === 5 ? 'Guardar mi mapa' : 'Continuar' }).click();
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
  await expect(page.getByRole('button', { name: /correr al amanecer/ })).toBeVisible();
});

test('a simulated complete failure stays recoverable', async ({ page }) => {
  await startFresh(page);
  await completeFourFields(page);
  await pickIdea(page, 'enseñar cosas que ya aprendí');
  await openComposer(page);
  await page.locator('#hyp-text').fill('Ayudar a personas que están empezando mediante formación práctica.');
  await page.getByRole('button', { name: 'Guardar posibilidad', exact: true }).click();
  await page.getByRole('button', { name: 'Explorar esta posibilidad' }).click();
  for (let i = 0; i < 6; i += 1) {
    await page.getByRole('radio', { name: 'De acuerdo', exact: true }).click();
    if (i === 5) break;
    await page.getByRole('button', { name: 'Continuar' }).click();
  }
  await page.route('**/ikigai/sessions/**/complete', (route) => route.abort());
  await page.getByRole('button', { name: 'Guardar mi mapa' }).click();
  await expect(page.getByText('No pudimos cerrar el mapa. Reintenta.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Guardar mi mapa' })).toBeEnabled();
  await page.unroute('**/ikigai/sessions/**/complete');
  await page.getByRole('button', { name: 'Guardar mi mapa' }).click();
  await expect(page.getByRole('heading', { name: 'Esto es lo que construiste.' })).toBeVisible();
});

test('exit confirms that progress is saved', async ({ page }) => {
  await startFresh(page);
  await expect(page.getByRole('heading', { name: /actividades te hacen sentir interesado/i })).toBeVisible();
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

async function oneIdeaEach(page: Page) {
  await addItem(page, 'me gusta enseñar');
  await nextLens(page);
  await addItem(page, 'explico con paciencia');
  await nextLens(page);
  await addItem(page, 'adultos con el teléfono');
  await nextLens(page);
  await addItem(page, 'talleres pequeños');
  await nextLens(page);
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const main = document.querySelector('.ik-main');
    return {
      page: root.scrollWidth - root.clientWidth,
      main: main ? main.scrollWidth - main.clientWidth : 0,
    };
  });
  expect(overflow.page).toBeLessThanOrEqual(1);
  expect(overflow.main).toBeLessThanOrEqual(1);
}

test('connect list keeps a 44px row and the save reason', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await startFresh(page);
  await oneIdeaEach(page);
  await expect(page.getByRole('heading', { name: 'Conecta tus ideas' })).toBeVisible();
  await noHorizontalScroll(page);
  const row = page.getByRole('button', { name: 'me gusta enseñar', exact: true });
  const box = await row.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
  const save = page.getByRole('button', { name: 'Guardar posibilidad', exact: true });
  await expect(save).toBeDisabled();
  await expect(page.getByText('Elige al menos una idea')).toBeVisible();
  await row.click();
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(row).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.locator('#hyp-text').fill('');
  await expect(page.getByText('Escribe al menos 12 caracteres')).toBeVisible();
  await page.locator('#hyp-text').fill('Organizar talleres pequeños para enseñar.');
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page.getByText('Guardada. Todavía no la has elegido para explorar.')).toBeVisible();
  await expect(page.getByText('PASIÓN', { exact: true })).toBeVisible();
  await noHorizontalScroll(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await noHorizontalScroll(page);
  const narrow = await page.getByRole('button', { name: 'me gusta enseñar', exact: true }).boundingBox();
  expect(narrow?.height).toBeGreaterThanOrEqual(44);
});

test('unclear lenses stay in the list on a wide screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await startFresh(page);
  for (let i = 0; i < 4; i += 1) {
    await page.getByRole('button', { name: 'Todavía no lo tengo claro' }).click();
    await nextLens(page);
  }
  await expect(page.getByText('AMAS', { exact: true })).toBeVisible();
  await expect(page.getByText('BUENO', { exact: true })).toBeVisible();
  await expect(page.getByText('NECESITA', { exact: true })).toBeVisible();
  await expect(page.getByText('PAGAR', { exact: true })).toBeVisible();
  await expect(page.getByText('PASIÓN', { exact: true })).toBeVisible();
  await noHorizontalScroll(page);
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
  await expect(page.locator('.ik-sheet__context')).toHaveText('Lo que amas');
  await page.getByRole('button', { name: 'Todas' }).click();
  await expect(page.getByRole('button', { name: 'Creación y expresión' })).toBeVisible();
  await shot(page, '02-banco-desktop');
});
