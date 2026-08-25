<div align="center">

# Captura de seções de página web (Webpage Section Screenshot)

**🌐 Idioma / Choose Language / 选择语言 / 言語を選択 / Choisir la langue / Sprache wählen / Seleccionar idioma / Selecionar idioma / 언어 선택 / Выберите язык**

| [🇨🇳 简体中文](README.md) | [🇺🇸 English](README_EN.md) | [🇯🇵 日本語](README_JA.md) | [🇫🇷 Français](README_FR.md) |
| :---: | :---: | :---: | :---: |
| [🇩🇪 Deutsch](README_DE.md) | [🇪🇸 Español](README_ES.md) | [🇵🇹 Português](README_PT.md) | [🇰🇷 한국어](README_KO.md) |
| [🇷🇺 Русский](README_RU.md) | | | |

</div>

Uma extensão **Chrome Manifest V3** que permite selecionar manualmente várias seções de uma página web usando uma régua de estilo Photoshop e salvar cada seção como uma imagem PNG independente. Ela suporta a divisão de áreas por meio de guias de régua, caixas de seleção com o mouse e seleção automática por classe CSS, com exportação em alta definição que é arquivada automaticamente em pastas nomeadas por carimbo de tempo.

## Recursos

### Divisão de áreas (os três métodos podem ser combinados)

- **Barra de régua em pixels**: réguas no topo (eixo X) e na extremidade esquerda (eixo Y) da página, com marcas e números, adaptadas para telas HiDPI
- **Arrastar para criar guias**: mantenha pressionado o botão esquerdo do mouse na régua e arraste para criar guias verticais / horizontais
- **Gerenciamento de guias**: as posições podem ser modificadas arrastando; clique em uma guia para mostrar um botão de exclusão; suporta a limpeza de todas as guias de uma vez
- **Caixa de seleção**: após ativar o modo de caixa de seleção, arraste diretamente na página para selecionar qualquer área; essa caixa se torna uma região de captura
- **Seleção automática (Class)**: insira um nome de classe CSS e a extensão cria automaticamente caixas de seleção para todos os elementos correspondentes

### Captura e exportação

- **Exportação em alta definição**: o canvas de página inteira e os PNGs salvos são renderizados em `tamanho do documento × devicePixelRatio × EXPORT_SCALE`, com ampliação de 2× para uma saída mais nítida
- **Recorte de seções em PNG**: com um clique, cada região (célula da grade de guias + caixa de seleção) é salva como uma imagem PNG independente
- **Modal de progresso**: barra de progresso detalhada, progresso atual/total, operação de cancelamento e feedback de conclusão (com botão «abrir pasta de downloads»)
- **Download de imagens grandes**: usa um documento fora da tela para enviar a data URL em segmentos e convertê-la em um Blob, contornando o limite de 2 MB de `chrome.downloads` para data URLs, de modo que capturas de ultra alta resolução sejam salvas por completo
- **Arquivamento automático por tempo**: cada lote é salvo em uma pasta independente nomeada pela hora atual (ex.: `2026年08月25日 14时30分55秒_500_A1B2`), evitando sobrescritas e poluição de diretórios

### Usabilidade

- **Regra de nome PNG**: `número_nome_do_site.png` (ex.: `1_example.png`), com o nome do site extraído automaticamente da URL
- **Persistência das guias**: as guias são restauradas automaticamente após atualizar a página e ficam isoladas por URL para que páginas diferentes não compartilhem guias
- **Atalho de teclado**: pressione `P` por padrão para alternar rapidamente o modo de caixa de seleção (`ESC` para sair), personalizável nas Configurações
- **Painel de configurações**: suporta configurar e persistir a tecla de atalho da caixa de seleção
- **Controle de entrada dupla**: Popup da barra de ferramentas do navegador + barra de ferramentas flutuante na página

### Outros

- **Convidar o autor para um café**: popup de doação integrado com código QR para apoiar o autor

## Carregamento local (modo de desenvolvimento)

1. Abra o Chrome e visite `chrome://extensions/`
2. Ative o **modo de desenvolvedor** no canto superior direito
3. Clique em **Carregar extensão não empacotada**
4. Selecione o diretório raiz do plugin (a pasta que contém `manifest.json`)

## Instruções de uso

1. **Definir guias**
   - Mova o mouse sobre a **régua superior** da página (eixo X), mantenha pressionado o botão esquerdo e arraste para baixo para criar uma **guia horizontal** (uma linha horizontal que representa a coordenada Y).
   - Mova o mouse sobre a **régua esquerda** da página (eixo Y), mantenha pressionado o botão esquerdo e arraste para a direita para criar uma **guia vertical** (uma linha vertical que representa a coordenada X).
   - A coordenada atual (em pixels) é exibida em tempo real durante o arraste.
   - As guias são posicionadas por **coordenadas do documento** (fixadas ao conteúdo da página) e se movem com a página ao rolar.
2. **Ajustar guias**
   - Mantenha pressionada uma guia existente e arraste-a para alterar sua posição.
   - Clique em uma guia para mostrar um botão vermelho de exclusão; clique nele para excluir essa guia.
3. **Usar a caixa de seleção** (ideal para selecionar uma região com precisão)
   - Clique no botão «Ativar caixa de seleção» da barra de ferramentas (ou pressione o atalho padrão `P`).
   - Após a ativação, mantenha pressionado o botão esquerdo e arraste diretamente na página; o retângulo selecionado se torna uma região de captura. Várias regiões podem ser selecionadas ao mesmo tempo.
   - Cada caixa de seleção tem um botão de exclusão no canto superior direito; pressione `P` novamente ou `ESC` para sair do modo de seleção.
   - O atalho pode ser alterado e salvo nas Configurações.
4. **Seleção automática (Class)**
   - Clique no botão «Seleção automática (Class)» da barra de ferramentas.
   - Insira o nome da classe dos elementos da página (o ponto inicial `.` pode ser omitido) e confirme.
   - A extensão cria automaticamente caixas de seleção para todos os elementos visíveis que correspondem a essa classe.
5. **Iniciar o recorte**
   - Clique no botão «Iniciar recorte PNG» da barra de ferramentas flutuante ou do Popup.
   - A extensão oculta as réguas / guias / caixas de seleção / barra de ferramentas, captura região por região e mostra um modal de progresso.
   - Cada região é nomeada como `número_nome_do_site.png` e salva em uma subpasta nomeada pela hora atual.
   - Após a conclusão, clique em «Abrir pasta salva» para ver os resultados diretamente.
6. **Outros**
   - «Limpar todas as guias» remove tanto todas as guias quanto todas as caixas de seleção.
   - «Ocultar/Mostrar régua» alterna a exibição da barra de régua.
   - «Configurações» altera a tecla de atalho da caixa de seleção.
   - «Convidar o autor para um café» permite escanear um código QR para apoiar o autor.

## Estrutura do projeto

```
webpage-section-screenshot/
├── manifest.json                # Configuração do Manifest V3
├── background/
│   ├── service-worker.js        # Service Worker de fundo (captura/download do tratamento de mensagens)
│   └── offscreen.html/.js       # Documento fora da tela: conversão de data URL grande → Blob e montagem de segmentos
├── content/
│   ├── index.js                 # Entrada do content script (montagem de módulos e injeção de dependências)
│   ├── constants.js             # Constantes e namespace global SSS
│   ├── Storage.js               # Wrapper de chrome.storage
│   ├── BackgroundService.js     # Wrapper de comunicação com o fundo (inclui download por segmentos)
│   ├── style.css                # Estilos dentro do Shadow DOM (isolados)
│   └── modules/                 # Módulos de funcionalidade (alta coesão, baixo acoplamento)
│       ├── Ruler.js             # Barra de régua
│       ├── GuideManager.js      # Gerenciamento de guias (inclui persistência por URL)
│       ├── SelectionManager.js  # Caixas de seleção (arraste do mouse / seleção automática por classe)
│       ├── ScreenshotManager.js # Captura de seções e recorte (junção de canvases por célula)
│       ├── Naming.js            # Regras de nome PNG e de pasta com carimbo de tempo
│       ├── ProgressModal.js     # Modal de progresso
│       ├── SettingsModal.js     # Modal de configurações (configuração de atalhos)
│       ├── CoffeeModal.js       # Modal Convidar para um café (doação)
│       ├── ClassSelectionModal.js # Modal de entrada para seleção automática por classe
│       └── Toolbar.js           # Barra de ferramentas flutuante na página
├── lib/
│   └── html-to-image.js         # Solução complementar de captura de página inteira (SVG foreignObject)
├── assets/
│   ├── icons/                   # Ícones da extensão (16/32/48/128)
│   └── pay_coffee.jpg           # Código QR de doação
└── README.md
```

## Notas técnicas

### Abordagem de captura (junção por rolagem + recorte por região)

- **Abordagem principal**: **junção por rolagem** — independentemente do tamanho da página (incluindo as barras de rolagem horizontal e vertical), ela primeiro divide a página inteira em uma grade pelo tamanho da janela e, em seguida, rola célula por célula e chama `chrome.tabs.captureVisibleTab` para capturar a imagem renderizada real.
  - Diferente da abordagem anterior do «canvas de página inteira», a implementação atual **não cria mais um enorme canvas de página inteira** (para evitar exceder o limite de 32.000 pixels do navegador e produzir imagens em branco). Em vez disso, **cria um canvas independente para cada região a salvar** e, durante a rolagem, desenha a interseção entre a janela e cada região diretamente no canvas correspondente, reduzindo significativamente o uso de memória e o risco de falha de junção.
  - Tanto as partes visíveis quanto as invisíveis (que exigem rolagem) são salvas por completo.
  - As guias / caixas de seleção são o único critério de divisão; cada região = uma célula da grade de guias + as caixas selecionadas pelo usuário.
  - Usa capturas renderizadas reais, com maior fidelidade que o html2canvas.
- **Limitação de frequência de captura**: `captureVisibleTab` é limitada (pelo menos 500 ms entre duas chamadas) e executa automaticamente um recuo exponencial e nova tentativa quando ocorre um erro de cota do Chrome, evitando interrupções durante a captura célula por célula.
- **Ampliação HiDPI**: `EXPORT_SCALE` (padrão 2) amplia ainda mais sobre o dpr para uma saída PNG mais nítida.
- **Abordagem complementar**: `lib/html-to-image.js` (SVG `foreignObject`), disponível como alternativa para cenários extremos (ex.: contêineres com rolagem interna), extensível conforme necessário.

### Download de imagens grandes (documento fora da tela + transferência por segmentos)

- **Problema**: `chrome.downloads.download` que aceita diretamente uma data URL é limitado a **2 MB**, então capturas de ultra alta resolução podem falhar ou ser salvas incorretamente como `.txt`; e `URL.createObjectURL` não está disponível em um Service Worker MV3.
- **Abordagem**: criar dinamicamente um **documento fora da tela**, que realiza a conversão `data URL → Blob → blob URL` em um ambiente DOM normal.
  - O content script divide a data URL grande em segmentos de 4 MB e os envia um a um (`DOWNLOAD_CHUNK`); o documento fora da tela os acumula por nome de arquivo;
  - Após o envio de todos os segmentos, ele é notificado para montá-los em ordem em um Blob e gerar uma blob URL (`DOWNLOAD_ASSEMBLE`); segmentos ausentes causam um erro em vez de produzir um arquivo corrompido;
  - A ação de download final é executada pelo Service Worker usando a blob URL via `chrome.downloads.download` (o documento fora da tela não tem essa permissão).
- Cada imagem é salva em uma subpasta nomeada por carimbo de tempo, evitando sobrescritas e poluição de diretórios.

### Arquitetura do código (alta coesão, baixo acoplamento)

- Cada módulo de funcionalidade é encapsulado de forma independente em `content/modules/`, montado no namespace global `SSS` (carregado em ordem de dependências pelo manifest, não como módulos ES).
- A entrada `index.js` é responsável apenas por **injeção de dependências e montagem**, sem lógica de negócios.
- Os módulos se comunicam por **callbacks / mensagens**, evitando dependências diretas.
- Toda a interface vive dentro de um **Shadow DOM**, totalmente isolada dos estilos da página host.
- A persistência das guias é armazenada isolada por URL (`{ sss_guides : { [url] : [] } }`), usando uma fila serializada para evitar condições de corrida de leitura-modificação-escrita.

### Observações

- A junção de página inteira depende da API de captura de janela do navegador e rola a página inteira célula por célula; quanto maior a página, mais tempo leva (aproximadamente 250 ms de espera por célula para o render concluir).
- Se a página contiver elementos `position: fixed` (ex.: uma barra de navegação fixa), esses elementos aparecem em cada segmento de janela durante a junção, uma limitação inerente à captura de página inteira.
- As coordenadas das guias são baseadas no documento (rolagem de `window`); se o corpo da página viver em um contêiner com rolagem interna, talvez seja necessário mirar nesse contêiner.
- Devido às restrições de segurança do navegador, algumas páginas especiais (ex.: `chrome://`, Chrome Web Store) não podem ser injetadas.
- Quando uma página contém recursos de cross-origin, a API de captura retorna a imagem realmente renderizada, sem ser afetada pela contaminação cross-origin do canvas.

## Lista de testes

- [x] Todos os arquivos JS passam na verificação de sintaxe (`node --check`)
- [x] `manifest.json` passa na validação JSON; todos os arquivos referenciados existem
- [x] Testes unitários da regra de nome (URL → nome do site → nome de arquivo)
- [x] Testes unitários do algoritmo de partição (número de regiões, cobertura total da área, sem sobreposição)
- [ ] Captura real em várias páginas típicas (páginas longas, páginas com rolagem, páginas com elementos fixos)
- [ ] Teste real do arraste, modificação, exclusão e limpeza de tudo das guias
- [ ] Teste real do arraste da caixa de seleção, alternância de atalhos e seleção automática por classe
- [ ] Teste real do modal de progresso, cancelamento, download por segmentos muito longos e abertura de pasta

> Dica: após carregar a extensão, abra qualquer página web e percorra os fluxos acima. Se tiver problemas, clique com o botão direito na página → «Inspecionar» → Console e procure registros com o prefixo `[SSS]`.
