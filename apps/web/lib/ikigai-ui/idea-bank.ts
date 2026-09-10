import type { IkigaiFieldKey } from '@/lib/ikigai-api';

export type IdeaLegacy = 'PASION' | 'VOCACION' | 'MISION' | 'PROFESION';

export type IdeaPlacement = {
  field: IkigaiFieldKey;
  categoryId: string;
};

export type IkigaiIdea = {
  id: string;
  label: string;
  description: string;
  placeholders: Partial<Record<IkigaiFieldKey, string>>;
  sourceLegacy: IdeaLegacy[];
  placements: IdeaPlacement[];
};

export type IdeaCategory = {
  id: string;
  label: string;
};

export const IDEA_CATEGORIES: Record<IkigaiFieldKey, IdeaCategory[]> = {
  PASION: [
    { id: 'creacion', label: 'Creación y expresión' },
    { id: 'analisis', label: 'Análisis y resolución' },
    { id: 'conexion', label: 'Conexión y servicio' },
    { id: 'exploracion', label: 'Exploración y movimiento' },
    { id: 'bienestar', label: 'Bienestar y entorno' },
  ],
  CAPACIDAD: [
    { id: 'ordenar', label: 'Ordenar y coordinar' },
    { id: 'resolver', label: 'Diagnosticar y resolver' },
    { id: 'construir', label: 'Construir y operar' },
    { id: 'comunicar', label: 'Explicar y enseñar' },
    { id: 'relacionar', label: 'Relacionar y negociar' },
    { id: 'analizar', label: 'Analizar y decidir' },
  ],
  NECESIDAD: [
    { id: 'aprendizaje', label: 'Aprendizaje y desarrollo' },
    { id: 'orden', label: 'Orden y funcionamiento' },
    { id: 'comunidad', label: 'Conexión y comunidad' },
    { id: 'progreso', label: 'Progreso e innovación' },
    { id: 'bienestar', label: 'Bienestar' },
    { id: 'legado', label: 'Continuidad y legado' },
  ],
  VALOR: [
    { id: 'asesorar', label: 'Asesorar' },
    { id: 'construir', label: 'Construir y operar' },
    { id: 'comercializar', label: 'Comercializar' },
    { id: 'ensenar', label: 'Enseñar' },
    { id: 'analizar', label: 'Analizar y automatizar' },
  ],
};

function idea(
  id: string,
  label: string,
  description: string,
  sourceLegacy: IdeaLegacy | IdeaLegacy[],
  placements: Array<[IkigaiFieldKey, string]>,
  placeholders: Partial<Record<IkigaiFieldKey, string>> = {},
): IkigaiIdea {
  return {
    id,
    label,
    description,
    placeholders,
    sourceLegacy: Array.isArray(sourceLegacy) ? sourceLegacy : [sourceLegacy],
    placements: placements.map(([field, categoryId]) => ({ field, categoryId })),
  };
}

/**
 * Biblioteca de exploración recatalogada desde el Excel de Rafa.
 * Las columnas antiguas (Pasión / Vocación / Misión / Profesión) no se muestran.
 * Cada idea puede ayudar en más de un campo de Matrix v2.
 * No es un instrumento de scoring.
 */
export const IDEA_BANK: IkigaiIdea[] = [
  idea(
    'escribir',
    'Escribir',
    'Diarios, ficción, ensayos técnicos, poesía o blogs.',
    'PASION',
    [['PASION', 'creacion']],
    { PASION: 'Escribir para ordenar lo que pienso o para que otros lo puedan usar' },
  ),
  idea(
    'contenido-visual',
    'Crear contenido visual',
    'Fotografía, edición de video, diseño gráfico o dibujo.',
    'PASION',
    [['PASION', 'creacion']],
    { PASION: 'Crear imágenes o video que dejen algo claro o bello' },
  ),
  idea(
    'expresion-fisica',
    'Bailar, actuar o tocar música',
    'Bailar, actuar, cantar o tocar un instrumento.',
    'PASION',
    [['PASION', 'creacion']],
    { PASION: 'Expresarme con el cuerpo o con música' },
  ),
  idea(
    'construir',
    'Construir',
    'Carpintería, manualidades, maquetas o bricolaje.',
    'PASION',
    [
      ['PASION', 'creacion'],
      ['CAPACIDAD', 'construir'],
    ],
    {
      PASION: 'Construir cosas con las manos y verlas terminar',
      CAPACIDAD: 'Armar algo concreto desde cero y dejarlo funcionando',
    },
  ),
  idea(
    'investigar',
    'Investigar',
    'Leer sobre temas complejos, profundizar en historia, ciencia o un oficio.',
    ['PASION', 'VOCACION'],
    [
      ['PASION', 'analisis'],
      ['CAPACIDAD', 'analizar'],
      ['VALOR', 'analizar'],
    ],
    {
      PASION: 'Investigar un tema hasta entenderlo de verdad',
      CAPACIDAD: 'Profundizar en un problema hasta encontrar qué está pasando',
      VALOR: 'Investigación que otro pueda usar para decidir',
    },
  ),
  idea(
    'resolver-problemas',
    'Resolver problemas',
    'Juegos de lógica, puzzles, ajedrez, programación o destrabar un lío real.',
    'PASION',
    [
      ['PASION', 'analisis'],
      ['CAPACIDAD', 'resolver'],
    ],
    {
      PASION: 'Resolver problemas que otros dejan a medias',
      CAPACIDAD: 'Encontrar la causa de un lío y dejarlo resuelto',
    },
  ),
  idea(
    'organizar',
    'Organizar',
    'Clasificar información, ordenar un proceso o planificar para que las cosas ocurran.',
    ['PASION', 'VOCACION'],
    [
      ['PASION', 'analisis'],
      ['CAPACIDAD', 'ordenar'],
    ],
    {
      PASION: 'Organizar información o un espacio hasta que se pueda usar',
      CAPACIDAD: 'Crear orden donde hoy hay desorden',
    },
  ),
  idea(
    'analizar-datos',
    'Analizar datos',
    'Encontrar patrones, estudiar números o convertir información en una decisión.',
    ['PASION', 'PROFESION'],
    [
      ['PASION', 'analisis'],
      ['CAPACIDAD', 'analizar'],
      ['VALOR', 'analizar'],
    ],
    {
      PASION: 'Encontrar patrones en números o en lo que la gente hace',
      CAPACIDAD: 'Leer datos y decir qué conviene hacer',
      VALOR: 'Análisis que ayude a decidir inversión, ahorro o foco',
    },
  ),
  idea(
    'ensenar',
    'Enseñar',
    'Explicar conceptos, hacer mentoría, enseñar una habilidad o acompañar a alguien que está aprendiendo.',
    ['PASION', 'VOCACION', 'PROFESION'],
    [
      ['PASION', 'conexion'],
      ['CAPACIDAD', 'comunicar'],
      ['VALOR', 'ensenar'],
    ],
    {
      PASION: 'Enseñarle a alguien algo que yo ya aprendí',
      CAPACIDAD: 'Explicar con claridad algo que otros tardan en entender',
      VALOR: 'Capacitación práctica para gente que está empezando',
    },
  ),
  idea(
    'cuidar',
    'Cuidar',
    'Ayudar a personas o animales, jardinería o voluntariado.',
    ['PASION', 'VOCACION'],
    [['PASION', 'conexion']],
    { PASION: 'Cuidar a alguien o algo que de verdad me importa' },
  ),
  idea(
    'escuchar',
    'Escuchar',
    'Conversaciones profundas, dar consejo o mediar cuando hay tensión.',
    'PASION',
    [
      ['PASION', 'conexion'],
      ['CAPACIDAD', 'relacionar'],
    ],
    {
      PASION: 'Escuchar de verdad y ayudar a que la otra persona se ordene',
      CAPACIDAD: 'Escuchar y traducir lo que está pasando en un conflicto',
    },
  ),
  idea(
    'liderar',
    'Liderar',
    'Motivar equipos, coordinar grupos o poner en marcha un proyecto compartido.',
    'PASION',
    [
      ['PASION', 'conexion'],
      ['CAPACIDAD', 'relacionar'],
    ],
    {
      PASION: 'Liderar un grupo para que algo ocurra de verdad',
      CAPACIDAD: 'Hacer que un equipo se mueva hacia un resultado',
    },
  ),
  idea(
    'aire-libre',
    'Aire libre',
    'Senderismo, acampar o deportes de aventura.',
    'PASION',
    [['PASION', 'exploracion']],
    { PASION: 'Estar al aire libre y moverme en un entorno que no controlo del todo' },
  ),
  idea(
    'viajar',
    'Viajar',
    'Conocer culturas, probar gastronomía o aprender idiomas.',
    'PASION',
    [['PASION', 'exploracion']],
    { PASION: 'Viajar para entender cómo vive y trabaja otra gente' },
  ),
  idea(
    'actividad-fisica',
    'Actividad física',
    'Deportes de equipo, yoga, correr o nadar.',
    'PASION',
    [['PASION', 'exploracion']],
    { PASION: 'Entrenar de forma sostenida, solo o con otros' },
  ),
  idea(
    'observar-arte',
    'Observar arte o cultura',
    'Museos, conciertos o cine con atención, no solo de fondo.',
    'PASION',
    [['PASION', 'bienestar']],
    { PASION: 'Mirar arte o cultura con atención y después conversarlo' },
  ),
  idea(
    'cocinar',
    'Cocinar',
    'Experimentar con recetas o alimentar a otros.',
    'PASION',
    [['PASION', 'bienestar']],
    { PASION: 'Cocinar para mí o para gente que me importa' },
  ),
  idea(
    'decorar',
    'Decorar',
    'Organizar espacios, estética del hogar o moda.',
    'PASION',
    [['PASION', 'bienestar']],
    { PASION: 'Hacer que un espacio se sienta claro y habitable' },
  ),
  idea(
    'tecnologia',
    'Tecnología',
    'Probar herramientas nuevas, videojuegos o inteligencia artificial.',
    'PASION',
    [['PASION', 'bienestar']],
    { PASION: 'Probar herramientas nuevas y ver qué se puede hacer con ellas' },
  ),
  idea(
    'optimizar-procesos',
    'Optimizar procesos',
    'Hacer que algo lento o difícil se vuelva más fluido.',
    'VOCACION',
    [
      ['CAPACIDAD', 'ordenar'],
      ['NECESIDAD', 'orden'],
    ],
    {
      CAPACIDAD: 'Simplificar un proceso que hoy hace perder tiempo',
      NECESIDAD: 'Equipos trabados por procesos lentos o innecesarios',
    },
  ),
  idea(
    'reparar-sistemas',
    'Reparar sistemas',
    'Arreglar objetos, software o sistemas que dejaron de funcionar.',
    'VOCACION',
    [
      ['CAPACIDAD', 'resolver'],
      ['NECESIDAD', 'orden'],
    ],
    {
      CAPACIDAD: 'Reparar un sistema que está fallando y dejarlo usable',
      NECESIDAD: 'Sistemas que fallan y nadie está sosteniendo',
    },
  ),
  idea(
    'simplificar-informacion',
    'Simplificar información',
    'Traducir temas complejos para que otra persona los pueda usar.',
    'VOCACION',
    [
      ['CAPACIDAD', 'comunicar'],
      ['NECESIDAD', 'aprendizaje'],
    ],
    {
      CAPACIDAD: 'Traducir algo técnico a un lenguaje que se pueda usar',
      NECESIDAD: 'Personas que no pueden usar una herramienta porque nadie se la explicó',
    },
  ),
  idea(
    'coordinar-proyectos',
    'Coordinar proyectos',
    'Ordenar personas, tiempos y recursos para llegar a un resultado.',
    'PROFESION',
    [['CAPACIDAD', 'ordenar']],
    { CAPACIDAD: 'Coordinar personas y tiempos hasta entregar algo concreto' },
  ),
  idea(
    'diagnosticar',
    'Diagnosticar problemas',
    'Ver una situación compleja y detectar la raíz de un fallo.',
    'PROFESION',
    [
      ['CAPACIDAD', 'resolver'],
      ['VALOR', 'asesorar'],
    ],
    {
      CAPACIDAD: 'Ver qué está fallando de verdad, no solo el síntoma',
      VALOR: 'Un diagnóstico claro de qué está pasando en un equipo o un sistema',
    },
  ),
  idea(
    'disenar-estrategias',
    'Diseñar estrategias',
    'Crear una hoja de ruta para que otros alcancen un objetivo.',
    'PROFESION',
    [
      ['CAPACIDAD', 'analizar'],
      ['VALOR', 'asesorar'],
    ],
    {
      CAPACIDAD: 'Diseñar un plan que otro pueda ejecutar',
      VALOR: 'Una estrategia que otro pueda seguir durante un tiempo',
    },
  ),
  idea(
    'construir-sistemas',
    'Construir sistemas',
    'Crear productos, software o infraestructuras que después se puedan operar.',
    'PROFESION',
    [
      ['CAPACIDAD', 'construir'],
      ['VALOR', 'construir'],
    ],
    {
      CAPACIDAD: 'Armar un sistema que otros puedan usar sin mí',
      VALOR: 'Un producto o sistema que alguien quiera seguir usando',
    },
  ),
  idea(
    'administrar-recursos',
    'Administrar recursos',
    'Cuidar tiempo, dinero o personas para que rindan sin desperdicio.',
    'PROFESION',
    [['CAPACIDAD', 'ordenar']],
    { CAPACIDAD: 'Administrar recursos para que un trabajo llegue a término' },
  ),
  idea(
    'vender-soluciones',
    'Vender soluciones complejas',
    'Explicar una solución difícil y cerrar un acuerdo con quien la necesita.',
    'PROFESION',
    [
      ['CAPACIDAD', 'relacionar'],
      ['VALOR', 'comercializar'],
    ],
    {
      CAPACIDAD: 'Explicar una solución compleja hasta que alguien decide comprarla',
      VALOR: 'Ventas de una solución concreta a un problema real',
    },
  ),
  idea(
    'crear-protocolos',
    'Crear protocolos',
    'Dejar por escrito cómo se hace un trabajo para que se pueda repetir.',
    ['VOCACION', 'PROFESION'],
    [
      ['CAPACIDAD', 'construir'],
      ['VALOR', 'ensenar'],
      ['NECESIDAD', 'legado'],
    ],
    {
      CAPACIDAD: 'Documentar un método para que no dependa de mí',
      VALOR: 'Manuales o protocolos que hagan escalable un trabajo',
      NECESIDAD: 'Procesos que hoy viven solo en la cabeza de una persona',
    },
  ),
  idea(
    'automatizar',
    'Automatizar',
    'Sustituir tareas repetitivas por un proceso que no dependa de alguien cada vez.',
    'PROFESION',
    [
      ['CAPACIDAD', 'construir'],
      ['VALOR', 'analizar'],
    ],
    {
      CAPACIDAD: 'Automatizar una tarea repetitiva que hoy come tiempo',
      VALOR: 'Automatización de un trabajo repetitivo que hoy se paga a pulso',
    },
  ),
  idea(
    'negociar',
    'Negociar',
    'Cerrar acuerdos que las dos partes puedan sostener.',
    'PROFESION',
    [
      ['CAPACIDAD', 'relacionar'],
      ['VALOR', 'comercializar'],
    ],
    {
      CAPACIDAD: 'Negociar un acuerdo que las dos partes puedan cumplir',
      VALOR: 'Negociación de acuerdos que sostengan un intercambio',
    },
  ),
  idea(
    'mediar',
    'Mediar',
    'Intervenir en una tensión para encontrar un acuerdo usable.',
    'VOCACION',
    [
      ['CAPACIDAD', 'relacionar'],
      ['NECESIDAD', 'comunidad'],
    ],
    {
      CAPACIDAD: 'Mediar cuando hay conflicto y dejar un acuerdo claro',
      NECESIDAD: 'Conflictos que nadie está ayudando a resolver',
    },
  ),
  idea(
    'explicar',
    'Explicar',
    'Hacer entendible algo que hoy solo maneja quien ya lo sabe.',
    ['PASION', 'VOCACION'],
    [['CAPACIDAD', 'comunicar']],
    { CAPACIDAD: 'Explicar un tema difícil sin perder precisión' },
  ),
  idea(
    'personas-aprender',
    'Personas que necesitan aprender',
    'Gente que quiere una habilidad y no tiene cómo practicarla con claridad.',
    ['VOCACION', 'MISION'],
    [['NECESIDAD', 'aprendizaje']],
    { NECESIDAD: 'Personas que están perdidas al empezar algo que yo ya aprendí' },
  ),
  idea(
    'falta-herramientas',
    'Falta de herramientas',
    'Trabajos o oficios que se hacen a pulso porque nadie armó el método.',
    'MISION',
    [['NECESIDAD', 'aprendizaje']],
    { NECESIDAD: 'Equipos que no tienen herramientas simples para hacer bien su trabajo' },
  ),
  idea(
    'desarrollo-talento',
    'Desarrollo de talento',
    'Capacidades que no se están viendo ni entrenando.',
    'MISION',
    [['NECESIDAD', 'aprendizaje']],
    { NECESIDAD: 'Personas con potencial que nadie está ayudando a desarrollar' },
  ),
  idea(
    'acceso-conocimiento',
    'Acceso a conocimiento',
    'Información útil que no llega a quien la necesita.',
    'MISION',
    [['NECESIDAD', 'aprendizaje']],
    { NECESIDAD: 'Gente que no puede usar conocimiento que ya existe' },
  ),
  idea(
    'desorden',
    'Desorden',
    'Información, equipos o espacios donde nadie encuentra qué hacer después.',
    'VOCACION',
    [['NECESIDAD', 'orden']],
    { NECESIDAD: 'Equipos o espacios que funcionan con desorden' },
  ),
  idea(
    'ineficiencia',
    'Ineficiencia',
    'Procesos que gastan tiempo, dinero o energía sin necesidad.',
    ['VOCACION', 'MISION'],
    [['NECESIDAD', 'orden']],
    { NECESIDAD: 'Trabajos que se hacen más difíciles de lo que hace falta' },
  ),
  idea(
    'desperdicio',
    'Desperdicio de recursos',
    'Tiempo, dinero o materiales que se pierden por falta de método.',
    'MISION',
    [['NECESIDAD', 'orden']],
    { NECESIDAD: 'Recursos que se desperdician porque nadie está cuidando el proceso' },
  ),
  idea(
    'aislamiento',
    'Aislamiento',
    'Personas o equipos que trabajan sin red y se quedan solos con el problema.',
    ['VOCACION', 'MISION'],
    [['NECESIDAD', 'comunidad']],
    { NECESIDAD: 'Personas que se sienten solas con un problema que otros también tienen' },
  ),
  idea(
    'falta-redes',
    'Falta de redes',
    'Gente que podría colaborar y no tiene cómo encontrarse.',
    'VOCACION',
    [['NECESIDAD', 'comunidad']],
    { NECESIDAD: 'Gente que podría ayudarse y no tiene un lugar para encontrarse' },
  ),
  idea(
    'dificultad-comunicar',
    'Dificultades de comunicación',
    'Mensajes, marcas o personas que no consiguen hacerse entender.',
    'VOCACION',
    [['NECESIDAD', 'comunidad']],
    { NECESIDAD: 'Personas o equipos que no consiguen comunicar lo que hacen' },
  ),
  idea(
    'estancamiento',
    'Sistemas estancados',
    'Formas de trabajar que ya no sirven y nadie está renovando.',
    ['VOCACION', 'MISION'],
    [['NECESIDAD', 'progreso']],
    { NECESIDAD: 'Equipos o sistemas que se quedaron quietos y no saben cómo salir' },
  ),
  idea(
    'problemas-sin-solucion',
    'Problemas sin solución',
    'Necesidades cotidianas que todavía no tienen una herramienta usable.',
    'VOCACION',
    [['NECESIDAD', 'progreso']],
    { NECESIDAD: 'Un problema cotidiano que nadie está resolviendo bien' },
  ),
  idea(
    'acceso-tecnologia',
    'Falta de acceso a tecnología',
    'Herramientas que existen y no llegan a quien las necesita.',
    'MISION',
    [['NECESIDAD', 'progreso']],
    { NECESIDAD: 'Personas que se quedan afuera de herramientas que ya existen' },
  ),
  idea(
    'estres',
    'Estrés',
    'Sobrecarga, falta de calma o un ritmo que no se puede sostener.',
    ['VOCACION', 'MISION'],
    [['NECESIDAD', 'bienestar']],
    { NECESIDAD: 'Personas que están agotadas y no tienen un modo de recuperar' },
  ),
  idea(
    'salud',
    'Salud',
    'Hábitos, cuerpo o entornos que están desgastando a la gente.',
    'MISION',
    [['NECESIDAD', 'bienestar']],
    { NECESIDAD: 'Personas que quieren cuidar su salud y no tienen un método usable' },
  ),
  idea(
    'descanso',
    'Descanso',
    'Falta de recuperación real después del trabajo o del cuidado de otros.',
    'MISION',
    [['NECESIDAD', 'bienestar']],
    { NECESIDAD: 'Personas que no tienen un espacio real para recuperarse' },
  ),
  idea(
    'espacios-poco-funcionales',
    'Espacios poco funcionales',
    'Hogares, oficinas o lugares públicos que desgastan en vez de ayudar.',
    ['VOCACION', 'MISION'],
    [['NECESIDAD', 'bienestar']],
    { NECESIDAD: 'Espacios de trabajo o de casa que hacen más difícil el día' },
  ),
  idea(
    'conocimiento-se-pierde',
    'Conocimiento que se pierde',
    'Métodos que funcionan y desaparecen cuando alguien se va.',
    'MISION',
    [['NECESIDAD', 'legado']],
    { NECESIDAD: 'Conocimiento de un oficio que se pierde cuando alguien se va' },
  ),
  idea(
    'falta-estandares',
    'Falta de estándares',
    'Calidad o ética que depende del humor del día y no de un criterio compartido.',
    'MISION',
    [['NECESIDAD', 'legado']],
    { NECESIDAD: 'Un trabajo que cambia de calidad según quién lo haga ese día' },
  ),
  idea(
    'dependencia-una-persona',
    'Procesos que dependen de una persona',
    'Sistemas frágiles porque solo una persona sabe cómo se hacen las cosas.',
    'MISION',
    [['NECESIDAD', 'legado']],
    { NECESIDAD: 'Un equipo que se cae si una sola persona no está' },
  ),
  idea(
    'capacidades-no-se-transmiten',
    'Capacidades que no se transmiten',
    'Oficios o métodos que no tienen quién los enseñe a la siguiente ronda.',
    'MISION',
    [['NECESIDAD', 'legado']],
    { NECESIDAD: 'Un oficio o un método que no se está enseñando a nadie más' },
  ),
  idea(
    'crear-comunidad',
    'Crear comunidad',
    'Unir a personas con un interés común para que no trabajen solas.',
    ['VOCACION', 'MISION'],
    [
      ['PASION', 'conexion'],
      ['NECESIDAD', 'comunidad'],
    ],
    {
      PASION: 'Crear un grupo donde la gente se encuentre alrededor de algo real',
      NECESIDAD: 'Personas con el mismo problema que hoy no tienen un lugar en común',
    },
  ),
  idea(
    'diagnostico',
    'Diagnóstico',
    'Mirar una situación y decir con claridad qué está fallando.',
    'PROFESION',
    [['VALOR', 'asesorar']],
    { VALOR: 'Un diagnóstico que otro pueda pagar porque le ahorra tiempo y error' },
  ),
  idea(
    'estrategia',
    'Estrategia',
    'Una hoja de ruta que otro pueda seguir.',
    'PROFESION',
    [['VALOR', 'asesorar']],
    { VALOR: 'Acompañar a alguien a definir qué hacer y en qué orden' },
  ),
  idea(
    'auditoria',
    'Auditoría',
    'Revisar si un proceso cumple un estándar, una norma o una calidad prometida.',
    'PROFESION',
    [['VALOR', 'asesorar']],
    { VALOR: 'Una revisión independiente de calidad o de cumplimiento' },
  ),
  idea(
    'conocimiento-especializado',
    'Conocimiento especializado',
    'Un juicio experto sobre un sector o un problema concreto.',
    'PROFESION',
    [['VALOR', 'asesorar']],
    { VALOR: 'Consejo experto sobre un problema que yo ya vi varias veces' },
  ),
  idea(
    'proyectos',
    'Proyectos',
    'Llevar un trabajo de principio a fin con un resultado entregable.',
    'PROFESION',
    [['VALOR', 'construir']],
    { VALOR: 'Llevar un proyecto hasta un resultado que otro pueda usar' },
  ),
  idea(
    'productos',
    'Productos',
    'Algo concreto que alguien pueda usar más de una vez.',
    'PROFESION',
    [['VALOR', 'construir']],
    { VALOR: 'Un producto que resuelva un problema de forma repetible' },
  ),
  idea(
    'software',
    'Software',
    'Una herramienta digital que otro pueda operar.',
    'PROFESION',
    [['VALOR', 'construir']],
    { VALOR: 'Software que le quite fricción a un trabajo repetido' },
  ),
  idea(
    'sistemas',
    'Sistemas',
    'Una forma de trabajar que se pueda operar sin reinventarla cada vez.',
    'PROFESION',
    [['VALOR', 'construir']],
    { VALOR: 'Un sistema de trabajo que un equipo pueda operar sin mí encima' },
  ),
  idea(
    'mantenimiento',
    'Mantenimiento',
    'Cuidar que algo vital siga funcionando y repararlo cuando falla.',
    'PROFESION',
    [['VALOR', 'construir']],
    { VALOR: 'Mantener un sistema en marcha para que no se caiga' },
  ),
  idea(
    'ventas',
    'Ventas',
    'Conectar una solución con alguien que tiene el problema.',
    'PROFESION',
    [['VALOR', 'comercializar']],
    { VALOR: 'Vender una solución concreta a quien ya tiene el problema' },
  ),
  idea(
    'desarrollo-negocio',
    'Desarrollo de negocio',
    'Encontrar con quién vale la pena trabajar y abrir esa relación.',
    'PROFESION',
    [['VALOR', 'comercializar']],
    { VALOR: 'Abrir relaciones con clientes o aliados que sostengan el trabajo' },
  ),
  idea(
    'analisis-mercado',
    'Análisis de mercado',
    'Entender a quién le sirve algo y cómo llegar ahí.',
    'PROFESION',
    [['VALOR', 'comercializar']],
    { VALOR: 'Estudiar a quién le sirve esto y cómo ofrecerlo' },
  ),
  idea(
    'capacitacion',
    'Capacitación',
    'Entrenar a un equipo en una herramienta o un método concreto.',
    'PROFESION',
    [['VALOR', 'ensenar']],
    { VALOR: 'Capacitación para un equipo que necesita una habilidad concreta' },
  ),
  idea(
    'formacion-tecnica',
    'Formación técnica',
    'Enseñar un oficio o una habilidad que el mercado está pidiendo.',
    'PROFESION',
    [['VALOR', 'ensenar']],
    { VALOR: 'Formación en un oficio o una habilidad que se puede cobrar' },
  ),
  idea(
    'documentacion',
    'Documentación',
    'Dejar un registro claro para que otros puedan operar sin preguntar cada vez.',
    ['VOCACION', 'PROFESION'],
    [['VALOR', 'ensenar']],
    { VALOR: 'Documentación que haga usable un método sin depender de mí' },
  ),
  idea(
    'entrenamiento',
    'Entrenamiento profesional',
    'Acompañar la práctica hasta que la persona pueda hacerlo sola.',
    'PROFESION',
    [['VALOR', 'ensenar']],
    { VALOR: 'Entrenar a alguien hasta que pueda ejercer sin supervisión' },
  ),
  idea(
    'arquitectura-sistemas',
    'Arquitectura de sistemas',
    'Diseñar la estructura de un proceso, una red o un flujo de trabajo.',
    'PROFESION',
    [['VALOR', 'analizar']],
    { VALOR: 'Diseñar cómo debería funcionar un proceso o un sistema' },
  ),
];

export function foldText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function ideasForField(field: IkigaiFieldKey) {
  return IDEA_BANK.filter((row) => row.placements.some((p) => p.field === field));
}

export function libraryForField(field: IkigaiFieldKey, query = '') {
  const q = foldText(query.trim());
  const ideas = ideasForField(field).filter((row) => {
    if (!q) return true;
    return foldText(`${row.label} ${row.description}`).includes(q);
  });
  return IDEA_CATEGORIES[field]
    .map((category) => ({
      ...category,
      ideas: ideas.filter((row) =>
        row.placements.some((p) => p.field === field && p.categoryId === category.id),
      ),
    }))
    .filter((category) => category.ideas.length > 0);
}

export function placeholderFor(idea: IkigaiIdea, field: IkigaiFieldKey) {
  return idea.placeholders[field] ?? idea.label;
}
