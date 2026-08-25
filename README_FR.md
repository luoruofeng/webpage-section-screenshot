<div align="center">

# Capture de sections de page web (Webpage Section Screenshot)

**🌐 Langue / Choose Language / 选择语言 / 言語を選択 / Choisir la langue / Sprache wählen / Seleccionar idioma / Selecionar idioma / 언어 선택 / Выберите язык**

| [🇨🇳 简体中文](README.md) | [🇺🇸 English](README_EN.md) | [🇯🇵 日本語](README_JA.md) | [🇫🇷 Français](README_FR.md) |
| :---: | :---: | :---: | :---: |
| [🇩🇪 Deutsch](README_DE.md) | [🇪🇸 Español](README_ES.md) | [🇵🇹 Português](README_PT.md) | [🇰🇷 한국어](README_KO.md) |
| [🇷🇺 Русский](README_RU.md) | | | |

</div>

Une extension **Chrome Manifest V3** qui vous permet de sélectionner manuellement plusieurs sections d'une page web à l'aide d'une règle de style Photoshop et d'enregistrer chaque section sous forme d'image PNG indépendante. Elle prend en charge la division des zones via des guides de règle, des zones de sélection à la souris et la sélection automatique par classe CSS, avec une exportation en haute définition automatiquement archivée dans des dossiers nommés par horodatage.

## Fonctionnalités

### Division des zones (les trois méthodes peuvent être combinées)

- **Barre de règle en pixels** : règles en haut (axe X) et à l'extrême gauche (axe Y) de la page, avec graduations et chiffres, adaptées aux écrans HiDPI
- **Création de guides par glisser** : maintenez le bouton gauche de la souris sur la règle et faites glisser pour créer des guides verticaux / horizontaux
- **Gestion des guides** : positions modifiables par glisser-déposer ; cliquez sur un guide pour afficher un bouton de suppression ; prend en charge l'effacement de tous les guides en une fois
- **Zone de sélection** : après avoir activé le mode zone de sélection, faites glisser directement sur la page pour sélectionner n'importe quelle zone ; ce cadre devient une région de capture
- **Sélection automatique (Class)** : saisissez un nom de classe CSS et l'extension crée automatiquement des zones de sélection pour tous les éléments correspondants

### Capture et exportation

- **Exportation haute définition** : le canevas plein écran et les PNG enregistrés sont rendus à `taille du document × devicePixelRatio × EXPORT_SCALE`, avec un grossissement 2× pour une sortie plus nette
- **Recadrage des sections en PNG** : un clic suffit pour enregistrer chaque région (cellule de la grille de guides + zone de sélection) sous forme d'image PNG indépendante
- **Fenêtre modale de progression** : barre de progression détaillée, progression actuelle/total, opération d'annulation et retour de fin (avec bouton « ouvrir le dossier de téléchargement »)
- **Téléchargement d'images volumineuses** : utilise un document hors écran pour envoyer la data URL par segments et la convertir en Blob, contournant ainsi la limite de 2 Mo de `chrome.downloads` pour les data URLs, afin que les captures ultra-haute résolution soient entièrement enregistrées
- **Archivage automatique basé sur l'heure** : chaque lot est enregistré dans un dossier indépendant nommé par l'heure actuelle (ex. `2026年08月25日 14时30分55秒_500_A1B2`), évitant les écrasements et la pollution du répertoire

### Facilité d'utilisation

- **Règle de nommage PNG** : `numéro_nom_du_site.png` (ex. `1_example.png`), le nom du site étant automatiquement extrait de l'URL
- **Persistance des guides** : les guides sont automatiquement restaurés après actualisation de la page, et isolés par URL afin que les pages différentes ne partagent pas les guides
- **Raccourci clavier** : appuyez sur `P` par défaut pour activer/désactiver rapidement le mode zone de sélection (`ÉCHAP` pour quitter), personnalisable dans les paramètres
- **Panneau de paramètres** : permet de configurer et de persister la touche de raccourci de la zone de sélection
- **Contrôle à double entrée** : Popup de la barre d'outils du navigateur + barre d'outils flottante dans la page

### Autres

- **Offrir un café à l'auteur** : popup de don intégré avec code QR pour soutenir l'auteur

## Chargement local (mode développement)

1. Ouvrez Chrome et visitez `chrome://extensions/`
2. Activez le **mode développeur** en haut à droite
3. Cliquez sur **Charger l'extension non empaquetée**
4. Sélectionnez le répertoire racine du plugin (le dossier contenant `manifest.json`)

## Mode d'emploi

1. **Définir les guides**
   - Déplacez la souris sur la **règle supérieure** de la page (axe X), maintenez le bouton gauche et faites glisser vers le bas pour créer un **guide horizontal** (une ligne horizontale représentant la coordonnée Y).
   - Déplacez la souris sur la **règle gauche** de la page (axe Y), maintenez le bouton gauche et faites glisser vers la droite pour créer un **guide vertical** (une ligne verticale représentant la coordonnée X).
   - La coordonnée actuelle (en pixels) est affichée en temps réel pendant le glissement.
   - Les guides sont positionnés selon les **coordonnées du document** (fixés au contenu de la page) et se déplacent avec la page lors du défilement.
2. **Ajuster les guides**
   - Maintenez un guide existant et faites-le glisser pour modifier sa position.
   - Cliquez sur un guide pour afficher un bouton de suppression rouge ; cliquez dessus pour supprimer ce guide.
3. **Utiliser la zone de sélection** (idéal pour sélectionner précisément une zone)
   - Cliquez sur le bouton « Activer la zone de sélection » de la barre d'outils (ou appuyez sur le raccourci par défaut `P`).
   - Après activation, maintenez le bouton gauche et faites glisser directement sur la page ; le rectangle sélectionné devient une région de capture. Plusieurs régions peuvent être sélectionnées à la fois.
   - Chaque zone de sélection possède un bouton de suppression dans son coin supérieur droit ; appuyez à nouveau sur `P` ou sur `ÉCHAP` pour quitter le mode de sélection.
   - Le raccourci peut être modifié et enregistré dans les paramètres.
4. **Sélection automatique (Class)**
   - Cliquez sur le bouton « Sélection automatique (Class) » de la barre d'outils.
   - Saisissez le nom de la classe des éléments de la page (le `.` initial peut être omis), puis confirmez.
   - L'extension crée automatiquement des zones de sélection pour tous les éléments visibles correspondant à cette classe.
5. **Démarrer le recadrage**
   - Cliquez sur le bouton « Démarrer le recadrage PNG » de la barre d'outils flottante ou de la Popup.
   - L'extension masque les règles / guides / zones de sélection / barre d'outils, capture région par région et affiche une fenêtre modale de progression.
   - Chaque région est nommée `numéro_nom_du_site.png` et enregistrée dans un sous-dossier nommé par l'heure actuelle.
   - Après la fin, cliquez sur « Ouvrir le dossier enregistré » pour consulter directement les résultats.
6. **Autres**
   - « Effacer tous les guides » supprime à la fois tous les guides et toutes les zones de sélection.
   - « Masquer/Afficher la règle » bascule l'affichage de la barre de règle.
   - « Paramètres » modifie la touche de raccourci de la zone de sélection.
   - « Offrir un café à l'auteur » permet de scanner un code QR pour soutenir l'auteur.

## Structure du projet

```
webpage-section-screenshot/
├── manifest.json                # Configuration Manifest V3
├── background/
│   ├── service-worker.js        # Service Worker d'arrière-plan (capture/téléchargement des messages)
│   └── offscreen.html/.js       # Document hors écran : conversion data URL → Blob et assemblage des segments
├── content/
│   ├── index.js                 # Entrée du content script (assemblage des modules et injection des dépendances)
│   ├── constants.js             # Constantes et espace de noms global SSS
│   ├── Storage.js               # Enveloppe chrome.storage
│   ├── BackgroundService.js     # Enveloppe de communication d'arrière-plan (incluant le téléchargement par segments)
│   ├── style.css                # Styles dans le Shadow DOM (isolés)
│   └── modules/                 # Modules de fonctionnalités (haute cohésion, faible couplage)
│       ├── Ruler.js             # Barre de règle
│       ├── GuideManager.js      # Gestion des guides (incluant la persistance par URL)
│       ├── SelectionManager.js  # Zones de sélection (glisser-souris / sélection automatique par classe)
│       ├── ScreenshotManager.js # Capture des sections et recadrage (assemblage canvas par cellule)
│       ├── Naming.js            # Règles de nommage PNG et de dossier horodaté
│       ├── ProgressModal.js     # Fenêtre modale de progression
│       ├── SettingsModal.js     # Fenêtre modale des paramètres (configuration des raccourcis)
│       ├── CoffeeModal.js       # Fenêtre modale Offrir un café (don)
│       ├── ClassSelectionModal.js # Fenêtre modale de saisie pour la sélection automatique par classe
│       └── Toolbar.js           # Barre d'outils flottante dans la page
├── lib/
│   └── html-to-image.js         # Solution complémentaire de capture plein écran (SVG foreignObject)
├── assets/
│   ├── icons/                   # Icônes de l'extension (16/32/48/128)
│   └── pay_coffee.jpg           # Code QR de don
└── README.md
```

## Notes techniques

### Approche de capture (assemblage par défilement + recadrage par zone)

- **Approche principale** : **assemblage par défilement** — quelle que soit la longueur/largeur de la page (y compris les barres de défilement horizontales et verticales), elle divise d'abord la page entière en une grille selon la taille de la fenêtre, puis fait défiler cellule par cellule et appelle `chrome.tabs.captureVisibleTab` pour obtenir l'image rendue réelle.
  - Contrairement à l'approche antérieure du « canevas plein écran », l'implémentation actuelle **ne crée plus un énorme canevas plein écran** (pour éviter de dépasser la limite de 32 000 pixels du navigateur et de produire des images blanches). Au lieu de cela, elle **crée un canevas indépendant pour chaque région à enregistrer** et, lors du défilement, dessine l'intersection entre la fenêtre et chaque région directement dans le canevas correspondant, réduisant considérablement l'utilisation de la mémoire et le risque d'échec d'assemblage.
  - Les parties visibles et invisibles (nécessitant un défilement) sont entièrement enregistrées.
  - Les guides / zones de sélection sont les seuls critères de division ; chaque région = une cellule de la grille de guides + les zones sélectionnées par l'utilisateur.
  - Utilise de véritables captures rendues, d'une fidélité supérieure à html2canvas.
- **Limitation de la fréquence de capture** : `captureVisibleTab` est limité (au moins 500 ms entre deux appels) et effectue automatiquement une retraite exponentielle et une nouvelle tentative en cas d'erreur de quota Chrome, évitant ainsi les interruptions lors de la capture cellule par cellule.
- **Agrandissement HiDPI** : `EXPORT_SCALE` (défaut 2) agrandit davantage en plus du dpr pour des PNG plus nets.
- **Approche complémentaire** : `lib/html-to-image.js` (SVG `foreignObject`), disponible comme solution de repli pour les cas extrêmes (par exemple les conteneurs à défilement interne), extensible selon les besoins.

### Téléchargement d'images volumineuses (document hors écran + transfert par segments)

- **Problème** : `chrome.downloads.download` acceptant directement une data URL est limité à **2 Mo**, donc les captures ultra-haute résolution peuvent échouer ou être enregistrées à tort en `.txt` ; et `URL.createObjectURL` n'est pas disponible dans un Service Worker MV3.
- **Approche** : créer dynamiquement un **document hors écran**, qui effectue la conversion `data URL → Blob → blob URL` dans un environnement DOM normal.
  - Le content script découpe la data URL volumineuse en segments de 4 Mo et les envoie un par un (`DOWNLOAD_CHUNK`) ; le document hors écran les accumule par nom de fichier ;
  - Une fois tous les segments envoyés, il est notifié pour les assembler dans l'ordre en un Blob et générer une URL de blob (`DOWNLOAD_ASSEMBLE`) ; les segments manquants provoquent une erreur plutôt qu'un fichier corrompu ;
  - L'action de téléchargement finale est exécutée par le Service Worker à l'aide de l'URL de blob via `chrome.downloads.download` (le document hors écran ne possède pas cette permission).
- Chaque image est enregistrée dans un sous-dossier nommé par horodatage, évitant les écrasements et la pollution du répertoire.

### Architecture du code (haute cohésion, faible couplage)

- Chaque module de fonctionnalité est encapsulé indépendamment sous `content/modules/`, monté sur l'espace de noms global `SSS` (chargé dans l'ordre des dépendances par le manifest, et non en tant que modules ES).
- L'entrée `index.js` est uniquement responsable de **l'injection des dépendances et de l'assemblage**, sans logique métier.
- Les modules communiquent via **des rappels / messages**, évitant les dépendances directes.
- Toute l'interface vit dans un **Shadow DOM**, entièrement isolée des styles de la page hôte.
- La persistance des guides est stockée isolée par URL (`{ sss_guides : { [url] : [] } }`), à l'aide d'une file d'attente sérialisée pour éviter les conditions de course de lecture-modification-écriture.

### Remarques

- L'assemblage plein écran repose sur l'API de capture de fenêtre du navigateur et fait défiler toute la page cellule par cellule ; plus la page est grande, plus c'est long (environ 250 ms d'attente par cellule pour que le rendu se termine).
- Si la page contient des éléments `position: fixed` (par exemple une barre de navigation fixe), ces éléments apparaissent dans chaque segment de fenêtre pendant l'assemblage — une limite inhérente à la capture plein écran.
- Les coordonnées des guides sont basées sur le document (défilement `window`) ; si le corps de la page se trouve dans un conteneur à défilement interne, vous devrez peut-être cibler ce conteneur.
- En raison des restrictions de sécurité du navigateur, certaines pages spéciales (par exemple `chrome://`, le Chrome Web Store) ne peuvent pas être injectées.
- Lorsqu'une page contient des ressources de type cross-origin, l'API de capture renvoie l'image réellement rendue, sans être affectée par la contamination cross-origin du canevas.

## Liste de tests

- [x] Tous les fichiers JS passent la vérification syntaxique (`node --check`)
- [x] `manifest.json` passe la validation JSON ; tous les fichiers référencés existent
- [x] Tests unitaires de la règle de nommage (URL → nom du site → nom de fichier)
- [x] Tests unitaires de l'algorithme de partition (nombre de zones, couverture de la surface totale, aucune superposition)
- [ ] Capture réelle sur diverses pages typiques (pages longues, pages à défilement, pages avec éléments fixes)
- [ ] Test réel du glisser, modifier, supprimer et tout effacer des guides
- [ ] Test réel du glisser de la zone de sélection, bascule du raccourci et sélection automatique par classe
- [ ] Test réel de la fenêtre modale de progression, de l'annulation, du téléchargement par segments très longs et de l'ouverture du dossier

> Astuce : après avoir chargé l'extension, ouvrez une page web quelconque et parcourez les flux ci-dessus. En cas de problème, cliquez avec le bouton droit sur la page → « Inspecter » → Console et recherchez les journaux préfixés par `[SSS]`.
