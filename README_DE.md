<div align="center">

# Webseiten-Abschnitts-Screenshot (Webpage Section Screenshot)

**🌐 Sprache / Choose Language / 选择语言 / 言語を選択 / Choisir la langue / Sprache wählen / Seleccionar idioma / Selecionar idioma / 언어 선택 / Выберите язык**

| [🇨🇳 简体中文](README.md) | [🇺🇸 English](README_EN.md) | [🇯🇵 日本語](README_JA.md) | [🇫🇷 Français](README_FR.md) |
| :---: | :---: | :---: | :---: |
| [🇩🇪 Deutsch](README_DE.md) | [🇪🇸 Español](README_ES.md) | [🇵🇹 Português](README_PT.md) | [🇰🇷 한국어](README_KO.md) |
| [🇷🇺 Русский](README_RU.md) | | | |

</div>

Eine **Chrome-Manifest-V3**-Erweiterung, mit der Sie manuell mehrere Bereiche einer Webseite mithilfe eines Photoshop-ähnlichen Lineals auswählen und jeden Bereich als eigenständiges PNG-Bild speichern können. Sie unterstützt die Aufteilung von Bereichen über Lineal-Führungslinien, Maus-Auswahlfelder und automatische Auswahl nach CSS-Klasse, mit High-Definition-Export, der automatisch in nach Zeitstempel benannten Ordnern archiviert wird.

## Funktionen

### Bereichsaufteilung (die drei Methoden sind kombinierbar)

- **Pixel-Linealleiste**: Lineale oben (X-Achse) und ganz links (Y-Achse) der Seite, mit Teilstrichen und Zahlen, für HiDPI-Bildschirme geeignet
- **Ziehen zum Erstellen von Führungslinien**: Halten Sie die linke Maustaste auf dem Lineal gedrückt und ziehen Sie, um vertikale / horizontale Führungslinien zu erstellen
- **Verwaltung der Führungslinien**: Positionen durch Ziehen änderbar; klicken Sie auf eine Führungslinie, um eine Lösch-Schaltfläche anzuzeigen; unterstützt das Löschen aller Führungslinien auf einmal
- **Auswahlfeld**: Nach dem Aktivieren des Auswahlfeld-Modus ziehen Sie direkt auf der Seite, um einen beliebigen Bereich auszuwählen; dieses Feld wird zu einer Screenshot-Region
- **Automatische Auswahl (Class)**: Geben Sie einen CSS-Klassennamen ein, und die Erweiterung erstellt automatisch Auswahlfelder für alle passenden Elemente

### Screenshot & Export

- **High-Definition-Export**: Die Vollseiten-Canvas und die gespeicherten PNGs werden mit `Dokumentgröße × devicePixelRatio × EXPORT_SCALE` gerendert, mit 2-facher Vergrößerung für schärfere Ausgabe
- **Abschnitts-Zuschnitt als PNG**: Mit einem Klick wird jede Region (Rasterzelle der Führungslinien + Auswahlfeld) als eigenständiges PNG-Bild gespeichert
- **Fortschritts-Dialog**: Detaillierter Fortschrittsbalken, aktuell/gesamt, Abbrechen-Operation und Abschluss-Feedback (mit „Ordner öffnen"-Schaltfläche)
- **Download großer Bilder**: Verwendet ein Offscreen Document, um die data URL in Segmenten zu senden und in ein Blob umzuwandeln, wodurch das 2-MB-Längenlimit von `chrome.downloads` für data URLs umgangen wird, sodass Ultra-High-Resolution-Screenshots vollständig gespeichert werden
- **Automatische Archivierung nach Zeit**: Jede Serie wird in einem unabhängigen, nach der aktuellen Zeit benannten Ordner gespeichert (z. B. `2026年08月25日 14时30分55秒_500_A1B2`), was Überschreibungen und Verzeichnisverschmutzung vermeidet

### Benutzerfreundlichkeit

- **PNG-Benennungsregel**: `Nummer_Webseitenname.png` (z. B. `1_example.png`), wobei der Webseitenname automatisch aus der URL extrahiert wird
- **Persistenz der Führungslinien**: Führungslinien werden nach dem Aktualisieren der Seite automatisch wiederhergestellt und sind pro URL isoliert, sodass verschiedene Seiten keine Führungslinien teilen
- **Tastenkürzel**: Standardmäßig `P` drücken, um den Auswahlfeld-Modus schnell umzuschalten (`ESC` zum Beenden), in den Einstellungen anpassbar
- **Einstellungsfeld**: Unterstützt das Konfigurieren und Speichern der Tastenkombination für das Auswahlfeld
- **Zwei-Eingangs-Steuerung**: Popup der Browser-Symbolleiste + schwebende Symbolleiste in der Seite

### Sonstiges

- **Dem Autor einen Kaffee kaufen**: Integriertes Spenden-Popup mit QR-Code zur Unterstützung des Autors

## Lokales Laden (Entwicklungsmodus)

1. Öffnen Sie Chrome und besuchen Sie `chrome://extensions/`
2. Aktivieren Sie oben rechts den **Entwicklermodus**
3. Klicken Sie auf **Entpackte Erweiterung laden**
4. Wählen Sie das Plugin-Wurzelverzeichnis (den Ordner mit `manifest.json`)

## Bedienungsanleitung

1. **Führungslinien festlegen**
   - Bewegen Sie die Maus auf das **obere Lineal** der Seite (X-Achse), halten Sie die linke Maustaste gedrückt und ziehen Sie nach unten, um eine **horizontale Führungslinie** zu erstellen (eine horizontale Linie, die die Y-Koordinate darstellt).
   - Bewegen Sie die Maus auf das **linke Lineal** der Seite (Y-Achse), halten Sie die linke Maustaste gedrückt und ziehen Sie nach rechts, um eine **vertikale Führungslinie** zu erstellen (eine vertikale Linie, die die X-Koordinate darstellt).
   - Während des Ziehens wird die aktuelle Koordinate (in Pixel) in Echtzeit angezeigt.
   - Führungslinien werden nach **Dokumentkoordinaten** positioniert (am Seiteninhalt fixiert) und bewegen sich beim Scrollen mit der Seite.
2. **Führungslinien anpassen**
   - Halten Sie eine vorhandene Führungslinie gedrückt und ziehen Sie, um ihre Position zu ändern.
   - Klicken Sie auf eine Führungslinie, um eine rote Lösch-Schaltfläche anzuzeigen; klicken Sie darauf, um diese Führungslinie zu löschen.
3. **Auswahlfeld verwenden** (ideal für die präzise Auswahl einer Region)
   - Klicken Sie auf die Schaltfläche „Auswahlfeld aktivieren" in der Symbolleiste (oder drücken Sie das Standardkürzel `P`).
   - Halten Sie nach dem Aktivieren die linke Maustaste gedrückt und ziehen Sie direkt auf der Seite; das ausgewählte Rechteck wird zu einer Screenshot-Region. Es können mehrere Regionen gleichzeitig ausgewählt werden.
   - Jedes Auswahlfeld hat eine Lösch-Schaltfläche in der oberen rechten Ecke; drücken Sie erneut `P` oder `ESC`, um den Auswahlmodus zu beenden.
   - Das Kürzel kann in den Einstellungen geändert und gespeichert werden.
4. **Automatische Auswahl (Class)**
   - Klicken Sie auf die Schaltfläche „Automatische Auswahl (Class)" in der Symbolleiste.
   - Geben Sie den Klassennamen der Seitenelemente ein (der führende Punkt `.` kann weggelassen werden), und bestätigen Sie.
   - Die Erweiterung erstellt automatisch Auswahlfelder für alle sichtbaren Elemente, die dieser Klasse entsprechen.
5. **Zuschnitt starten**
   - Klicken Sie auf die Schaltfläche „PNG-Zuschnitt starten" in der schwebenden Symbolleiste oder im Popup.
   - Die Erweiterung blendet Lineale / Führungslinien / Auswahlfelder / Symbolleiste aus, erfasst Bereich für Bereich und zeigt einen Fortschrittsdialog an.
   - Jede Region wird als `Nummer_Webseitenname.png` benannt und in einem nach der aktuellen Zeit benannten Unterordner gespeichert.
   - Nach Abschluss klicken Sie auf „Gespeicherten Ordner öffnen", um die Ergebnisse direkt zu sehen.
6. **Sonstiges**
   - „Alle Führungslinien löschen" entfernt sowohl alle Führungslinien als auch alle Auswahlfelder.
   - „Lineal aus-/einblenden" schaltet die Anzeige der Linealleiste um.
   - „Einstellungen" ändert die Tastenkombination des Auswahlfelds.
   - „Dem Autor einen Kaffee kaufen" ermöglicht das Scannen eines QR-Codes zur Unterstützung des Autors.

## Projektstruktur

```
webpage-section-screenshot/
├── manifest.json                # Manifest-V3-Konfiguration
├── background/
│   ├── service-worker.js        # Service Worker im Hintergrund (Screenshot/Download-Nachrichtenverarbeitung)
│   └── offscreen.html/.js       # Offscreen Document: Konvertierung großer data URL → Blob und Segment-Assemblierung
├── content/
│   ├── index.js                 # Content-Script-Einstieg (Modul-Assemblierung & Abhängigkeitsinjektion)
│   ├── constants.js             # Konstanten & globaler SSS-Namespace
│   ├── Storage.js               # chrome.storage-Wrapper
│   ├── BackgroundService.js     # Hintergrundkommunikations-Wrapper (inkl. segmentiertem Download)
│   ├── style.css                # Styles im Shadow DOM (isoliert)
│   └── modules/                 # Funktionsmodule (hohe Kohäsion, geringe Kopplung)
│       ├── Ruler.js             # Linealleiste
│       ├── GuideManager.js      # Führungslinien-Verwaltung (inkl. Persistenz pro URL)
│       ├── SelectionManager.js  # Auswahlfelder (Maus-Ziehen / automatische Auswahl nach Klasse)
│       ├── ScreenshotManager.js # Abschnitts-Screenshot & Zuschnitt (Canvas-Erstellung pro Zelle)
│       ├── Naming.js            # PNG-Benennung & Zeitstempel-Ordnerregeln
│       ├── ProgressModal.js     # Fortschritts-Dialog
│       ├── SettingsModal.js     # Einstellungs-Dialog (Kürzel-Konfiguration)
│       ├── CoffeeModal.js       # Kaffee-kaufen (Spenden)-Dialog
│       ├── ClassSelectionModal.js # Eingabe-Dialog für automatische Auswahl nach Klasse
│       └── Toolbar.js           # Schwebende Symbolleiste in der Seite
├── popup/
│   ├── popup.html               # Erweiterungs-Popup
│   ├── popup.css
│   └── popup.js
├── lib/
│   └── html-to-image.js         # Ergänzende Vollseiten-Erfassung (SVG foreignObject)
├── assets/
│   ├── icons/                   # Erweiterungs-Icons (16/32/48/128)
│   └── pay_coffee.jpg           # Spenden-QR-Code
└── README.md
```

## Technische Hinweise

### Screenshot-Ansatz (Scroll-Zusammenfügen + Zuschnitt nach Region)

- **Primärer Ansatz**: **Scroll-Zusammenfügen** — unabhängig davon, wie lang/breit die Seite ist (einschließlich horizontaler und vertikaler Scrollbalken), wird die Seite zunächst nach Fenstergröße in ein Raster aufgeteilt, dann Zelle für Zelle gescrollt und `chrome.tabs.captureVisibleTab` aufgerufen, um das echte gerenderte Bild zu erfassen.
  - Anders als beim früheren „Vollseiten-Canvas"-Ansatz erstellt die aktuelle Implementierung **keinen riesigen Vollseiten-Canvas mehr** (um die 32.000-Pixel-Grenze des Browsers zu vermeiden und keine leeren Bilder zu erzeugen). Stattdessen **erstellt sie für jede zu speichernde Region einen unabhängigen Canvas** und zeichnet beim Scrollen die Schnittmenge zwischen Fenster und jeder Region direkt in den entsprechenden Region-Canvas, was Speicherverbrauch und Assemblierungsrisiko erheblich reduziert.
  - Sowohl sichtbare als auch unsichtbare (scrollbare) Teile werden vollständig gespeichert.
  - Führungslinien / Auswahlfelder sind das einzige Aufteilungskriterium; jede Region = eine Rasterzelle der Führungslinien + ausgewählte Felder.
  - Verwendet echte gerenderte Screenshots, mit höherer Wiedergabetreue als html2canvas.
- **Erfassungs-Ratenbegrenzung**: `captureVisibleTab` wird gedrosselt (mindestens 500 ms zwischen zwei Aufrufen) und führt bei einem Chrome-Kontingentfehler automatisch eine exponentielle Backoff-Wiederholung durch, wodurch Unterbrechungen während der Erfassung Zelle für Zelle vermieden werden.
- **HiDPI-Vergrößerung**: `EXPORT_SCALE` (Standard 2) vergrößert zusätzlich auf dem dpr für schärfere PNG-Ausgabe.
- **Ergänzender Ansatz**: `lib/html-to-image.js` (SVG `foreignObject`), verfügbar als Fallback für extreme Szenarien (z. B. innere Scroll-Container), bei Bedarf erweiterbar.

### Download großer Bilder (Offscreen Document + segmentierter Transfer)

- **Problem**: `chrome.downloads.download`, das direkt eine data URL akzeptiert, ist auf **2 MB** begrenzt, sodass Ultra-High-Resolution-Screenshots fehlschlagen oder fälschlicherweise als `.txt` gespeichert werden können; und `URL.createObjectURL` ist in einem MV3-Service-Worker nicht verfügbar.
- **Ansatz**: Dynamisch ein **Offscreen Document** erstellen, das die Konvertierung `data URL → Blob → blob URL` in einer normalen DOM-Umgebung durchführt.
  - Das Content-Script teilt die große data URL in 4-MB-Segmente auf und sendet sie einzeln (`DOWNLOAD_CHUNK`); das Offscreen Document akkumuliert sie nach Dateinamen;
  - Nachdem alle Segmente gesendet wurden, wird es benachrichtigt, sie der Reihe nach zu einem Blob zusammenzusetzen und eine blob-URL zu generieren (`DOWNLOAD_ASSEMBLE`); fehlende Segmente verursachen einen Fehler, statt eine beschädigte Datei zu erzeugen;
  - Die endgültige Download-Aktion wird vom Service Worker mithilfe der blob-URL über `chrome.downloads.download` ausgeführt (das Offscreen Document hat diese Berechtigung nicht).
- Jedes Bild wird in einem nach Zeitstempel benannten Unterordner gespeichert, was Überschreibungen und Verzeichnisverschmutzung vermeidet.

### Code-Architektur (hohe Kohäsion, geringe Kopplung)

- Jedes Funktionsmodul ist unabhängig unter `content/modules/` gekapselt und wird im globalen `SSS`-Namespace gemountet (vom Manifest in Abhängigkeitsreihenfolge geladen, nicht als ES-Module).
- Der Einstieg `index.js` ist nur für **Abhängigkeitsinjektion und Assemblierung** zuständig und enthält keine Geschäftslogik.
- Module kommunizieren über **Callbacks / Nachrichten** und vermeiden direkte Abhängigkeiten.
- Die gesamte Benutzeroberfläche lebt in einem **Shadow DOM**, vollständig isoliert von den Stilen der Host-Seite.
- Die Persistenz der Führungslinien wird pro URL isoliert gespeichert (`{ sss_guides : { [url] : [] } }`), wobei eine serielle Warteschlange verwendet wird, um Lese-Änderungs-Schreib-Rennbedingungen zu vermeiden.

### Hinweise

- Das Zusammenfügen der gesamten Seite hängt von der Fenster-Erfassungs-API des Browsers ab und scrollt die ganze Seite Zelle für Zelle; je größer die Seite, desto länger dauert es (ca. 250 ms Wartezeit pro Zelle, bis das Rendern abgeschlossen ist).
- Wenn die Seite `position: fixed`-Elemente enthält (z. B. eine feste Navigationsleiste), erscheinen diese Elemente während des Zusammenfügens in jedem Fenstersegment — eine inhärente Einschränkung der Vollseiten-Erfassung.
- Die Koordinaten der Führungslinien basieren auf dem Dokument (`window`-Scroll); wenn sich der Seitenkörper in einem inneren Scroll-Container befindet, müssen Sie möglicherweise diesen Container anvisieren.
- Aufgrund von Sicherheitsbeschränkungen des Browsers können bestimmte spezielle Seiten (z. B. `chrome://`, Chrome Web Store) nicht injiziert werden.
- Wenn eine Seite Cross-Origin-Ressourcen enthält, gibt die Erfassungs-API das tatsächlich gerenderte Bild zurück, das nicht von der Cross-Origin-Kontamination des Canvas betroffen ist.

## Test-Checkliste

- [x] Alle JS-Dateien bestehen die Syntaxprüfung (`node --check`)
- [x] `manifest.json` besteht die JSON-Validierung; alle referenzierten Dateien existieren
- [x] Unit-Tests der Benennungsregel (URL → Webseitenname → Dateiname)
- [x] Unit-Tests des Partitionierungsalgorithmus (Anzahl der Regionen, Gesamtflächenabdeckung, keine Überlappung)
- [ ] Echte Erfassung auf verschiedenen typischen Seiten (lange Seiten, Scroll-Seiten, Seiten mit fixed-Elementen)
- [ ] Echter Test von Ziehen, Ändern, Löschen und Alles-Löschen der Führungslinien
- [ ] Echter Test des Auswahlfeld-Ziehens, Kürzel-Umschaltens und der automatischen Auswahl nach Klasse
- [ ] Echter Test des Fortschritts-Dialogs, Abbrechen, sehr langem segmentierten Download und Ordner-Öffnens

> Tipp: Laden Sie nach dem Laden der Erweiterung eine beliebige Webseite und führen Sie die obigen Abläufe durch. Bei Problemen: Rechtsklick auf die Seite → „Untersuchen" → Konsole und suchen Sie nach Protokollen mit dem Präfix `[SSS]`.
