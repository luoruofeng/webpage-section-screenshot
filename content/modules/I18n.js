/**
 * I18n 模块 — 国际化（多语言）支持
 *
 * 职责：
 * - 维护各语言的界面文案字典（翻译由大模型直接提供，不依赖任何翻译脚本）
 * - 根据浏览器当前语言（navigator.language）初始化界面语言
 * - 提供统一的 t(key, params) 翻译接口与语言切换能力
 * - 将用户选择的语言持久化到 chrome.storage
 *
 * 高内聚：文案字典与语言管理全部封装于此；
 * 低耦合：各模块通过全局单例 SSS.I18n 获取翻译，不关心语言细节。
 */

(function () {
  // 语言列表：code 与浏览器语言前缀对应，label 为各语言自述名
  const LANGS = [
    { code: 'zh', label: '简体中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ru', label: 'Русский' },
  ];

  // 文案字典：zh 为源文案，其余语言为对应翻译
  const MESSAGES = {
    zh: {
      // 工具条
      toolbarStart: '开始裁切 PNG',
      toolbarClear: '清空参考线',
      toolbarSelectionOn: '开启选区框',
      toolbarSelectionOff: '关闭选区框',
      toolbarAutoSelection: '自动选区 (Class)',
      toolbarToggleOn: '隐藏标尺',
      toolbarToggleOff: '显示标尺',
      toolbarSettings: '设置',
      toolbarCoffee: '请作者喝咖啡',
      guideCount: '参考线：{count} 条',
      rulerDragHint: '点击鼠标左键不放进行参考线的拖动',
      // 设置
      settingsTitle: '插件设置',
      settingsShortcutLabel: '开启选区框快捷键',
      settingsShortcutTip: '点击上方方框后按下键盘按键即可修改',
      settingsLanguageLabel: '界面语言',
      settingsLanguageTip: '切换后界面语言立即生效',
      settingsSave: '保存设置',
      settingsClose: '关闭',
      settingsHowTo: '如何使用',
      // 如何使用模态框
      howtoTitle: '如何使用本插件',
      howtoLangLabel: '讲解语言',
      howtoClose: '关闭',
      // 进度模态框
      progressTitle: '正在保存 PNG 图片',
      progressPreparing: '正在准备...',
      progressCapturing: '正在截取网页内容 {done}/{total}...',
      progressExporting: '正在导出第 {index}/{total} 张图片...',
      progressCancel: '取消保存',
      progressCancelled: '已取消保存。',
      progressCancelledPartial: '已取消，成功保存 {count} 张。',
      progressDone: '全部完成，共保存 {count} 张 PNG 图片。',
      progressOpenFolder: '打开保存的文件夹',
      progressClose: '关闭',
      progressFooter: '图片命名：序号_网页名称.png',
      progressStartErr: '请先拖拽标尺设置参考线或使用选区框，以划分截图区域。',
      progressImageLoadErr: '截图加载失败，可能是页面包含跨域资源导致画布被污染。',
      progressCaptureErr: '视口截图调用失败',
      // 咖啡模态框
      coffeeTitle: '请作者喝杯咖啡吧',
      coffeeSubtitle: '你的支持是我持续更新的动力',
      coffeeClose: '太棒了，关掉它',
      // Class 选区模态框
      classTitle: '自动添加选区',
      classInputLabel: '请输入 Class 名称',
      classInputPlaceholder: '例如: card-item',
      classInputTip: '将为页面中所有匹配该 Class 的元素自动创建选区框',
      classConfirm: '确认添加',
      classCancel: '取消',
      // 选区提示
      selectionHint: '当前选区状态已开启（ESC退出选区状态）',
      // 参考线
      guideDeleteTitle: '删除此参考线',
      // 页面通知
      notifyClassAdded: '已根据 .{className} 自动添加 {count} 个选区。',
      notifyClassNotFound: '未找到 Class 为 .{className} 的可见元素。',
      notifyNoRegion: '请设置参考线或选区框以划分截图区域。',
      // Popup
      popupTitle: '网页分区截图',
      popupSubtitle: '拖拽标尺划分区域，保存为 PNG',
      popupClearAll: '一键清空参考线',
      popupGuideCount: '参考线数量',
      popupRulerState: '标尺状态',
      popupRulerShown: '已显示',
      popupRulerHidden: '已隐藏',
      popupUnavailable: '不可用',
      popupNoTab: '未找到当前标签页',
      popupHintLabel: '使用提示：',
      popupHint: '在页面顶部或左侧标尺上按住鼠标左键并拖动，即可拖出参考线。点击参考线可显示删除按钮。',
      popupNaming: '图片命名：',
      popupStartFail: '无法启动截图：{msg}',
      popupClearFail: '无法清空参考线：{msg}',
      popupToggleFail: '无法切换标尺：{msg}',
      // 使用指南（分步骤讲解，各语言由大模型直接提供，不依赖翻译脚本）
      guide: [
        {
          title: '插件简介',
          steps: [
            '这是一款用于“网页分区截图”的浏览器插件。',
            '你可以在网页上自由拖出参考线，将页面划分为多个区域。',
            '每个区域都会被单独保存为一张高清 PNG 图片。',
          ],
        },
        {
          title: '使用标尺添加参考线',
          steps: [
            '打开网页后，页面顶部和左侧会显示 Photoshop 风格的标尺。',
            '按住鼠标左键，从顶部标尺向下拖动，可添加一条水平参考线。',
            '按住鼠标左键，从左侧标尺向右拖动，可添加一条垂直参考线。',
            '点击任意参考线，会出现“删除”按钮，可将其删除。',
          ],
        },
        {
          title: '使用选区框',
          steps: [
            '点击工具条上的“开启选区框”按钮（或按快捷键，默认 P）。',
            '在页面上按下并拖动鼠标，即可绘制一个自由选区。',
            '选区框适合截取不规则的矩形区域。',
            '按 ESC 键可退出选区状态。',
          ],
        },
        {
          title: '自动选区（按 Class）',
          steps: [
            '点击工具条上的“自动选区”按钮。',
            '输入网页元素的 Class 名称（例如 card-item）。',
            '插件会自动为所有匹配该 Class 的元素创建选区框。',
          ],
        },
        {
          title: '开始裁切并保存 PNG',
          steps: [
            '划分好区域后，点击工具条顶部的“开始裁切 PNG”按钮。',
            '插件会按区域逐张截取网页内容并保存为 PNG 图片。',
            '图片会按照“序号_网页名称.png”的规则自动命名。',
            '保存完成后，可点击“打开保存的文件夹”查看结果。',
          ],
        },
        {
          title: '设置与快捷键',
          steps: [
            '点击工具条上的“设置”按钮，可修改选区框快捷键。',
            '在“界面语言”下拉框中，可随时切换插件界面语言。',
            '点击“如何使用”按钮，可随时查看本使用说明。',
          ],
        },
        {
          title: '小贴士',
          steps: [
            '参考线与选区框可以混合使用，灵活划分复杂区域。',
            '截图过程中会自动隐藏插件覆盖层，不会干扰截图。',
            '如果某个 Class 找不到可见元素，插件会给出提示。',
          ],
        },
      ],
    },
    en: {
      toolbarStart: 'Start Crop PNG',
      toolbarClear: 'Clear Guides',
      toolbarSelectionOn: 'Enable Selection',
      toolbarSelectionOff: 'Disable Selection',
      toolbarAutoSelection: 'Auto Select (Class)',
      toolbarToggleOn: 'Hide Ruler',
      toolbarToggleOff: 'Show Ruler',
      toolbarSettings: 'Settings',
      toolbarCoffee: 'Buy Author a Coffee',
      guideCount: 'Guides: {count}',
      rulerDragHint: 'Hold the left mouse button and drag to create a guide',
      settingsTitle: 'Plugin Settings',
      settingsShortcutLabel: 'Selection Box Shortcut',
      settingsShortcutTip: 'Click the box above, then press a key to change it',
      settingsLanguageLabel: 'Interface Language',
      settingsLanguageTip: 'Takes effect immediately after switching',
      settingsSave: 'Save Settings',
      settingsClose: 'Close',
      settingsHowTo: 'How to Use',
      howtoTitle: 'How to Use This Plugin',
      howtoLangLabel: 'Guide Language',
      howtoClose: 'Close',
      progressTitle: 'Saving PNG Images',
      progressPreparing: 'Preparing...',
      progressCapturing: 'Capturing page content {done}/{total}...',
      progressExporting: 'Exporting image {index}/{total}...',
      progressCancel: 'Cancel Saving',
      progressCancelled: 'Saving cancelled.',
      progressCancelledPartial: 'Cancelled, saved {count} successfully.',
      progressDone: 'Done, saved {count} PNG images.',
      progressOpenFolder: 'Open Saved Folder',
      progressClose: 'Close',
      progressFooter: 'Naming: index_page-name.png',
      progressStartErr: 'Please drag on the ruler to set guides or use the selection box to define a crop area.',
      progressImageLoadErr: 'Failed to load screenshot. The page may contain cross-origin resources that taint the canvas.',
      progressCaptureErr: 'Failed to capture the viewport',
      coffeeTitle: 'Buy the Author a Coffee',
      coffeeSubtitle: 'Your support keeps me improving',
      coffeeClose: 'Great, Close It',
      classTitle: 'Auto Add Selections',
      classInputLabel: 'Enter a Class name',
      classInputPlaceholder: 'e.g. card-item',
      classInputTip: 'Selections will be created for all elements matching this Class',
      classConfirm: 'Confirm Add',
      classCancel: 'Cancel',
      selectionHint: 'Selection mode is ON (press ESC to exit)',
      guideDeleteTitle: 'Delete this guide',
      notifyClassAdded: 'Added {count} selections based on .{className}.',
      notifyClassNotFound: 'No visible element found with Class .{className}.',
      notifyNoRegion: 'Please set guides or a selection box to define the screenshot area.',
      popupTitle: 'Webpage Section Screenshot',
      popupSubtitle: 'Drag the ruler to divide areas, save as PNG',
      popupClearAll: 'Clear All Guides',
      popupGuideCount: 'Guide Count',
      popupRulerState: 'Ruler State',
      popupRulerShown: 'Shown',
      popupRulerHidden: 'Hidden',
      popupUnavailable: 'Unavailable',
      popupNoTab: 'No active tab found',
      popupHintLabel: 'Tip: ',
      popupHint: 'Press and drag on the top or left ruler to pull out guides. Click a guide to show its delete button.',
      popupNaming: 'Naming: ',
      popupStartFail: 'Unable to start screenshot: {msg}',
      popupClearFail: 'Unable to clear guides: {msg}',
      popupToggleFail: 'Unable to toggle ruler: {msg}',
      // Guide content (provided directly by the model for each language, no translation scripts)
      guide: [
        {
          title: 'Plugin Overview',
          steps: [
            'This is a browser extension for taking section screenshots of webpages.',
            'You can freely drag out guides on the page to divide it into multiple areas.',
            'Each area is saved separately as a high-resolution PNG image.',
          ],
        },
        {
          title: 'Adding Guides with the Ruler',
          steps: [
            'After opening a page, Photoshop-style rulers appear at the top and left.',
            'Hold the left mouse button and drag downward from the top ruler to add a horizontal guide.',
            'Hold the left mouse button and drag rightward from the left ruler to add a vertical guide.',
            'Click any guide to reveal a "Delete" button and remove it.',
          ],
        },
        {
          title: 'Using the Selection Box',
          steps: [
            'Click the "Enable Selection" button on the toolbar (or use the shortcut, P by default).',
            'Press and drag the mouse on the page to draw a free-form selection.',
            'The selection box is ideal for capturing irregular rectangular areas.',
            'Press ESC to exit selection mode.',
          ],
        },
        {
          title: 'Auto-Select (by Class)',
          steps: [
            'Click the "Auto Select" button on the toolbar.',
            'Enter a CSS Class name of the elements (e.g. card-item).',
            'Selections are automatically created for all elements matching that Class.',
          ],
        },
        {
          title: 'Starting the Crop and Saving PNG',
          steps: [
            'After dividing the areas, click the "Start Crop PNG" button at the top of the toolbar.',
            'The extension captures each area one by one and saves them as PNG images.',
            'Images are automatically named using the pattern "index_page-name.png".',
            'After saving, click "Open Saved Folder" to view the results.',
          ],
        },
        {
          title: 'Settings and Shortcuts',
          steps: [
            'Click the "Settings" button on the toolbar to change the selection shortcut.',
            'In the "Interface Language" dropdown, you can switch the plugin UI language anytime.',
            'Click "How to Use" to view this guide at any time.',
          ],
        },
        {
          title: 'Tips',
          steps: [
            'Guides and selection boxes can be combined to flexibly divide complex areas.',
            'The plugin overlay hides automatically during screenshots, so it never interferes.',
            'If a Class has no visible elements, the plugin will show a hint.',
          ],
        },
      ],
    },
    ja: {
      toolbarStart: 'PNG 切り出し開始',
      toolbarClear: 'ガイドをクリア',
      toolbarSelectionOn: '選択枠を有効化',
      toolbarSelectionOff: '選択枠を無効化',
      toolbarAutoSelection: '自動選択 (Class)',
      toolbarToggleOn: 'ルーラーを隠す',
      toolbarToggleOff: 'ルーラーを表示',
      toolbarSettings: '設定',
      toolbarCoffee: '作者にコーヒーを',
      guideCount: 'ガイド：{count} 本',
      rulerDragHint: '左マウスボタンを押したままドラッグしてガイドを作成します',
      settingsTitle: 'プラグイン設定',
      settingsShortcutLabel: '選択枠のショートカット',
      settingsShortcutTip: '上のボックスをクリックしてキーを押すと変更できます',
      settingsLanguageLabel: '表示言語',
      settingsLanguageTip: '切り替えるとすぐに反映されます',
      settingsSave: '設定を保存',
      settingsClose: '閉じる',
      settingsHowTo: '使い方',
      howtoTitle: 'このプラグインの使い方',
      howtoLangLabel: '解説言語',
      howtoClose: '閉じる',
      progressTitle: 'PNG 画像を保存中',
      progressPreparing: '準備中...',
      progressCapturing: 'ページ内容を取得中 {done}/{total}...',
      progressExporting: '{index}/{total} 枚目の画像を出力中...',
      progressCancel: '保存をキャンセル',
      progressCancelled: '保存をキャンセルしました。',
      progressCancelledPartial: 'キャンセルしました。{count} 枚保存されました。',
      progressDone: '完了しました。合計 {count} 枚の PNG を保存しました。',
      progressOpenFolder: '保存先フォルダを開く',
      progressClose: '閉じる',
      progressFooter: '命名：連番_ページ名.png',
      progressStartErr: 'ルーラーをドラッグしてガイドを設定するか、選択枠で切り出し範囲を指定してください。',
      progressImageLoadErr: 'スクリーンショットの読み込みに失敗しました。クロスオリジンのリソースでキャンバスが汚染されている可能性があります。',
      progressCaptureErr: 'ビューポートのキャプチャに失敗しました',
      coffeeTitle: '作者にコーヒーをごちそうしよう',
      coffeeSubtitle: 'あなたの支援が更新の原動力です',
      coffeeClose: 'すばらしい、閉じる',
      classTitle: '選択を自動追加',
      classInputLabel: 'Class 名を入力',
      classInputPlaceholder: '例: card-item',
      classInputTip: 'この Class に一致するすべての要素に選択枠を作成します',
      classConfirm: '追加を確認',
      classCancel: 'キャンセル',
      selectionHint: '選択状態が有効です（ESCで終了）',
      guideDeleteTitle: 'このガイドを削除',
      notifyClassAdded: '.{className} に基づき {count} 個の選択を追加しました。',
      notifyClassNotFound: 'Class .{className} の表示要素が見つかりません。',
      notifyNoRegion: 'スクリーンショット範囲を指定するため、ガイドまたは選択枠を設定してください。',
      popupTitle: 'ウェブページ区画スクリーンショット',
      popupSubtitle: 'ルーラーをドラッグして範囲を分割し、PNG で保存',
      popupClearAll: 'すべてのガイドをクリア',
      popupGuideCount: 'ガイド数',
      popupRulerState: 'ルーラー状態',
      popupRulerShown: '表示中',
      popupRulerHidden: '非表示',
      popupUnavailable: '利用不可',
      popupNoTab: '現在のタブが見つかりません',
      popupHintLabel: 'ヒント：',
      popupHint: 'ページ上部または左側のルーラーを押しながらドラッグするとガイドを引き出せます。ガイドをクリックすると削除ボタンが表示されます。',
      popupNaming: '命名：',
      popupStartFail: 'スクリーンショットを開始できません：{msg}',
      popupClearFail: 'ガイドをクリアできません：{msg}',
      popupToggleFail: 'ルーラーを切り替えられません：{msg}',
      // 解説コンテンツ（各言語は大モデルが直接提供、翻訳スクリプト不使用）
      guide: [
        {
          title: 'プラグイン概要',
          steps: [
            'これはウェブページを区画ごとにスクリーンショットできるブラウザ拡張機能です。',
            'ページ上にガイドを自由にドラッグして、複数の領域に分割できます。',
            '各領域はそれぞれ高解像度の PNG 画像として保存されます。',
          ],
        },
        {
          title: 'ルーラーでガイドを追加',
          steps: [
            'ページを開くと、上部と左側に Photoshop 風のルーラーが表示されます。',
            '左マウスボタンを押したまま上部ルーラーから下へドラッグすると、水平ガイドを追加できます。',
            '左マウスボタンを押したまま左側ルーラーから右へドラッグすると、垂直ガイドを追加できます。',
            'ガイドをクリックすると「削除」ボタンが表示され、削除できます。',
          ],
        },
        {
          title: '選択枠を使う',
          steps: [
            'ツールバーの「選択枠を有効化」ボタンをクリックします（ショートカット、デフォルトは P）。',
            'ページ上でマウスを押しながらドラッグすると、自由な選択枠を描けます。',
            '選択枠は不規則な矩形領域の切り取りに適しています。',
            'ESC キーで選択状態を終了できます。',
          ],
        },
        {
          title: '自動選択（Class）',
          steps: [
            'ツールバーの「自動選択」ボタンをクリックします。',
            '要素の CSS Class 名を入力します（例: card-item）。',
            'その Class に一致するすべての要素に選択枠が自動作成されます。',
          ],
        },
        {
          title: '切り出しを開始して PNG を保存',
          steps: [
            '領域を分割したら、ツールバー上部の「PNG 切り出し開始」ボタンをクリックします。',
            '領域ごとにページ内容を順番にキャプチャし、PNG 画像として保存します。',
            '画像は「連番_ページ名.png」の規則で自動的に命名されます。',
            '保存後、「保存先フォルダを開く」をクリックして結果を確認できます。',
          ],
        },
        {
          title: '設定とショートカット',
          steps: [
            'ツールバーの「設定」ボタンをクリックすると、選択ショートカットを変更できます。',
            '「表示言語」ドロップダウンで、いつでもプラグインの UI 言語を切り替えられます。',
            '「使い方」ボタンをクリックすると、いつでもこの解説を表示できます。',
          ],
        },
        {
          title: 'ヒント',
          steps: [
            'ガイドと選択枠を組み合わせて、複雑な領域を柔軟に分割できます。',
            'スクリーンショット中はプラグインのオーバーレイが自動的に非表示になり、写り込みません。',
            'Class に対応する表示要素が見つからない場合は、ヒントが表示されます。',
          ],
        },
      ],
    },
    ko: {
      toolbarStart: 'PNG 자르기 시작',
      toolbarClear: '가이드 지우기',
      toolbarSelectionOn: '선택 영역 켜기',
      toolbarSelectionOff: '선택 영역 끄기',
      toolbarAutoSelection: '자동 선택 (Class)',
      toolbarToggleOn: '눈금자 숨기기',
      toolbarToggleOff: '눈금자 표시',
      toolbarSettings: '설정',
      toolbarCoffee: '작성자에게 커피 쏘기',
      guideCount: '가이드: {count}개',
      rulerDragHint: '마우스 왼쪽 버튼을 누른 채 드래그하여 가이드를 만듭니다',
      settingsTitle: '플러그인 설정',
      settingsShortcutLabel: '선택 영역 단축키',
      settingsShortcutTip: '위 상자를 클릭한 후 키를 누르면 변경됩니다',
      settingsLanguageLabel: '인터페이스 언어',
      settingsLanguageTip: '전환 즉시 적용됩니다',
      settingsSave: '설정 저장',
      settingsClose: '닫기',
      settingsHowTo: '사용 방법',
      howtoTitle: '이 플러그인 사용 방법',
      howtoLangLabel: '설명 언어',
      howtoClose: '닫기',
      progressTitle: 'PNG 이미지 저장 중',
      progressPreparing: '준비 중...',
      progressCapturing: '페이지 콘텐츠 캡처 중 {done}/{total}...',
      progressExporting: '{index}/{total}번째 이미지 내보내는 중...',
      progressCancel: '저장 취소',
      progressCancelled: '저장이 취소되었습니다.',
      progressCancelledPartial: '취소되었으며 {count}개가 저장되었습니다.',
      progressDone: '완료, 총 {count}개의 PNG 이미지를 저장했습니다.',
      progressOpenFolder: '저장 폴더 열기',
      progressClose: '닫기',
      progressFooter: '이름 지정: 번호_페이지명.png',
      progressStartErr: '눈금자를 드래그해 가이드를 설정하거나 선택 영역으로 잘라낼 범위를 지정하세요.',
      progressImageLoadErr: '스크린샷 로드에 실패했습니다. 교차 출처 리소스로 인해 캔버스가 오염되었을 수 있습니다.',
      progressCaptureErr: '뷰포트 캡처 실패',
      coffeeTitle: '작성자에게 커피 한 잔을 사주세요',
      coffeeSubtitle: '당신의 지원이 지속적인 업데이트의 원동력입니다',
      coffeeClose: '좋아요, 닫기',
      classTitle: '선택 자동 추가',
      classInputLabel: 'Class 이름 입력',
      classInputPlaceholder: '예: card-item',
      classInputTip: '이 Class와 일치하는 모든 요소에 선택 영역을 만듭니다',
      classConfirm: '추가 확인',
      classCancel: '취소',
      selectionHint: '선택 상태가 활성화되었습니다 (ESC로 종료)',
      guideDeleteTitle: '이 가이드 삭제',
      notifyClassAdded: '.{className} 기준으로 {count}개의 선택 영역을 추가했습니다.',
      notifyClassNotFound: 'Class .{className}의 표시 요소를 찾을 수 없습니다.',
      notifyNoRegion: '스크린샷 영역을 지정하려면 가이드 또는 선택 영역을 설정하세요.',
      popupTitle: '웹페이지 영역 스크린샷',
      popupSubtitle: '눈금자를 드래그해 영역을 나누고 PNG로 저장',
      popupClearAll: '모든 가이드 지우기',
      popupGuideCount: '가이드 수',
      popupRulerState: '눈금자 상태',
      popupRulerShown: '표시됨',
      popupRulerHidden: '숨김',
      popupUnavailable: '사용 불가',
      popupNoTab: '현재 탭을 찾을 수 없습니다',
      popupHintLabel: '팁: ',
      popupHint: '페이지 상단 또는 왼쪽 눈금자를 누른 채 드래그하면 가이드를 꺼낼 수 있습니다. 가이드를 클릭하면 삭제 버튼이 표시됩니다.',
      popupNaming: '이름 지정: ',
      popupStartFail: '스크린샷을 시작할 수 없습니다: {msg}',
      popupClearFail: '가이드를 지울 수 없습니다: {msg}',
      popupToggleFail: '눈금자를 전환할 수 없습니다: {msg}',
      // 가이드 내용 (각 언어는 대형 모델이 직접 제공, 번역 스크립트 없음)
      guide: [
        {
          title: '플러그인 개요',
          steps: [
            '웹페이지를 구역별로 스크린샷할 수 있는 브라우저 확장 프로그램입니다.',
            '페이지에 가이드를 자유롭게 드래그하여 여러 영역으로 나눌 수 있습니다.',
            '각 영역은 고해상도 PNG 이미지로 개별 저장됩니다.',
          ],
        },
        {
          title: '눈금자로 가이드 추가',
          steps: [
            '페이지를 열면 상단과 왼쪽에 Photoshop 스타일의 눈금자가 표시됩니다.',
            '왼쪽 마우스 버튼을 누른 채 상단 눈금자에서 아래로 드래그하면 가로 가이드를 추가할 수 있습니다.',
            '왼쪽 마우스 버튼을 누른 채 왼쪽 눈금자에서 오른쪽으로 드래그하면 세로 가이드를 추가할 수 있습니다.',
            '가이드를 클릭하면 "삭제" 버튼이 나타나 제거할 수 있습니다.',
          ],
        },
        {
          title: '선택 영역 사용',
          steps: [
            '도구 모음의 "선택 영역 켜기" 버튼을 클릭합니다 (단축키, 기본값 P).',
            '페이지에서 마우스를 누른 채 드래그하면 자유 선택 영역을 그릴 수 있습니다.',
            '선택 영역은 불규칙한 사각형 영역을 캡처하는 데 적합합니다.',
            'ESC 키를 누르면 선택 상태를 종료합니다.',
          ],
        },
        {
          title: '자동 선택 (Class)',
          steps: [
            '도구 모음의 "자동 선택" 버튼을 클릭합니다.',
            '요소의 CSS Class 이름을 입력합니다 (예: card-item).',
            '해당 Class와 일치하는 모든 요소에 선택 영역이 자동으로 생성됩니다.',
          ],
        },
        {
          title: '자르기 시작 및 PNG 저장',
          steps: [
            '영역을 나눈 후 도구 모음 상단의 "PNG 자르기 시작" 버튼을 클릭합니다.',
            '확장 프로그램이 영역별로 페이지를 순서대로 캡처하여 PNG 이미지로 저장합니다.',
            '이미지는 "번호_페이지명.png" 규칙으로 자동 이름이 지정됩니다.',
            '저장 후 "저장 폴더 열기"를 클릭해 결과를 확인할 수 있습니다.',
          ],
        },
        {
          title: '설정 및 단축키',
          steps: [
            '도구 모음의 "설정" 버튼을 클릭하면 선택 단축키를 변경할 수 있습니다.',
            '"인터페이스 언어" 드롭다운에서 언제든지 플러그인 UI 언어를 전환할 수 있습니다.',
            '"사용 방법" 버튼을 클릭하면 언제든지 이 가이드를 볼 수 있습니다.',
          ],
        },
        {
          title: '팁',
          steps: [
            '가이드와 선택 영역을 함께 사용하여 복잡한 영역을 유연하게 나눌 수 있습니다.',
            '스크린샷 중에는 플러그인 오버레이가 자동으로 숨겨져 화면에 포함되지 않습니다.',
            'Class에 해당하는 표시 요소가 없으면 안내 메시지가 표시됩니다.',
          ],
        },
      ],
    },
    es: {
      toolbarStart: 'Iniciar recorte PNG',
      toolbarClear: 'Limpiar guías',
      toolbarSelectionOn: 'Activar selección',
      toolbarSelectionOff: 'Desactivar selección',
      toolbarAutoSelection: 'Selección automática (Class)',
      toolbarToggleOn: 'Ocultar regla',
      toolbarToggleOff: 'Mostrar regla',
      toolbarSettings: 'Ajustes',
      toolbarCoffee: 'Invitar al autor a un café',
      guideCount: 'Guías: {count}',
      rulerDragHint: 'Mantén pulsado el botón izquierdo del ratón y arrastra para crear una guía',
      settingsTitle: 'Ajustes del plugin',
      settingsShortcutLabel: 'Atajo de selección',
      settingsShortcutTip: 'Haz clic en el cuadro de arriba y pulsa una tecla para cambiarlo',
      settingsLanguageLabel: 'Idioma de interfaz',
      settingsLanguageTip: 'Se aplica de inmediato al cambiar',
      settingsSave: 'Guardar ajustes',
      settingsClose: 'Cerrar',
      settingsHowTo: 'Cómo usar',
      howtoTitle: 'Cómo usar este plugin',
      howtoLangLabel: 'Idioma de la guía',
      howtoClose: 'Cerrar',
      progressTitle: 'Guardando imágenes PNG',
      progressPreparing: 'Preparando...',
      progressCapturing: 'Capturando contenido {done}/{total}...',
      progressExporting: 'Exportando imagen {index}/{total}...',
      progressCancel: 'Cancelar guardado',
      progressCancelled: 'Guardado cancelado.',
      progressCancelledPartial: 'Cancelado, se guardaron {count} correctamente.',
      progressDone: 'Listo, se guardaron {count} imágenes PNG.',
      progressOpenFolder: 'Abrir carpeta de guardado',
      progressClose: 'Cerrar',
      progressFooter: 'Nombrado: índice_nombre-de-página.png',
      progressStartErr: 'Arrastra sobre la regla para establecer guías o usa el cuadro de selección para definir el área.',
      progressImageLoadErr: 'Error al cargar la captura. La página puede contener recursos de origen cruzado que contaminan el lienzo.',
      progressCaptureErr: 'Error al capturar la ventana gráfica',
      coffeeTitle: 'Invita al autor a un café',
      coffeeSubtitle: 'Tu apoyo me mantiene mejorando',
      coffeeClose: 'Genial, cerrarlo',
      classTitle: 'Añadir selecciones automáticamente',
      classInputLabel: 'Introduce un nombre de Class',
      classInputPlaceholder: 'p. ej. card-item',
      classInputTip: 'Se crearán selecciones para todos los elementos que coincidan con esta Class',
      classConfirm: 'Confirmar añadido',
      classCancel: 'Cancelar',
      selectionHint: 'El modo de selección está activado (pulsa ESC para salir)',
      guideDeleteTitle: 'Eliminar esta guía',
      notifyClassAdded: 'Se añadieron {count} selecciones basadas en .{className}.',
      notifyClassNotFound: 'No se encontró ningún elemento visible con la Class .{className}.',
      notifyNoRegion: 'Establece guías o un cuadro de selección para definir el área de captura.',
      popupTitle: 'Captura de sección de página web',
      popupSubtitle: 'Arrastra la regla para dividir áreas y guarda como PNG',
      popupClearAll: 'Limpiar todas las guías',
      popupGuideCount: 'Número de guías',
      popupRulerState: 'Estado de la regla',
      popupRulerShown: 'Visible',
      popupRulerHidden: 'Oculto',
      popupUnavailable: 'No disponible',
      popupNoTab: 'No se encontró la pestaña activa',
      popupHintLabel: 'Consejo: ',
      popupHint: 'Mantén pulsado y arrastra sobre la regla superior o izquierda para sacar guías. Haz clic en una guía para mostrar su botón de eliminar.',
      popupNaming: 'Nombrado: ',
      popupStartFail: 'No se pudo iniciar la captura: {msg}',
      popupClearFail: 'No se pudieron limpiar las guías: {msg}',
      popupToggleFail: 'No se pudo alternar la regla: {msg}',
      // Contenido de la guía (proporcionado directamente por el modelo para cada idioma, sin scripts de traducción)
      guide: [
        {
          title: 'Resumen del plugin',
          steps: [
            'Esta es una extensión de navegador para tomar capturas de secciones de páginas web.',
            'Puedes arrastrar libremente guías sobre la página para dividirla en varias áreas.',
            'Cada área se guarda por separado como una imagen PNG de alta resolución.',
          ],
        },
        {
          title: 'Añadir guías con la regla',
          steps: [
            'Al abrir una página, aparecen reglas estilo Photoshop arriba y a la izquierda.',
            'Mantén pulsado el botón izquierdo y arrastra hacia abajo desde la regla superior para añadir una guía horizontal.',
            'Mantén pulsado el botón izquierdo y arrastra hacia la derecha desde la regla izquierda para añadir una guía vertical.',
            'Haz clic en una guía para ver el botón "Eliminar" y quitarla.',
          ],
        },
        {
          title: 'Usar el cuadro de selección',
          steps: [
            'Haz clic en el botón "Activar selección" de la barra de herramientas (o usa el atajo, P por defecto).',
            'Pulsa y arrastra el ratón sobre la página para dibujar una selección libre.',
            'El cuadro de selección es ideal para capturar áreas rectangulares irregulares.',
            'Pulsa ESC para salir del modo selección.',
          ],
        },
        {
          title: 'Selección automática (por Class)',
          steps: [
            'Haz clic en el botón "Selección automática" de la barra de herramientas.',
            'Introduce el nombre de una Class CSS de los elementos (p. ej. card-item).',
            'Se crean automáticamente selecciones para todos los elementos que coinciden con esa Class.',
          ],
        },
        {
          title: 'Iniciar el recorte y guardar PNG',
          steps: [
            'Tras dividir las áreas, haz clic en el botón "Iniciar recorte PNG" en la parte superior de la barra.',
            'La extensión captura cada área una a una y las guarda como imágenes PNG.',
            'Las imágenes se nombran automáticamente con el patrón "índice_nombre-de-página.png".',
            'Después de guardar, haz clic en "Abrir carpeta de guardado" para ver los resultados.',
          ],
        },
        {
          title: 'Ajustes y atajos',
          steps: [
            'Haz clic en el botón "Ajustes" de la barra para cambiar el atajo de selección.',
            'En el desplegable "Idioma de interfaz", puedes cambiar el idioma de la interfaz en cualquier momento.',
            'Haz clic en "Cómo usar" para ver esta guía en cualquier momento.',
          ],
        },
        {
          title: 'Consejos',
          steps: [
            'Puedes combinar guías y cuadros de selección para dividir áreas complejas de forma flexible.',
            'Durante la captura, la superposición del plugin se oculta automáticamente para no interferir.',
            'Si una Class no tiene elementos visibles, el plugin mostrará un aviso.',
          ],
        },
      ],
    },
    fr: {
      toolbarStart: 'Démarrer le recadrage PNG',
      toolbarClear: 'Effacer les guides',
      toolbarSelectionOn: 'Activer la sélection',
      toolbarSelectionOff: 'Désactiver la sélection',
      toolbarAutoSelection: 'Sélection auto (Class)',
      toolbarToggleOn: 'Masquer la règle',
      toolbarToggleOff: 'Afficher la règle',
      toolbarSettings: 'Paramètres',
      toolbarCoffee: 'Offrir un café à l’auteur',
      guideCount: 'Guides : {count}',
      rulerDragHint: 'Maintenez le bouton gauche de la souris et faites glisser pour créer un guide',
      settingsTitle: 'Paramètres du plugin',
      settingsShortcutLabel: 'Raccourci de sélection',
      settingsShortcutTip: 'Cliquez sur le cadre ci-dessus puis appuyez sur une touche pour le modifier',
      settingsLanguageLabel: 'Langue de l’interface',
      settingsLanguageTip: 'Appliqué immédiatement après le changement',
      settingsSave: 'Enregistrer',
      settingsClose: 'Fermer',
      settingsHowTo: 'Comment utiliser',
      howtoTitle: 'Comment utiliser ce plugin',
      howtoLangLabel: 'Langue du guide',
      howtoClose: 'Fermer',
      progressTitle: 'Enregistrement des images PNG',
      progressPreparing: 'Préparation...',
      progressCapturing: 'Capture du contenu {done}/{total}...',
      progressExporting: 'Export de l’image {index}/{total}...',
      progressCancel: 'Annuler l’enregistrement',
      progressCancelled: 'Enregistrement annulé.',
      progressCancelledPartial: 'Annulé, {count} enregistrées avec succès.',
      progressDone: 'Terminé, {count} images PNG enregistrées.',
      progressOpenFolder: 'Ouvrir le dossier de sauvegarde',
      progressClose: 'Fermer',
      progressFooter: 'Nommage : index_nom-de-page.png',
      progressStartErr: 'Faites glisser la règle pour définir des guides ou utilisez le cadre de sélection.',
      progressImageLoadErr: 'Échec du chargement de la capture. La page peut contenir des ressources inter-origines qui salissent le canevas.',
      progressCaptureErr: 'Échec de la capture du viewport',
      coffeeTitle: 'Offrez un café à l’auteur',
      coffeeSubtitle: 'Votre soutien me motive à améliorer',
      coffeeClose: 'Super, fermer',
      classTitle: 'Ajout automatique de sélections',
      classInputLabel: 'Saisissez un nom de Class',
      classInputPlaceholder: 'ex. card-item',
      classInputTip: 'Des sélections seront créées pour tous les éléments correspondant à cette Class',
      classConfirm: 'Confirmer',
      classCancel: 'Annuler',
      selectionHint: 'Le mode sélection est activé (ESC pour quitter)',
      guideDeleteTitle: 'Supprimer ce guide',
      notifyClassAdded: '{count} sélections ajoutées basées sur .{className}.',
      notifyClassNotFound: 'Aucun élément visible trouvé avec la Class .{className}.',
      notifyNoRegion: 'Définissez des guides ou un cadre de sélection pour la zone de capture.',
      popupTitle: 'Capture de section de page web',
      popupSubtitle: 'Faites glisser la règle pour diviser les zones, enregistrez en PNG',
      popupClearAll: 'Effacer toutes les guides',
      popupGuideCount: 'Nombre de guides',
      popupRulerState: 'État de la règle',
      popupRulerShown: 'Visible',
      popupRulerHidden: 'Masquée',
      popupUnavailable: 'Indisponible',
      popupNoTab: 'Aucun onglet actif trouvé',
      popupHintLabel: 'Astuce : ',
      popupHint: 'Appuyez et faites glisser sur la règle supérieure ou gauche pour sortir des guides. Cliquez sur une guide pour afficher son bouton de suppression.',
      popupNaming: 'Nommage : ',
      popupStartFail: 'Impossible de démarrer la capture : {msg}',
      popupClearFail: 'Impossible d\'effacer les guides : {msg}',
      popupToggleFail: 'Impossible de basculer la règle : {msg}',
      // Contenu du guide (fourni directement par le modèle pour chaque langue, aucun script de traduction)
      guide: [
        {
          title: 'Présentation du plugin',
          steps: [
            'Il s\'agit d\'une extension de navigateur pour capturer des sections de pages web.',
            'Vous pouvez faire glisser librement des guides sur la page pour la diviser en plusieurs zones.',
            'Chaque zone est enregistrée séparément comme image PNG haute résolution.',
          ],
        },
        {
          title: 'Ajouter des guides avec la règle',
          steps: [
            'À l\'ouverture d\'une page, des règles de style Photoshop apparaissent en haut et à gauche.',
            'Maintenez le bouton gauche et faites glisser vers le bas depuis la règle supérieure pour ajouter un guide horizontal.',
            'Maintenez le bouton gauche et faites glisser vers la droite depuis la règle gauche pour ajouter un guide vertical.',
            'Cliquez sur un guide pour afficher le bouton "Supprimer" et le retirer.',
          ],
        },
        {
          title: 'Utiliser le cadre de sélection',
          steps: [
            'Cliquez sur le bouton "Activer la sélection" de la barre d\'outils (ou utilisez le raccourci, P par défaut).',
            'Appuyez et faites glisser la souris sur la page pour dessiner une sélection libre.',
            'Le cadre de sélection convient aux zones rectangulaires irrégulières.',
            'Appuyez sur ESC pour quitter le mode sélection.',
          ],
        },
        {
          title: 'Sélection automatique (par Class)',
          steps: [
            'Cliquez sur le bouton "Sélection auto" de la barre d\'outils.',
            'Saisissez un nom de Class CSS des éléments (ex. card-item).',
            'Des sélections sont créées automatiquement pour tous les éléments correspondant à cette Class.',
          ],
        },
        {
          title: 'Lancer le recadrage et enregistrer en PNG',
          steps: [
            'Après avoir divisé les zones, cliquez sur le bouton "Démarrer le recadrage PNG" en haut de la barre.',
            'L\'extension capture chaque zone une par une et les enregistre en PNG.',
            'Les images sont nommées automatiquement selon le motif "index_nom-de-page.png".',
            'Après l\'enregistrement, cliquez sur "Ouvrir le dossier de sauvegarde" pour voir les résultats.',
          ],
        },
        {
          title: 'Paramètres et raccourcis',
          steps: [
            'Cliquez sur le bouton "Paramètres" de la barre pour modifier le raccourci de sélection.',
            'Dans la liste déroulante "Langue de l\'interface", vous pouvez changer la langue de l\'interface à tout moment.',
            'Cliquez sur "Comment utiliser" pour voir ce guide à tout moment.',
          ],
        },
        {
          title: 'Conseils',
          steps: [
            'Vous pouvez combiner guides et cadres de sélection pour diviser des zones complexes avec souplesse.',
            'Pendant la capture, la superposition du plugin se masque automatiquement pour ne pas interférer.',
            'Si une Class n\'a aucun élément visible, le plugin affichera une astuce.',
          ],
        },
      ],
    },
    de: {
      toolbarStart: 'PNG-Zuschnitt starten',
      toolbarClear: 'Hilfslinien löschen',
      toolbarSelectionOn: 'Auswahl aktivieren',
      toolbarSelectionOff: 'Auswahl deaktivieren',
      toolbarAutoSelection: 'Auto-Auswahl (Class)',
      toolbarToggleOn: 'Lineal ausblenden',
      toolbarToggleOff: 'Lineal anzeigen',
      toolbarSettings: 'Einstellungen',
      toolbarCoffee: 'Autor einen Kaffee ausgeben',
      guideCount: 'Hilfslinien: {count}',
      rulerDragHint: 'Halten Sie die linke Maustaste gedrückt und ziehen Sie, um eine Hilfslinie zu erstellen',
      settingsTitle: 'Plugin-Einstellungen',
      settingsShortcutLabel: 'Auswahl-Tastenkürzel',
      settingsShortcutTip: 'Klicken Sie oben auf das Feld und drücken Sie eine Taste, um es zu ändern',
      settingsLanguageLabel: 'Oberflächensprache',
      settingsLanguageTip: 'Wird nach dem Wechsel sofort angewendet',
      settingsSave: 'Einstellungen speichern',
      settingsClose: 'Schließen',
      settingsHowTo: 'So wird\'s benutzt',
      howtoTitle: 'So verwenden Sie dieses Plugin',
      howtoLangLabel: 'Sprache der Anleitung',
      howtoClose: 'Schließen',
      progressTitle: 'PNG-Bilder werden gespeichert',
      progressPreparing: 'Vorbereitung...',
      progressCapturing: 'Seiteninhalt erfassen {done}/{total}...',
      progressExporting: 'Bild {index}/{total} wird exportiert...',
      progressCancel: 'Speichern abbrechen',
      progressCancelled: 'Speichern abgebrochen.',
      progressCancelledPartial: 'Abgebrochen, {count} erfolgreich gespeichert.',
      progressDone: 'Fertig, {count} PNG-Bilder gespeichert.',
      progressOpenFolder: 'Gespeicherten Ordner öffnen',
      progressClose: 'Schließen',
      progressFooter: 'Benennung: Index_Seitenname.png',
      progressStartErr: 'Ziehen Sie auf dem Lineal, um Hilfslinien zu setzen, oder verwenden Sie die Auswahl für den Bereich.',
      progressImageLoadErr: 'Screenshot konnte nicht geladen werden. Die Seite enthält möglicherweise Cross-Origin-Ressourcen, die die Canvas verschmutzen.',
      progressCaptureErr: 'Ansichtsfenster konnte nicht erfasst werden',
      coffeeTitle: 'Geben Sie dem Autor einen Kaffee aus',
      coffeeSubtitle: 'Ihre Unterstützung hält mich am Verbessern',
      coffeeClose: 'Super, schließen',
      classTitle: 'Auswahlen automatisch hinzufügen',
      classInputLabel: 'Class-Namen eingeben',
      classInputPlaceholder: 'z. B. card-item',
      classInputTip: 'Für alle Elemente, die dieser Class entsprechen, werden Auswahlen erstellt',
      classConfirm: 'Hinzufügen bestätigen',
      classCancel: 'Abbrechen',
      selectionHint: 'Auswahlmodus ist aktiv (ESC zum Beenden)',
      guideDeleteTitle: 'Diese Hilfslinie löschen',
      notifyClassAdded: '{count} Auswahlen basierend auf .{className} hinzugefügt.',
      notifyClassNotFound: 'Kein sichtbares Element mit Class .{className} gefunden.',
      notifyNoRegion: 'Legen Sie Hilfslinien oder eine Auswahl fest, um den Screenshot-Bereich zu definieren.',
      popupTitle: 'Webseiten-Abschnitt Screenshot',
      popupSubtitle: 'Ziehen Sie am Lineal, um Bereiche zu teilen, und speichern Sie als PNG',
      popupClearAll: 'Alle Hilfslinien löschen',
      popupGuideCount: 'Anzahl Hilfslinien',
      popupRulerState: 'Linealstatus',
      popupRulerShown: 'Angezeigt',
      popupRulerHidden: 'Ausgeblendet',
      popupUnavailable: 'Nicht verfügbar',
      popupNoTab: 'Kein aktiver Tab gefunden',
      popupHintLabel: 'Tipp: ',
      popupHint: 'Drücken und ziehen Sie auf dem oberen oder linken Lineal, um Hilfslinien herauszuziehen. Klicken Sie auf eine Hilfslinie, um ihre Löschtaste anzuzeigen.',
      popupNaming: 'Benennung: ',
      popupStartFail: 'Screenshot kann nicht gestartet werden: {msg}',
      popupClearFail: 'Hilfslinien können nicht gelöscht werden: {msg}',
      popupToggleFail: 'Lineal kann nicht umgeschaltet werden: {msg}',
      // Anleitungsinhalt (pro Sprache direkt vom Modell bereitgestellt, keine Übersetzungsskripte)
      guide: [
        {
          title: 'Überblick über das Plugin',
          steps: [
            'Dies ist eine Browsererweiterung für Abschnitt-Screenshots von Webseiten.',
            'Sie können auf der Seite frei Hilfslinien herausziehen, um sie in mehrere Bereiche zu teilen.',
            'Jeder Bereich wird separat als hochauflösendes PNG-Bild gespeichert.',
          ],
        },
        {
          title: 'Hilfslinien mit dem Lineal hinzufügen',
          steps: [
            'Nach dem Öffnen einer Seite erscheinen Photoshop-ähnliche Lineale oben und links.',
            'Halten Sie die linke Maustaste gedrückt und ziehen Sie vom oberen Lineal nach unten, um eine horizontale Hilfslinie hinzuzufügen.',
            'Halten Sie die linke Maustaste gedrückt und ziehen Sie vom linken Lineal nach rechts, um eine vertikale Hilfslinie hinzuzufügen.',
            'Klicken Sie auf eine Hilfslinie, um die Schaltfläche "Löschen" anzuzeigen und sie zu entfernen.',
          ],
        },
        {
          title: 'Das Auswahlfeld verwenden',
          steps: [
            'Klicken Sie in der Symbolleiste auf "Auswahl aktivieren" (oder nutzen Sie das Kürzel, Standard P).',
            'Drücken und ziehen Sie die Maus auf der Seite, um eine freie Auswahl zu zeichnen.',
            'Das Auswahlfeld eignet sich für unregelmäßige rechteckige Bereiche.',
            'Drücken Sie ESC, um den Auswahlmodus zu beenden.',
          ],
        },
        {
          title: 'Auto-Auswahl (nach Class)',
          steps: [
            'Klicken Sie in der Symbolleiste auf "Auto-Auswahl".',
            'Geben Sie einen CSS-Class-Namen der Elemente ein (z. B. card-item).',
            'Für alle Elemente, die dieser Class entsprechen, werden automatisch Auswahlen erstellt.',
          ],
        },
        {
          title: 'Zuschnitt starten und PNG speichern',
          steps: [
            'Klicken Sie nach dem Teilen der Bereiche oben in der Symbolleiste auf "PNG-Zuschnitt starten".',
            'Die Erweiterung erfasst jeden Bereich einzeln und speichert sie als PNG-Bilder.',
            'Die Bilder werden automatisch nach dem Muster "Index_Seitenname.png" benannt.',
            'Klicken Sie nach dem Speichern auf "Gespeicherten Ordner öffnen", um die Ergebnisse zu sehen.',
          ],
        },
        {
          title: 'Einstellungen und Kürzel',
          steps: [
            'Klicken Sie in der Symbolleiste auf "Einstellungen", um das Auswahl-Kürzel zu ändern.',
            'In der Dropdown-Liste "Oberflächensprache" können Sie jederzeit die Sprache der Benutzeroberfläche wechseln.',
            'Klicken Sie jederzeit auf "So wird\'s benutzt", um diese Anleitung anzuzeigen.',
          ],
        },
        {
          title: 'Tipps',
          steps: [
            'Sie können Hilfslinien und Auswahlfelder kombinieren, um komplexe Bereiche flexibel zu teilen.',
            'Während des Screenshots wird die Plugin-Überlagerung automatisch ausgeblendet, sodass sie nicht stört.',
            'Wenn eine Class keine sichtbaren Elemente hat, zeigt das Plugin einen Hinweis.',
          ],
        },
      ],
    },
    ru: {
      toolbarStart: 'Начать обрезку PNG',
      toolbarClear: 'Очистить направляющие',
      toolbarSelectionOn: 'Включить выделение',
      toolbarSelectionOff: 'Выключить выделение',
      toolbarAutoSelection: 'Автовыделение (Class)',
      toolbarToggleOn: 'Скрыть линейку',
      toolbarToggleOff: 'Показать линейку',
      toolbarSettings: 'Настройки',
      toolbarCoffee: 'Угостить автора кофе',
      guideCount: 'Направляющих: {count}',
      rulerDragHint: 'Удерживайте левую кнопку мыши и перетащите, чтобы создать направляющую',
      settingsTitle: 'Настройки плагина',
      settingsShortcutLabel: 'Горячая клавиша выделения',
      settingsShortcutTip: 'Нажмите на поле выше и нажмите клавишу, чтобы изменить',
      settingsLanguageLabel: 'Язык интерфейса',
      settingsLanguageTip: 'Применяется сразу после переключения',
      settingsSave: 'Сохранить настройки',
      settingsClose: 'Закрыть',
      settingsHowTo: 'Как использовать',
      howtoTitle: 'Как использовать этот плагин',
      howtoLangLabel: 'Язык справки',
      howtoClose: 'Закрыть',
      progressTitle: 'Сохранение PNG-изображений',
      progressPreparing: 'Подготовка...',
      progressCapturing: 'Захват контента {done}/{total}...',
      progressExporting: 'Экспорт изображения {index}/{total}...',
      progressCancel: 'Отменить сохранение',
      progressCancelled: 'Сохранение отменено.',
      progressCancelledPartial: 'Отменено, сохранено {count}.',
      progressDone: 'Готово, сохранено {count} PNG-изображений.',
      progressOpenFolder: 'Открыть папку сохранения',
      progressClose: 'Закрыть',
      progressFooter: 'Именование: индекс_имя-страницы.png',
      progressStartErr: 'Перетащите линейку, чтобы задать направляющие, или используйте выделение для области.',
      progressImageLoadErr: 'Не удалось загрузить снимок. Страница может содержать кросс-доменные ресурсы, загрязняющие canvas.',
      progressCaptureErr: 'Не удалось захватить область просмотра',
      coffeeTitle: 'Угостите автора кофе',
      coffeeSubtitle: 'Ваша поддержка помогает мне развиваться',
      coffeeClose: 'Отлично, закрыть',
      classTitle: 'Автодобавление выделений',
      classInputLabel: 'Введите имя Class',
      classInputPlaceholder: 'напр. card-item',
      classInputTip: 'Выделения будут созданы для всех элементов, соответствующих этому Class',
      classConfirm: 'Подтвердить',
      classCancel: 'Отмена',
      selectionHint: 'Режим выделения включен (ESC для выхода)',
      guideDeleteTitle: 'Удалить эту направляющую',
      notifyClassAdded: 'Добавлено {count} выделений на основе .{className}.',
      notifyClassNotFound: 'Видимый элемент с Class .{className} не найден.',
      notifyNoRegion: 'Задайте направляющие или выделение, чтобы определить область снимка.',
      popupTitle: 'Снимок секции веб-страницы',
      popupSubtitle: 'Перетащите линейку, чтобы разделить области, и сохраните в PNG',
      popupClearAll: 'Очистить все направляющие',
      popupGuideCount: 'Количество направляющих',
      popupRulerState: 'Состояние линейки',
      popupRulerShown: 'Показана',
      popupRulerHidden: 'Скрыта',
      popupUnavailable: 'Недоступно',
      popupNoTab: 'Активная вкладка не найдена',
      popupHintLabel: 'Совет: ',
      popupHint: 'Нажмите и перетащите на верхней или левой линейке, чтобы вытянуть направляющие. Нажмите на направляющую, чтобы показать кнопку удаления.',
      popupNaming: 'Именование: ',
      popupStartFail: 'Не удалось запустить снимок: {msg}',
      popupClearFail: 'Не удалось очистить направляющие: {msg}',
      popupToggleFail: 'Не удалось переключить линейку: {msg}',
      // Содержание справки (предоставлено моделью для каждого языка напрямую, без скриптов перевода)
      guide: [
        {
          title: 'Обзор плагина',
          steps: [
            'Это браузерное расширение для снимков отдельных секций веб-страниц.',
            'Вы можете свободно вытягивать направляющие на странице, чтобы разделить её на несколько областей.',
            'Каждая область сохраняется отдельно как PNG-изображение высокого разрешения.',
          ],
        },
        {
          title: 'Добавление направляющих линейкой',
          steps: [
            'После открытия страницы сверху и слева появляются линейки в стиле Photoshop.',
            'Удерживайте левую кнопку мыши и перетащите вниз от верхней линейки, чтобы добавить горизонтальную направляющую.',
            'Удерживайте левую кнопку мыши и перетащите вправо от левой линейки, чтобы добавить вертикальную направляющую.',
            'Нажмите на направляющую, чтобы показать кнопку «Удалить» и убрать её.',
          ],
        },
        {
          title: 'Использование выделения',
          steps: [
            'Нажмите кнопку «Включить выделение» на панели инструментов (или используйте клавишу, по умолчанию P).',
            'Нажмите и перетащите мышь по странице, чтобы нарисовать свободное выделение.',
            'Рамка выделения подходит для захвата неправильных прямоугольных областей.',
            'Нажмите ESC, чтобы выйти из режима выделения.',
          ],
        },
        {
          title: 'Автовыделение (по Class)',
          steps: [
            'Нажмите кнопку «Автовыделение» на панели инструментов.',
            'Введите CSS-имя Class элементов (например, card-item).',
            'Для всех элементов, соответствующих этому Class, автоматически создаются выделения.',
          ],
        },
        {
          title: 'Запуск обрезки и сохранение PNG',
          steps: [
            'После разделения областей нажмите кнопку «Начать обрезку PNG» в верхней части панели.',
            'Расширение захватывает каждую область по очереди и сохраняет их как PNG-изображения.',
            'Изображения автоматически именуются по шаблону «индекс_имя-страницы.png».',
            'После сохранения нажмите «Открыть папку сохранения», чтобы увидеть результаты.',
          ],
        },
        {
          title: 'Настройки и горячие клавиши',
          steps: [
            'Нажмите кнопку «Настройки» на панели, чтобы изменить клавишу выделения.',
            'В раскрывающемся списке «Язык интерфейса» вы можете в любой момент сменить язык интерфейса.',
            'Нажмите «Как использовать», чтобы в любой момент открыть эту справку.',
          ],
        },
        {
          title: 'Советы',
          steps: [
            'Направляющие и рамки выделения можно сочетать, чтобы гибко делить сложные области.',
            'Во время снимка наложение плагина автоматически скрывается и не мешает.',
            'Если у Class нет видимых элементов, плагин покажет подсказку.',
          ],
        },
      ],
    },
  };

  class I18n {
    constructor() {
      this._lang = 'zh';
      this._messages = MESSAGES[this._lang];
      this.onLanguageChange = null; // 语言变化回调（供 UI 重新渲染）
    }

    /**
     * 支持的界面语言列表
     * @returns {Array<{code:string, label:string}>}
     */
    get languages() {
      return LANGS;
    }

    get lang() {
      return this._lang;
    }

    /**
     * 根据浏览器语言前缀匹配最接近的受支持语言
     * 例如：zh-CN -> zh，en-US -> en，fr-FR -> fr，无法匹配时回退 zh
     * @param {string} [browserLang] navigator.language
     * @returns {string}
     */
    detectLanguage(browserLang = (navigator.language || 'zh')) {
      const prefix = String(browserLang).toLowerCase().split('-')[0];
      const hit = LANGS.find((l) => l.code === prefix);
      return hit ? hit.code : 'zh';
    }

    /**
     * 设置当前界面语言（持久化由外部负责，此处仅切换文案与通知）
     * @param {string} code
     */
    setLanguage(code) {
      const next = LANGS.find((l) => l.code === code) ? code : 'zh';
      if (next === this._lang) return;
      this._lang = next;
      this._messages = MESSAGES[this._lang];
      this.onLanguageChange?.();
    }

    /**
     * 获取指定 key 的翻译文案，支持 {name} 占位符替换
     * @param {string} key
     * @param {Object} [params] 形如 { count: 3 } 的参数
     * @returns {string}
     */
    t(key, params) {
      let str = this._messages?.[key] ?? MESSAGES.zh[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    }

    /**
     * 获取指定语言的“如何使用”讲解内容（分步骤章节数组）。
     * 该内容由大模型直接以各语言译文写入 MESSAGES，不依赖任何翻译脚本。
     * 若目标语言不可用则回退到中文。
     * @param {string} [lang] 语言代码，缺省时使用当前界面语言
     * @returns {Array<{title:string, steps:string[]}>}
     */
    getGuide(lang = this._lang) {
      const data = MESSAGES[lang]?.guide || MESSAGES.zh.guide || [];
      return data;
    }
  }

  // 全局单例
  SSS.I18n = new I18n();
})();
