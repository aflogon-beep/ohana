# La Expedición Ohana

Búsqueda del tesoro familiar para tablet: 6 enigmas, 6 fragmentos de mapa, un puzzle, un cofre de 100 toques y un premio.

> ⚠️ **Spoilers**: este README y `js/config.js` contienen las soluciones. ¡No dejéis que lo lean los exploradores!

## Cómo jugar
1. Abre la web en el navegador Chrome de la tablet Android.
2. En el menú ⋮, pulsa **Añadir a pantalla de inicio**. Se abrirá a pantalla completa como una app.
3. Pulsa **Comenzar la aventura**. Activa el sonido de la tablet.

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
Todo está en `js/config.js`: textos, enigmas, ayudas, códigos, premio y mensaje final.

Imágenes opcionales en `assets/` (si no existen, el juego funciona igual):
- `assets/emma.png` y `assets/alvaro.png`: avatares en la carta inicial.
- `assets/familia.jpg`: foto en la pantalla del premio.
- `assets/raton.png` y `assets/alien.png`: compañeros de aventura, en PNG con fondo transparente.

## Técnica
Hecho en HTML, CSS y JavaScript, sin dependencias. Los gráficos son SVG y canvas, y la música y los efectos se generan con Web Audio. Funciona sin conexión gracias al service worker y se publica con GitHub Pages.
