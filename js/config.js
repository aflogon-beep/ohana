/* ==========================================================
   LA EXPEDICIÓN OHANA — Configuración
   Todo lo personalizable está aquí. Los códigos no distinguen
   mayúsculas, tildes ni espacios.
   ========================================================== */
window.OHANA = {
  jugadores: ['Emma', 'Álvaro'],

  // Imágenes opcionales (si no existen, se muestra un medallón con la inicial)
  avatares: {
    'Emma': 'assets/emma.png',
    'Álvaro': 'assets/alvaro.png'
  },
  fotoFamilia: 'assets/familia.jpg',

  // Compañeros de aventura (PNG con fondo transparente). Si no existen, no se muestran.
  mascotas: [
    { nombre: 'El ratón explorador', src: 'assets/raton.png' },
    { nombre: 'El alienígena azul', src: 'assets/alien.png' }
  ],

  // Premio
  premio: {
    destino: 'Disneyland París',
    cuando: 'Verano 2027',
    duracion: '5 días · 4 noches',
    pasajeros: 'Toda la familia Ohana'
  },

  fechaBoda: '19 · 11 · 2026',
  mensajeFinal: [
    'Hoy, el día de nuestra boda, queríamos regalaros lo más importante:',
    'tiempo juntos, aventuras juntos… y muchos recuerdos juntos.',
    'Porque Ohana significa familia,',
    'y familia significa que nadie se queda atrás ni se olvida.'
  ],
  firma: 'Con todo nuestro amor',

  toquesCofre: 100,
  pinPadres: '1911',

  // Frase que se va revelando, una palabra por fragmento
  palabras: ['OHANA', 'SIGNIFICA', 'FAMILIA', 'NADIE', 'SE QUEDA', 'ATRÁS'],

  pistas: [
    {
      lugar: 'Nevera',
      titulo: 'La Cueva del Invierno Eterno',
      codigo: 'ESCARABAJO',
      enigma: [
        'Llevo el invierno encerrado aunque fuera arda el verano,',
        'y mi luz sólo despierta cuando me abre vuestra mano.',
        'Zumbo bajito de noche; nunca duermo, nunca ceno,',
        'pero todas vuestras cenas pasan antes por mi seno.',
        'Buscad en mi pecho de escarcha, entre lo frío y lo bueno.'
      ],
      ayudas: [
        'No está en ningún dormitorio. Pensad en el sitio de la casa donde más se come.',
        'Tiene puerta, tiene luz dentro y todo lo que guarda está frío. Mirad en sus estantes.'
      ]
    },
    {
      lugar: 'Cojín del sofá',
      titulo: 'El Trono de los Mil Bostezos',
      codigo: 'OBSIDIANA',
      enigma: [
        'Tengo brazos y no abrazo, tengo patas y no ando,',
        'tengo espalda y no me duele, y aguanto a todos descansando.',
        'Frente a mí brilla una ventana que no da a ningún lugar,',
        'y en mí os dormís los domingos sin poderlo remediar.',
        'Pero no busquéis en mi tripa: el secreto se esconde atrás',
        'de esos blanditos que abrazáis cuando el miedo os viene a buscar.'
      ],
      ayudas: [
        'Una «ventana que no da a ningún lugar» es la tele. ¿Qué hay justo enfrente de ella?',
        'Es el sofá… pero la pista está detrás de uno de sus cojines.'
      ]
    },
    {
      lugar: 'Bañera',
      titulo: 'El Lago Blanco',
      codigo: 'JAGUAR',
      enigma: [
        'Me lleno sin tener sed y me vacío sin llorar;',
        'tengo un ombligo de plata por donde se escapa el mar.',
        'Soy un lago blanco y quieto encerrado entre azulejos,',
        'donde los barcos de juguete navegan sin ir muy lejos.',
        'Hoy no tengo agua ni espuma: asomaos sin ningún miedo,',
        'que el siguiente fragmento os espera en mi fondo… seco.'
      ],
      ayudas: [
        'El «ombligo de plata» es un desagüe. ¿Dónde hay agua, azulejos y desagüe?',
        'Es el cuarto de baño. No el lavabo: algo mucho más grande donde os bañáis.'
      ]
    },
    {
      lugar: 'Lavadora',
      titulo: 'El Remolino del Cíclope',
      codigo: 'PAPIRO',
      enigma: [
        'Soy un cíclope de un solo ojo, redondo y de cristal;',
        'me trago lo que huele a aventura y lo devuelvo oliendo a rosal.',
        'Bailo, giro y centrifugo, y por más vueltas que doy no me mareo;',
        'y si algún calcetín desaparece… a mí no me miréis, que yo no lo veo.',
        'Abrid mi ojo de cristal, aunque os mire con recelo:',
        'el fragmento duerme en mi tripa, sin jabón y sin pañuelo.'
      ],
      ayudas: [
        'El «ojo de cristal» es una puerta redonda. ¿Qué máquina de casa gira y gira sin parar?',
        'Lo que «huele a aventura» es la ropa sucia. Abrid la lavadora.'
      ]
    },
    {
      lugar: 'Nintendo Switch 2',
      titulo: 'El Reino de Bolsillo',
      codigo: 'BRUJULA',
      enigma: [
        'Nací en el país donde el sol madruga más que en ningún lugar,',
        'y soy la segunda de mi nombre: mi hermana mayor se fue a jubilar.',
        'Dos gemelas de colores se agarran a mis costados,',
        'y en una casita negra duermo recargando mis reinados.',
        'Guardo carreras, fontaneros y mundos sin final:',
        'buscad el fragmento junto a mí… ¡pero hoy no se juega, es un ritual!'
      ],
      ayudas: [
        'Las «gemelas de colores» son dos mandos que se enganchan a los lados. ¿Qué aparato es?',
        'Es la Nintendo Switch 2. Buscad junto a ella, en su base o en su funda.'
      ]
    },
    {
      lugar: 'Debajo del colchón de Álvaro',
      titulo: 'El Guardián de los Sueños',
      codigo: 'CALAVERA',
      enigma: [
        'Cada noche me aplastas y jamás me quejo;',
        'guardo sueños, pesadillas y algún calcetín viejo.',
        'Soy blandito por arriba y misterioso por abajo,',
        'y llevo años sosteniendo a un explorador muy majo.',
        'No soy de la mayor: soy del explorador más pequeño.',
        'Levantadme con cuidado… el último fragmento duerme bajo su sueño.'
      ],
      ayudas: [
        'El «explorador más pequeño» de esta expedición es Álvaro. ¿Dónde duerme cada noche?',
        'Está en la cama de Álvaro. No encima: debajo del colchón.'
      ]
    }
  ]
};
