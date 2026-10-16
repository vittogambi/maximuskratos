import { describe, expect, it } from 'vitest';
import { activityGuide } from '@/lib/activity-guide';

const passion = 'Frase guía  “¿Qué actividades te hacen sentir vivo, interesado o energizado, incluso cuando nadie te obliga a realizarlas?”  Ayudas para responder  Piensa en actividades que:  * Harías aunque no te pagaran. * Te hacen perder la noción del tiempo. * Te generan curiosidad constante. * Te hacen sentir orgulloso cuando mejoras.  Ejemplos  * Ayudar a otros a crecer. * Enseñar. * Entrenar físicamente. * Construir empresas. * Crear arte. * Investigar. * Resolver problemas complejos. * Diseñar. * Liderar equipos. * Aprender idiomas.*  Frase final  Mi pasión principal es:…';

describe('guía de actividad', () => {
  it('separa la pregunta, la ayuda y los ejemplos', () => {
    const guide = activityGuide(passion);
    expect(guide?.prompt).toBe('¿Qué actividades te hacen sentir vivo, interesado o energizado, incluso cuando nadie te obliga a realizarlas?');
    expect(guide?.help).toEqual([
      'Harías aunque no te pagaran',
      'Te hacen perder la noción del tiempo',
      'Te generan curiosidad constante',
      'Te hacen sentir orgulloso cuando mejoras',
    ]);
    expect(guide?.examples).toContain('Enseñar');
    expect(guide?.examples).toContain('Aprender idiomas');
    expect(guide?.close).toBe('Mi pasión principal es');
    expect(guide?.lead).toBe('');
  });

  it('deja el pedido inicial de profesión fuera de la pregunta', () => {
    const guide = activityGuide('Enumere entre 3 y 5 actividades.  Frase guía  “¿Qué actividad entrega suficiente valor?”  Ayudas para responder  Piensa en:  * Productos. * Servicios.  Ejemplos  * Entrenador.  Frase final  La actividad por la que me podrían pagar es:');
    expect(guide?.lead).toBe('Enumere entre 3 y 5 actividades.');
    expect(guide?.prompt).toBe('¿Qué actividad entrega suficiente valor?');
    expect(guide?.helpLead).toBe('Piensa en:');
    expect(guide?.close).toBe('La actividad por la que me podrían pagar es');
  });

  it('no toca una actividad corta', () => {
    expect(activityGuide('Actividad 2 de Pasión')).toBeNull();
  });
});
