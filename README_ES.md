<div align="center">

# Captura de secciones de página web (Webpage Section Screenshot)

**🌐 Idioma / Choose Language / 选择语言 / 言語を選択 / Choisir la langue / Sprache wählen / Seleccionar idioma / Selecionar idioma / 언어 선택 / Выберите язык**

| [🇨🇳 简体中文](README.md) | [🇺🇸 English](README_EN.md) | [🇯🇵 日本語](README_JA.md) | [🇫🇷 Français](README_FR.md) |
| :---: | :---: | :---: | :---: |
| [🇩🇪 Deutsch](README_DE.md) | [🇪🇸 Español](README_ES.md) | [🇵🇹 Português](README_PT.md) | [🇰🇷 한국어](README_KO.md) |
| [🇷🇺 Русский](README_RU.md) | | | |

</div>

Una extensión de **Chrome Manifest V3** que le permite seleccionar manualmente varias secciones de una página web mediante una regla de estilo Photoshop y guardar cada sección como una imagen PNG independiente. Admite la división de áreas mediante guías de regla, cuadros de selección con el ratón y la selección automática por clase CSS, con exportación en alta definición que se archiva automáticamente en carpetas nombradas por marca de tiempo.

## Características

### División de áreas (los tres métodos se pueden combinar)

- **Barra de regla en píxeles**: reglas en la parte superior (eje X) y en el extremo izquierdo (eje Y) de la página, con marcas y números, adaptadas a pantallas HiDPI
- **Arrastrar para crear guías**: mantenga pulsado el botón izquierdo del ratón sobre la regla y arrastre para crear guías verticales / horizontales
- **Gestión de guías**: las posiciones se pueden modificar arrastrando; haga clic en una guía para mostrar un botón de eliminación; admite borrar todas las guías de una vez
- **Cuadro de selección**: tras activar el modo de cuadro de selección, arrastre directamente sobre la página para seleccionar cualquier área; ese cuadro se convierte en una región de captura
- **Selección automática (Class)**: introduzca un nombre de clase CSS y la extensión crea automáticamente cuadros de selección para todos los elementos coincidentes

### Captura y exportación

- **Exportación en alta definición**: el lienzo de página completa y los PNG guardados se renderizan a `tamaño del documento × devicePixelRatio × EXPORT_SCALE`, con un aumento de 2× para una salida más nítida
- **Recorte de secciones en PNG**: con un clic se guarda cada región (celda de la cuadrícula de guías + cuadro de selección) como una imagen PNG independiente
- **Modal de progreso**: barra de progreso detallada, progreso actual/total, operación de cancelación y retroalimentación de finalización (con botón «abrir carpeta de descargas»)
- **Descarga de imágenes grandes**: utiliza un documento fuera de pantalla para enviar la data URL por segmentos y convertirla en un Blob, evitando el límite de 2 MB de `chrome.downloads` para las data URLs, de modo que las capturas de ultra alta resolución se guardan por completo
- **Archivado automático por tiempo**: cada lote se guarda en una carpeta independiente nombrada por la hora actual (p. ej. `2026年08月25日 14时30分55秒_500_A1B2`), evitando sobrescrituras y contaminación de directorios

### Usabilidad

- **Regla de nombre PNG**: `número_nombre_del_sitio.png` (p. ej. `1_example.png`), con el nombre del sitio extraído automáticamente de la URL
- **Persistencia de guías**: las guías se restauran automáticamente tras actualizar la página y están aisladas por URL para que las páginas diferentes no compartan guías
- **Atajo de teclado**: pulse `P` por defecto para alternar rápidamente el modo de cuadro de selección (`ESC` para salir), personalizable en Ajustes
- **Panel de ajustes**: permite configurar y persistir la tecla de atajo del cuadro de selección
- **Control de doble entrada**: Popup de la barra de herramientas del navegador + barra de herramientas flotante en la página

### Otros

- **Invitar al autor a un café**: popup de donación integrado con código QR para apoyar al autor

## Carga local (modo de desarrollo)

1. Abra Chrome y visite `chrome://extensions/`
2. Active el **modo de desarrollador** en la esquina superior derecha
3. Haga clic en **Cargar extensión sin empaquetar**
4. Seleccione el directorio raíz del plugin (la carpeta que contiene `manifest.json`)

## Instrucciones de uso

1. **Configurar guías**
   - Mueva el ratón sobre la **regla superior** de la página (eje X), mantenga pulsado el botón izquierdo y arrastre hacia abajo para crear una **guía horizontal** (una línea horizontal que representa la coordenada Y).
   - Mueva el ratón sobre la **regla izquierda** de la página (eje Y), mantenga pulsado el botón izquierdo y arrastre hacia la derecha para crear una **guía vertical** (una línea vertical que representa la coordenada X).
   - La coordenada actual (en píxeles) se muestra en tiempo real mientras se arrastra.
   - Las guías se posicionan según **coordenadas del documento** (fijadas al contenido de la página) y se mueven con la página al hacer scroll.
2. **Ajustar guías**
   - Mantenga pulsada una guía existente y arrástrela para cambiar su posición.
   - Haga clic en una guía para mostrar un botón rojo de eliminación; haga clic en él para borrar esa guía.
3. **Usar el cuadro de selección** (ideal para seleccionar con precisión una región)
   - Haga clic en el botón «Activar cuadro de selección» de la barra de herramientas (o pulse el atajo por defecto `P`).
   - Tras la activación, mantenga pulsado el botón izquierdo y arrastre directamente sobre la página; el rectángulo seleccionado se convierte en una región de captura. Se pueden seleccionar varias regiones a la vez.
   - Cada cuadro de selección tiene un botón de eliminación en su esquina superior derecha; pulse `P` de nuevo o `ESC` para salir del modo de selección.
   - El atajo se puede cambiar y guardar en Ajustes.
4. **Selección automática (Class)**
   - Haga clic en el botón «Selección automática (Class)» de la barra de herramientas.
   - Introduzca el nombre de la clase de los elementos de la página (el punto inicial `.` puede omitirse) y confirme.
   - La extensión crea automáticamente cuadros de selección para todos los elementos visibles que coinciden con esa clase.
5. **Iniciar el recorte**
   - Haga clic en el botón «Iniciar recorte PNG» de la barra de herramientas flotante o del Popup.
   - La extensión oculta las reglas / guías / cuadros de selección / barra de herramientas, captura región por región y muestra un modal de progreso.
   - Cada región se nombra como `número_nombre_del_sitio.png` y se guarda en una subcarpeta nombrada por la hora actual.
   - Tras la finalización, haga clic en «Abrir carpeta guardada» para ver los resultados directamente.
6. **Otros**
   - «Borrar todas las guías» elimina tanto todas las guías como todos los cuadros de selección.
   - «Ocultar/Mostrar regla» alterna la visualización de la barra de regla.
   - «Ajustes» cambia la tecla de atajo del cuadro de selección.
   - «Invitar al autor a un café» permite escanear un código QR para apoyar al autor.

## Estructura del proyecto

```
webpage-section-screenshot/
├── manifest.json                # Configuración de Manifest V3
├── background/
│   ├── service-worker.js        # Service Worker de fondo (captura/descarga del manejo de mensajes)
│   └── offscreen.html/.js       # Documento fuera de pantalla: conversión de data URL grande → Blob y ensamblaje de segmentos
├── content/
│   ├── index.js                 # Entrada del content script (ensamblaje de módulos e inyección de dependencias)
│   ├── constants.js             # Constantes y espacio de nombres global SSS
│   ├── Storage.js               # Envoltorio de chrome.storage
│   ├── BackgroundService.js     # Envoltorio de comunicación con el fondo (incluye descarga por segmentos)
│   ├── style.css                # Estilos dentro del Shadow DOM (aislados)
│   └── modules/                 # Módulos de funcionalidad (alta cohesión, bajo acoplamiento)
│       ├── Ruler.js             # Barra de regla
│       ├── GuideManager.js      # Gestión de guías (incluye persistencia por URL)
│       ├── SelectionManager.js  # Cuadros de selección (arrastre con ratón / selección automática por clase)
│       ├── ScreenshotManager.js # Captura de secciones y recorte (unión de lienzos por celda)
│       ├── Naming.js            # Reglas de nombre PNG y de carpeta con marca de tiempo
│       ├── ProgressModal.js     # Modal de progreso
│       ├── SettingsModal.js     # Modal de ajustes (configuración de atajos)
│       ├── CoffeeModal.js       # Modal Invitar a un café (donación)
│       ├── ClassSelectionModal.js # Modal de entrada para selección automática por clase
│       └── Toolbar.js           # Barra de herramientas flotante en la página
├── popup/
│   ├── popup.html               # Popup de la extensión
│   ├── popup.css
│   └── popup.js
├── lib/
│   └── html-to-image.js         # Solución complementaria de captura de página completa (SVG foreignObject)
├── assets/
│   ├── icons/                   # Iconos de la extensión (16/32/48/128)
│   └── pay_coffee.jpg           # Código QR de donación
└── README.md
```

## Notas técnicas

### Enfoque de captura (unión por scroll + recorte por región)

- **Enfoque principal**: **unión por scroll** — independientemente de lo larga/ancha que sea la página (incluidas las barras de scroll horizontales y verticales), primero divide la página completa en una cuadrícula según el tamaño de la ventana, luego hace scroll celda por celda y llama a `chrome.tabs.captureVisibleTab` para capturar la imagen renderizada real.
  - A diferencia del enfoque anterior del «lienzo de página completa», la implementación actual **ya no crea un enorme lienzo de página completa** (para evitar superar el límite de 32 000 píxeles del navegador y producir imágenes en blanco). En su lugar, **crea un lienzo independiente para cada región a guardar** y, al hacer scroll, dibuja la intersección entre la ventana y cada región directamente en el lienzo correspondiente, reduciendo significativamente el uso de memoria y el riesgo de fallo de unión.
  - Tanto las partes visibles como las invisibles (que requieren scroll) se guardan por completo.
  - Las guías / cuadros de selección son el único criterio de división; cada región = una celda de la cuadrícula de guías + los cuadros seleccionados por el usuario.
  - Utiliza capturas renderizadas reales, con mayor fidelidad que html2canvas.
- **Limitación de frecuencia de captura**: `captureVisibleTab` se limita (al menos 500 ms entre dos llamadas) y realiza automáticamente una espera exponencial y reintenta cuando ocurre un error de cuota de Chrome, evitando interrupciones durante la captura celda por celda.
- **Ampliación HiDPI**: `EXPORT_SCALE` (predeterminado 2) amplía aún más sobre el dpr para una salida PNG más nítida.
- **Enfoque complementario**: `lib/html-to-image.js` (SVG `foreignObject`), disponible como respaldo para escenarios extremos (p. ej. contenedores con scroll interno), ampliable según sea necesario.

### Descarga de imágenes grandes (documento fuera de pantalla + transferencia por segmentos)

- **Problema**: `chrome.downloads.download` que acepta directamente una data URL está limitado a **2 MB**, por lo que las capturas de ultra alta resolución pueden fallar o guardarse erróneamente como `.txt`; y `URL.createObjectURL` no está disponible en un Service Worker MV3.
- **Enfoque**: crear dinámicamente un **documento fuera de pantalla**, que realiza la conversión `data URL → Blob → blob URL` en un entorno DOM normal.
  - El content script divide la data URL grande en segmentos de 4 MB y los envía uno a uno (`DOWNLOAD_CHUNK`); el documento fuera de pantalla los acumula por nombre de archivo;
  - Una vez enviados todos los segmentos, se le notifica para ensamblarlos en orden en un Blob y generar una blob URL (`DOWNLOAD_ASSEMBLE`); los segmentos faltantes causan un error en lugar de producir un archivo corrupto;
  - La acción de descarga final la realiza el Service Worker usando la blob URL mediante `chrome.downloads.download` (el documento fuera de pantalla no tiene ese permiso).
- Cada imagen se guarda en una subcarpeta nombrada por marca de tiempo, evitando sobrescrituras y contaminación de directorios.

### Arquitectura del código (alta cohesión, bajo acoplamiento)

- Cada módulo de funcionalidad se encapsula de forma independiente bajo `content/modules/`, montado en el espacio de nombres global `SSS` (cargado en orden de dependencias por el manifest, no como módulos ES).
- La entrada `index.js` solo es responsable de **la inyección de dependencias y el ensamblaje**, sin lógica de negocio.
- Los módulos se comunican mediante **callbacks / mensajes**, evitando dependencias directas.
- Toda la interfaz vive dentro de un **Shadow DOM**, completamente aislada de los estilos de la página host.
- La persistencia de guías se almacena aislada por URL (`{ sss_guides : { [url] : [] } }`), usando una cola serializada para evitar condiciones de carrera de lectura-modificación-escritura.

### Notas

- La unión de página completa depende de la API de captura de ventana del navegador y hace scroll de toda la página celda por celda; cuanto más grande sea la página, más tiempo tardará (aproximadamente 250 ms de espera por celda para que finalice el renderizado).
- Si la página contiene elementos `position: fixed` (p. ej. una barra de navegación fija), esos elementos aparecen en cada segmento de ventana durante la unión, una limitación inherente de la captura de página completa.
- Las coordenadas de las guías se basan en el documento (scroll de `window`); si el cuerpo de la página vive en un contenedor con scroll interno, es posible que deba apuntar a ese contenedor.
- Debido a las restricciones de seguridad del navegador, algunas páginas especiales (p. ej. `chrome://`, Chrome Web Store) no se pueden inyectar.
- Cuando una página contiene recursos de tipo cross-origin, la API de captura devuelve la imagen realmente renderizada, sin verse afectada por la contaminación cross-origin del lienzo.

## Lista de pruebas

- [x] Todos los archivos JS pasan la verificación de sintaxis (`node --check`)
- [x] `manifest.json` pasa la validación JSON; todos los archivos referenciados existen
- [x] Pruebas unitarias de la regla de nombre (URL → nombre del sitio → nombre de archivo)
- [x] Pruebas unitarias del algoritmo de partición (número de regiones, cobertura total del área, sin superposición)
- [ ] Captura real en varias páginas típicas (páginas largas, páginas con scroll, páginas con elementos fijos)
- [ ] Prueba real del arrastre, modificación, eliminación y borrado de todo de las guías
- [ ] Prueba real del arrastre del cuadro de selección, alternancia de atajos y selección automática por clase
- [ ] Prueba real del modal de progreso, cancelación, descarga por segmentos muy largos y apertura de carpeta

> Consejo: tras cargar la extensión, abra cualquier página web y recorra los flujos anteriores. Si tiene problemas, haga clic derecho en la página → «Inspeccionar» → Consola y busque registros con el prefijo `[SSS]`.
