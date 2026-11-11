# La Expedición Ohana

Búsqueda del tesoro familiar para tablet: 6 enigmas, 6 fragmentos de mapa, un puzzle, un cofre de 200 toques y un premio.

> ⚠️ **Spoilers**: este README y `js/config.js` contienen las soluciones. ¡No dejéis que lo lean los exploradores!

## Cómo jugar
1. Abre la web en el navegador Chrome de la tablet Android.
2. En el menú ⋮, pulsa **Añadir a pantalla de inicio**. Se abrirá a pantalla completa como una app.
3. Pulsa **Comenzar la aventura**. Activa el sonido de la tablet.

**Turnos.** Para que nadie se enfade, el juego reparte los turnos y los anuncia con un cartel a pantalla completa:
- **Enigmas:** se alternan (empieza Emma). Quien tiene el turno «lleva el timón»: lee el enigma y escribe el código. El otro es su mano derecha y decide si se pide una ayuda.
- **Puzzle:** el turno cambia cada vez que una pieza encaja, así que cada uno coloca tres.
- **Cofre:** los dos a la vez.

La tablet no sabe de quién es el dedo: el turno se anuncia, no se bloquea por jugador.

El progreso se guarda solo. Si se cierra la app, al volver aparece **Continuar la aventura**.

## Preparación (para los padres)
1. Imprime `tarjetas.html` (botón *Imprimir*), recorta las 6 tarjetas y escóndelas:

| # | Escondite | Enigma | Código |
|---|-----------|--------|--------|
| 1 | Nevera | La Cueva del Invierno Eterno | ESCARABAJO |
| 2 | Detrás de un cojín del sofá | El Trono de los Mil Bostezos | OBSIDIANA |
| 3 | Bañera | El Lago Blanco | JAGUAR |
| 4 | Dentro de la lavadora | El Remolino del Cíclope | PAPIRO |
| 5 | Junto a la Nintendo Switch 2 | El Reino de Bolsillo | BRUJULA |
| 6 | Debajo del colchón de Álvaro | El Guardián de los Sueños | CALAVERA |

2. **Panel secreto de padres:** mantén pulsada 1,5 s la brújula de arriba a la izquierda. El PIN es `1911`. Desde ahí puedes ver los códigos, saltar una pista, ir al puzzle, al cofre o al premio, o reiniciar.
3. Para probar sin jugar, añade al final de la URL: `?ir=clue`, `?ir=puzzle`, `?ir=chest` o `?ir=reveal`. Después **reinicia desde el panel de padres** antes del gran día.

## Personalizar
Todo está en `js/config.js`: textos, enigmas, ayudas, códigos, premio y mensaje final. Ahí están también los turnos (`turnos.empieza` para elegir quién lleva el primer enigma, `turnos.activo: false` para jugar sin turnos) y el color de cada jugador (`colores`).

Imágenes opcionales en `assets/` (si no existen, el juego funciona igual):
- `assets/emma.png` y `assets/alvaro.png`: avatares en la carta inicial y en la ficha de turno.
- `assets/familia.jpg`: foto en la pantalla del premio.
- `assets/raton.png` y `assets/alien.png`: compañeros de aventura, en PNG con fondo transparente.

## Técnica
Hecho en HTML, CSS y JavaScript, sin dependencias ni compilación. Los gráficos son SVG y canvas, y la música y los efectos se generan con Web Audio. Las fuentes (Fredoka, Nunito y Caveat) están en `fonts/`, así que no hace falta conexión ni la primera vez. Funciona sin conexión gracias al service worker y se publica con GitHub Pages.

El sistema visual («Isla Ohana») está al principio de `css/style.css`: colores, radios, sombras, espaciados y curvas de animación como variables CSS. Si cambias algún archivo, sube el número de versión de la caché en `sw.js`.
