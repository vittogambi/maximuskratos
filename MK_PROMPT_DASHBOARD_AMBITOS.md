# Prompt: el dashboard de los tres ámbitos

Especificación de ejecución. El resultado es la pantalla de la referencia, usable: la estatua al centro, tres círculos que se aprietan, y adentro las tareas de ese ámbito. No es un rediseño de la auditoría ni un índice nuevo de la matriz.

Fecha: 30 sep 2026. Se ejecuta encima de `MK_PROMPT_MAESTRO_RECORRIDO.md` y de lo ya registrado en `MK_IMPLEMENTATION_PROGRESS.md`. La referencia visual es la foto del panel con la estatua de cuerpo entero, los círculos Mente 74, Espíritu 82, Cuerpo 65 y la placa 78. Esos cuatro números son el ejemplo pintado en la foto. No se hardcodean.

## 0. Qué tiene que poder hacer una persona

Entra a Inicio y ve el panel. Aprieta el círculo de Mente, o Espíritu, o Cuerpo. Entra a las tareas de ese ámbito. Agrega una, la marca hecha, vuelve al panel y el número de ese círculo cambió porque el servidor lo recalculó. Lo mismo desde el riel izquierdo: el nombre del ámbito abre la misma pantalla que el círculo.

Si no hay tareas, el panel se ve igual de armado. Los círculos se pueden apretar. La placa no inventa un 78.

## 1. La composición, literal

Un solo plano. Fondo `#0a0a0a`, sin la foto de columnas detrás de este panel. El riel y el escenario son la pantalla.

### 1.1 Riel

Ancho cercano a 220 px, alto de la ventana, negro. Arriba, el escudo que ya usa el sitio, chico. Debajo, la lista, en este orden:

1. Espíritu
2. Mente
3. Cuerpo
4. Calendario / Tareas
5. Planes
6. Perfil
7. Asesores

Ruta MK y Cuenta siguen existiendo. En este panel no ocupan una fila del riel de la foto. Ruta se alcanza desde Perfil o desde el acceso secundario. Cuenta sigue en el avatar.

Cada fila: icono de línea a la izquierda, nombre en mayúsculas, tracking ancho, Hanken, gris. La fila activa: barra roja de 2 px en el borde izquierdo del riel, icono y texto en blanco. El rojo de la barra es `#c00100`. Espíritu, Mente y Cuerpo dejan de apuntar a `/perfil` y a `/perfil#mente`. Apuntan a `/espiritu`, `/mente` y `/cuerpo`.

Arriba a la derecha del escenario, el círculo de la cuenta. Abre Cuenta.

### 1.2 La figura

Centro del escenario, de la cabeza al pedestal, con aire negro alrededor. Figura de mármol, cuerpo entero, de pie, paño en la cadera, brazos bajos, sobre un pedestal redondo. Archivo: `apps/web/public/images/landing/statue-standing.jpg`. Si el archivo actual es un busto o un recorte que no llega a los pies, se reemplaza por una figura de cuerpo entero en esa pose, fondo que se funda con `#0a0a0a`. No se usa `statue-aligned.jpg` para este panel.

Detrás de la figura, un dibujo de construcción en SVG, gris muy bajo (cerca de `rgba(255,255,255,0.14)`): un círculo centrado en el torso, un triángulo de la cabeza a la base, y un rectángulo de encuadre. No es una imagen de stock ni una escena.

### 1.3 Los tres círculos

Flotan fuera de la silueta. Trazo rojo de 1.5 px, interior del color del fondo, número en blanco con Bitte. Encima de cada círculo, el nombre en rojo, chico, mayúsculas, tracking ancho: MENTE, ESPÍRITU, CUERPO.

Líneas guía rojas, 1 px, desde el cuerpo hasta el círculo:

- Mente: de la sien al círculo, a la izquierda de la cabeza.
- Espíritu: del hombro al círculo, a la derecha del pecho.
- Cuerpo: del muslo, en vertical, al círculo entre las piernas, encima del pedestal.

El área de apriete es el círculo más el nombre, como mínimo 44 px. Teclado: cada círculo es un enlace con foco visible. El estado hover aclara el trazo y acerca el círculo 2 px hacia la figura. Al apretar, ese círculo permanece y los otros dos bajan de opacidad mientras entra la pantalla del ámbito.

### 1.4 La placa

Debajo del pedestal, un rectángulo del ancho de la figura, trazo `rgba(255,255,255,0.28)`, fondo transparente. Centrado, en rojo chico: ÍNDICE DE ALINEACIÓN MK. Debajo, un solo número blanco, el más grande de la pantalla, en Bitte.

En esta versión ese número es la ejecución de la semana, no un índice de la auditoría. Definición, en el servidor: de las acciones vigentes de los tres ámbitos con registro esperado esta semana, el porcentaje marcado HECHO, redondeado. Sin acciones vigentes, la placa muestra el glifo vacío `—`, no un cero disfrazado de lectura y no 78.

Los círculos usan la misma cuenta, partida por ámbito. Sin acciones en ese ámbito, el círculo no muestra un porcentaje. Muestra el nombre y queda apretables. El porcentaje aparece cuando hay al menos una acción vigente de ese ámbito.

Esos números no salen de `mk_global`, ni de `clarity`, ni de las bandas de 115 o de 60. Esas sumas siguen en Perfil.

## 2. Qué es un ámbito

Una acción del plan vigente pertenece a un ámbito: `MENTE`, `ESPIRITU` o `CUERPO`. El campo vive en `PlanAction`. Migración aditiva. Las acciones ya creadas quedan sin ámbito y se ven en Planes, no en la estatua, hasta que la persona les asigna uno.

No se inventan tareas al entrar. El ámbito vacío tiene un solo control: agregar una tarea. Pide enunciado, criterio de realización, y el día de la semana si aplica. Se guarda en el plan vigente. Si no hay plan vigente, el servidor crea uno activo de la cuenta, título "Plan vigente", y cuelga ahí la acción. No se pide un formulario previo.

Dentro del ámbito la persona ve solo sus acciones, el registro de hoy en `America/Santiago`, y puede marcar hecho, omitido o no aplica. Es el mismo `ActionRecord` del calendario. Marcar aquí y marcar en Calendario es la misma fila.

Desde el ámbito se vuelve al panel. Calendario sigue mostrando la semana entera, con el ámbito escrito en cada acción.

## 3. Movimiento

Member app, no la cinemática del landing. Tokens de `apps/web/components/motion/tokens.ts`: `APP_MOTION` para listas y controles, `MOTION_EASE.enter` para la entrada del panel. Librería ya usada: `motion/react`. `useReducedMotion()` apaga trazos, conteo y desplazamientos. Con reducción, el panel aparece quieto y completo.

Entrada del panel, una sola vez por visita:

1. La figura está. El dibujo de construcción se traza en unos 0,7 s.
2. Las tres líneas guía se dibujan, escalonadas 0,08 s.
3. Los círculos aparecen al llegar la línea.
4. Si hay porcentaje, el número cuenta desde 0 hasta el valor del servidor en unos 0,4 s. Si el servidor dice vacío, no hay conteo.

Cambiar de ámbito: 0,16 s, el círculo elegido se queda y la lista entra desde 8 px abajo. Volver al panel reconstruye las líneas sin repetir el conteo si el número no cambió.

Nada de rebote, nada de brillo que recorra la estatua, nada de partículas.

## 4. Teléfono

Cerca de 390 px el riel no se aplasta. Sigue la barra inferior: Inicio, Ruta, Calendario, Perfil. Espíritu, Mente y Cuerpo se aprietan en la propia estatua, que pasa arriba, con los tres círculos todavía fuera de la silueta y la placa debajo. Si no caben los tres a los lados, Cuerpo queda bajo el pedestal y Mente y Espíritu a los lados de la cabeza, en la misma relación de la foto. El acceso Más conserva Planes, Asesores y Cuenta.

Cerca de 768 px se comprueba aparte: o entra el riel completo, o se mantiene el patrón del teléfono. No se dejan etiquetas cortadas.

## 5. Qué no se hace

- No se pintan 74, 82, 65 ni 78.
- No se calcula Alineación ni Profundidad con las bandas del Excel. El rótulo de la placa nombra la ejecución de la semana, y el prompt lo deja escrito así para que nadie lo lea como resultado de ficha.
- No se mueve el puntaje de `formularios-x-paso` ni la versión `1.0`.
- No se abre el IKIGAI público desde un círculo.
- No se agregan tareas de ejemplo, asesores ficticios ni una curva de cuatro semanas.
- No se reescribe el player del diagnóstico.

Perfil Maestro sigue siendo la lectura de las fichas. Este panel es la ejecución.

## 6. Verificación

Cuenta de revisión local. Otra cuenta normal no ve estas rutas: el API responde 403 y la web la deja en el panel de fundador.

En el navegador, a 1440 y a 390:

1. Inicio es esta composición, con la figura de cuerpo entero y la placa vacía si no hay tareas.
2. Apriete de cada círculo y de cada fila del riel abre su ámbito.
3. Agregar una tarea en Mente y marcarla hecha cambia solo el círculo de Mente y la placa, al valor que devuelve el servidor.
4. La misma tarea aparece en Calendario con el ámbito Mente.
5. Recargar no duplica la tarea ni el registro.
6. Con `prefers-reduced-motion`, no hay trazos ni conteo, y los círculos siguen funcionando.
7. Foco visible en los tres círculos y en el control de agregar. El primario deshabilitado, si lo hay, dice el motivo en texto.

Capturas del panel vacío y del panel con una tarea hecha, en `tmp/dashboard-ambitos/`, a 1440 y a 390. Si la estatua no es de cuerpo entero, o los círculos son chips debajo de la foto, o la placa muestra un número que el servidor no devolvió, no está terminado.

Actualizar `MK_IMPLEMENTATION_PROGRESS.md`. No commitear salvo que se pida.
