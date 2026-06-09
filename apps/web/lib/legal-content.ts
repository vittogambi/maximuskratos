import { siteConfig } from '@/lib/design';

/** Datos de contacto legales — editar cuando tengan datos definitivos */
export const legalContact = {
  email: 'contacto@maximuskratos.com',
  /** Ej.: "Maximus Kratos SpA", "Persona natural", etc. */
  entity: siteConfig.name,
  /** Ej.: "Santiago, Chile" */
  jurisdiction: '[País / ciudad — completar]',
} as const;

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: ReadonlyArray<string>;
  list?: ReadonlyArray<string>;
};

export type LegalDocument = {
  title: string;
  eyebrow: string;
  lastUpdated: string;
  intro: string;
  sections: ReadonlyArray<LegalSection>;
  footerNote: string;
};

const sharedIntro = (topic: string) =>
  `Este documento describe de forma general cómo ${legalContact.entity} («nosotros», «nuestro» o «la Plataforma») trata la información en relación con ${topic}. Es un borrador orientativo: debe revisarse y adaptarse con asesoría legal antes de su publicación definitiva.`;

export const privacyPolicy: LegalDocument = {
  title: 'Política de Privacidad',
  eyebrow: 'MK · PRIVACIDAD',
  lastUpdated: '9 de junio de 2026',
  intro: sharedIntro('el uso de nuestro sitio web y servicios digitales'),
  sections: [
    {
      id: 'responsable',
      title: '1. Responsable del tratamiento',
      paragraphs: [
        `El responsable del tratamiento de los datos personales es ${legalContact.entity}, con domicilio en ${legalContact.jurisdiction}.`,
        `Para consultas sobre privacidad puedes escribir a ${legalContact.email}.`,
      ],
    },
    {
      id: 'datos',
      title: '2. Datos que recopilamos',
      paragraphs: [
        'Podemos recopilar las siguientes categorías de información, según cómo interactúes con la Plataforma:',
      ],
      list: [
        'Datos de identificación y contacto: nombre, correo electrónico y otros datos que nos entregues voluntariamente.',
        'Datos de cuenta: credenciales de acceso, preferencias y actividad asociada a tu perfil.',
        'Datos de uso: páginas visitadas, interacciones, dispositivo, navegador e información técnica similar.',
        'Datos de comunicación: mensajes enviados a través de formularios de contacto o solicitudes de información.',
      ],
    },
    {
      id: 'finalidades',
      title: '3. Finalidades del tratamiento',
      paragraphs: ['Utilizamos tus datos personales para:'],
      list: [
        'Prestar, mantener y mejorar nuestros servicios y la experiencia en la Plataforma.',
        'Gestionar el registro de usuarios, autenticación y acceso a funcionalidades.',
        'Responder consultas, solicitudes de contacto y comunicaciones operativas.',
        'Enviar información relevante sobre el servicio, siempre que exista una base legal o tu consentimiento.',
        'Cumplir obligaciones legales, prevenir fraude y proteger la seguridad de la Plataforma.',
      ],
    },
    {
      id: 'base-legal',
      title: '4. Base legal',
      paragraphs: [
        'El tratamiento de tus datos se fundamenta, según el caso, en tu consentimiento, la ejecución de un contrato o relación precontractual, el cumplimiento de obligaciones legales, o el interés legítimo de operar y asegurar la Plataforma.',
        'Puedes retirar tu consentimiento cuando el tratamiento se base en él, sin que ello afecte la licitud del tratamiento previo.',
      ],
    },
    {
      id: 'cookies',
      title: '5. Cookies y tecnologías similares',
      paragraphs: [
        'Utilizamos cookies y tecnologías similares para el funcionamiento del sitio, recordar preferencias y analizar el uso de forma agregada.',
        'Puedes configurar tu navegador para rechazar cookies; algunas funciones podrían dejar de estar disponibles.',
      ],
    },
    {
      id: 'comparticion',
      title: '6. Compartición y encargados',
      paragraphs: [
        'No vendemos tus datos personales. Podemos compartirlos con proveedores que nos prestan servicios (por ejemplo, hosting, correo electrónico o analítica), siempre bajo obligaciones de confidencialidad y solo en la medida necesaria.',
        'También podemos divulgar información cuando la ley lo exija o para proteger derechos, seguridad o integridad de usuarios y de la Plataforma.',
      ],
    },
    {
      id: 'conservacion',
      title: '7. Conservación',
      paragraphs: [
        'Conservamos los datos personales durante el tiempo necesario para cumplir las finalidades descritas, resolver disputas, cumplir obligaciones legales y hacer valer nuestros acuerdos.',
        'Cuando ya no sean necesarios, los eliminaremos o anonimizaremos de forma razonable.',
      ],
    },
    {
      id: 'derechos',
      title: '8. Tus derechos',
      paragraphs: [
        'Según la legislación aplicable en tu jurisdicción, puedes tener derecho a acceder, rectificar, suprimir, oponerte, limitar el tratamiento, solicitar portabilidad o revocar el consentimiento.',
        `Para ejercer estos derechos, escríbenos a ${legalContact.email} indicando tu solicitud y un medio para verificar tu identidad.`,
      ],
    },
    {
      id: 'seguridad',
      title: '9. Seguridad',
      paragraphs: [
        'Implementamos medidas técnicas y organizativas razonables para proteger los datos personales. Ningún sistema en línea puede garantizar seguridad absoluta.',
      ],
    },
    {
      id: 'menores',
      title: '10. Menores de edad',
      paragraphs: [
        'La Plataforma no está dirigida a menores de edad. Si detectamos que hemos recopilado datos de un menor sin el consentimiento parental correspondiente, procederemos a eliminarlos.',
      ],
    },
    {
      id: 'cambios',
      title: '11. Cambios a esta política',
      paragraphs: [
        'Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente en esta página e indicaremos la fecha de última actualización.',
        'El uso continuado de la Plataforma tras los cambios implica tu aceptación de la política revisada, en la medida permitida por la ley.',
      ],
    },
  ],
  footerNote:
    'Este texto es un modelo genérico. Reemplaza los campos marcados como pendientes y valida el contenido con un profesional legal antes de usarlo en producción.',
};

export const termsOfService: LegalDocument = {
  title: 'Términos de Servicio',
  eyebrow: 'MK · TÉRMINOS',
  lastUpdated: '9 de junio de 2026',
  intro: sharedIntro('el acceso y uso de nuestro sitio web, cuenta de usuario y servicios asociados'),
  sections: [
    {
      id: 'aceptacion',
      title: '1. Aceptación de los términos',
      paragraphs: [
        `Al acceder o utilizar la Plataforma operada por ${legalContact.entity}, aceptas estos Términos de Servicio y nuestra Política de Privacidad.`,
        'Si no estás de acuerdo, no debes utilizar la Plataforma.',
      ],
    },
    {
      id: 'servicio',
      title: '2. Descripción del servicio',
      paragraphs: [
        `${siteConfig.name} ofrece contenido, herramientas y funcionalidades digitales orientadas al desarrollo personal y profesional, según lo descrito en el sitio en cada momento.`,
        'Podemos modificar, suspender o discontinuar funciones del servicio, total o parcialmente, con o sin previo aviso.',
      ],
    },
    {
      id: 'cuenta',
      title: '3. Registro y cuenta',
      paragraphs: [
        'Para acceder a ciertas funciones debes crear una cuenta y proporcionar información veraz y actualizada.',
        'Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada desde tu cuenta.',
        'Debes notificarnos de inmediato cualquier uso no autorizado o sospecha de compromiso de seguridad.',
      ],
    },
    {
      id: 'uso-permitido',
      title: '4. Uso permitido',
      paragraphs: ['Te comprometes a utilizar la Plataforma de forma lícita y conforme a estos términos. En particular, no debes:'],
      list: [
        'Violar leyes aplicables ni derechos de terceros.',
        'Intentar acceder sin autorización a sistemas, cuentas o datos.',
        'Interferir con el funcionamiento, seguridad o disponibilidad del servicio.',
        'Distribuir malware, spam o contenido fraudulento.',
        'Reproducir, revender o explotar comercialmente el servicio sin autorización expresa.',
      ],
    },
    {
      id: 'contenido',
      title: '5. Contenido y propiedad intelectual',
      paragraphs: [
        'El contenido, marca, diseño, software y materiales de la Plataforma son propiedad de nosotros o de nuestros licenciantes y están protegidos por las leyes de propiedad intelectual.',
        'Se te concede una licencia limitada, no exclusiva y revocable para usar la Plataforma conforme a estos términos. No adquieres derechos de propiedad sobre el contenido salvo lo expresamente indicado.',
      ],
    },
    {
      id: 'contenido-usuario',
      title: '6. Contenido que proporcionas',
      paragraphs: [
        'Si envías información, mensajes o materiales a través de la Plataforma, declaras que tienes derecho a hacerlo y que no infringen derechos de terceros.',
        'Podemos usar dicho contenido para operar el servicio, responder solicitudes y mejorar la Plataforma, en la medida permitida por la ley y nuestra Política de Privacidad.',
      ],
    },
    {
      id: 'pagos',
      title: '7. Pagos y suscripciones',
      paragraphs: [
        'Algunos servicios pueden requerir pago. Los precios, condiciones y métodos de pago se informarán antes de la contratación.',
        'Salvo que la ley exija lo contrario o se indique expresamente, los pagos no son reembolsables una vez confirmado el acceso al servicio contratado.',
      ],
    },
    {
      id: 'disclaimer',
      title: '8. Descargo de responsabilidad',
      paragraphs: [
        'La Plataforma y su contenido se ofrecen «tal cual» y «según disponibilidad», sin garantías de ningún tipo, expresas o implícitas.',
        'No garantizamos resultados específicos derivados del uso del servicio. El contenido tiene fines informativos y de acompañamiento; no sustituye asesoría médica, psicológica, legal ni profesional especializada.',
      ],
    },
    {
      id: 'limitacion',
      title: '9. Limitación de responsabilidad',
      paragraphs: [
        'En la máxima medida permitida por la ley, no seremos responsables por daños indirectos, incidentales, especiales, consecuenciales o pérdida de beneficios derivados del uso o la imposibilidad de uso de la Plataforma.',
        'Nuestra responsabilidad total acumulada por cualquier reclamación relacionada con el servicio se limitará al monto que hayas pagado por el servicio en los doce (12) meses anteriores al hecho que originó la reclamación, o a cero si no realizaste pagos.',
      ],
    },
    {
      id: 'suspension',
      title: '10. Suspensión y terminación',
      paragraphs: [
        'Podemos suspender o cerrar tu acceso si incumples estos términos, si es necesario por razones de seguridad o si discontinuamos el servicio.',
        'Puedes dejar de usar la Plataforma en cualquier momento. Las disposiciones que por su naturaleza deban sobrevivir a la terminación seguirán vigentes.',
      ],
    },
    {
      id: 'ley',
      title: '11. Ley aplicable y jurisdicción',
      paragraphs: [
        `Estos términos se regirán por las leyes de ${legalContact.jurisdiction}, sin perjuicio de normas imperativas de protección al consumidor que puedan aplicarte.`,
        'Cualquier controversia se someterá a los tribunales competentes del domicilio del responsable, salvo disposición legal en contrario.',
      ],
    },
    {
      id: 'contacto',
      title: '12. Contacto',
      paragraphs: [
        `Para consultas sobre estos Términos de Servicio, escríbenos a ${legalContact.email}.`,
      ],
    },
    {
      id: 'cambios',
      title: '13. Cambios a estos términos',
      paragraphs: [
        'Podemos actualizar estos Términos de Servicio. La versión vigente estará disponible en esta página con la fecha de última actualización.',
        'Si los cambios son sustanciales, procuraremos informarlo por medios razonables. El uso continuado del servicio tras la publicación de cambios constituye aceptación de los términos revisados.',
      ],
    },
  ],
  footerNote:
    'Este texto es un modelo genérico. Reemplaza los campos marcados como pendientes y valida el contenido con un profesional legal antes de usarlo en producción.',
};
