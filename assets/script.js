// localStorageで使うキー名です。指定された名前で保存・読み込みを行います。
const STORAGE_KEY = "emotionWeatherData";

// 感情アイコンと表示ラベルをまとめて管理します。
const EMOTION_LABELS = {
  "☀": "晴れ",
  "☁": "くもり",
  "☔": "雨",
  "⚡": "雷"
};

// 感情アイコンごとの画像パスをまとめて管理します。
const EMOTION_IMAGES = {
  "☀": "assets/images/sun.png",
  "☁": "assets/images/cloudy.png",
  "☔": "assets/images/rain.png",
  "⚡": "assets/images/thunder.png"
};

// 画面で使うHTML要素を取得します。
const calendarGrid = document.getElementById("calendarGrid");
const currentMonthLabel = document.getElementById("currentMonthLabel");
const prevMonthButton = document.getElementById("prevMonthButton");
const nextMonthButton = document.getElementById("nextMonthButton");
const todayButton = document.getElementById("todayButton");
const summaryTotal = document.getElementById("summaryTotal");
const summaryList = document.getElementById("summaryList");
const inputModal = document.getElementById("inputModal");
const inputModalOverlay = document.getElementById("inputModalOverlay");
const inputPanel = document.getElementById("inputPanel");
const selectedDateLabel = document.getElementById("selectedDateLabel");
const emotionOptions = document.getElementById("emotionOptions");
const emotionButtons = document.querySelectorAll(".emotion-button");
const commentInput = document.getElementById("commentInput");
const saveButton = document.getElementById("saveButton");
const deleteButton = document.getElementById("deleteButton");
const backButton = document.getElementById("backButton");
const closeInputButton = document.getElementById("closeInputButton");
const detailModal = document.getElementById("detailModal");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalButton = document.getElementById("closeModalButton");
const modalDate = document.getElementById("modalDate");
const modalEmoji = document.getElementById("modalEmoji");
const modalEmotionLabel = document.getElementById("modalEmotionLabel");
const modalComment = document.getElementById("modalComment");

// 現在表示しているカレンダーの年月を保持します。
const today = new Date();
let displayYear = today.getFullYear();
let displayMonth = today.getMonth();

// 入力・編集している日付と、選択中の感情アイコンを保持します。
let selectedDateKey = "";
let selectedEmoji = "";

// 保存済みデータをlocalStorageから読み込みます。
let emotionWeatherData = loadEmotionWeatherData();

// localStorageから保存済みデータを読み込む処理です。
function loadEmotionWeatherData() {
  const savedText = localStorage.getItem(STORAGE_KEY);

  // 保存データがまだない場合は、空のオブジェクトから始めます。
  if (!savedText) {
    return {};
  }

  try {
    return JSON.parse(savedText);
  } catch (error) {
    // JSONの形式が壊れていた場合でも、アプリが止まらないようにします。
    console.warn("保存データの読み込みに失敗しました。", error);
    return {};
  }
}

// 感情データをlocalStorageへ保存する処理です。
function saveEmotionWeatherData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emotionWeatherData));
}

// Dateオブジェクトを「YYYY-MM-DD」形式の文字列に変換します。
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 画面に表示する日付ラベルを作る処理です。
function formatReadableDate(dateKey) {
  const [year, month, day] = dateKey.split("-");

  return `${year}年${Number(month)}月${Number(day)}日`;
}

// 感情アイコン用の画像要素を作る処理です。
function createEmotionImage(emoji, className) {
  const image = document.createElement("img");

  image.className = className;
  image.src = EMOTION_IMAGES[emoji];
  image.alt = EMOTION_LABELS[emoji];

  return image;
}

// 今表示している月の保存データだけを集計する処理です。
function getMonthlySummary() {
  const monthKey = `${displayYear}-${String(displayMonth + 1).padStart(2, "0")}`;
  const summary = {
    "☀": 0,
    "☁": 0,
    "☔": 0,
    "⚡": 0
  };

  // 保存データの中から、表示中の年月に合うものだけ数えます。
  Object.entries(emotionWeatherData).forEach(([dateKey, data]) => {
    if (dateKey.startsWith(monthKey) && summary[data.emoji] !== undefined) {
      summary[data.emoji]++;
    }
  });

  return summary;
}

// 月ごとの気分まとめを画面に表示する処理です。
function renderMonthlySummary() {
  const summary = getMonthlySummary();
  const total = Object.values(summary).reduce((sum, count) => sum + count, 0);

  summaryTotal.textContent = `${total}日`;
  summaryList.innerHTML = "";

  // 4種類の感情アイコンごとに、今月の記録数を表示します。
  Object.entries(EMOTION_LABELS).forEach(([emoji, label]) => {
    const summaryItem = document.createElement("div");
    const emojiImage = createEmotionImage(emoji, "summary-item__emoji");
    const labelText = document.createElement("span");
    const countText = document.createElement("strong");

    summaryItem.className = "summary-item";
    labelText.className = "summary-item__label";
    countText.className = "summary-item__count";

    labelText.textContent = label;
    countText.textContent = `${summary[emoji]}日`;

    summaryItem.appendChild(emojiImage);
    summaryItem.appendChild(labelText);
    summaryItem.appendChild(countText);
    summaryList.appendChild(summaryItem);
  });
}

// カレンダーの日付を生成する処理です。
function renderCalendar() {
  // 前回表示した日付マスを一度すべて消します。
  calendarGrid.innerHTML = "";

  // 見出しに現在表示中の年月を表示します。
  currentMonthLabel.textContent = `${displayYear}年${displayMonth + 1}月`;

  // カレンダーを描画するたびに、月ごとのまとめも更新します。
  renderMonthlySummary();

  // 月初の日付、月初の曜日、月末の日付を取得します。
  const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const lastDateOfMonth = new Date(displayYear, displayMonth + 1, 0).getDate();

  // 1日の前に必要な空白マスを作ります。
  for (let i = 0; i < startWeekday; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "day-cell is-empty";
    calendarGrid.appendChild(emptyCell);
  }

  // 1日から月末までの日付マスを作ります。
  for (let day = 1; day <= lastDateOfMonth; day++) {
    const date = new Date(displayYear, displayMonth, day);
    const dateKey = formatDateKey(date);
    const dayCell = document.createElement("button");
    const dayNumber = document.createElement("span");

    dayCell.type = "button";
    dayCell.className = "day-cell";
    dayCell.setAttribute("aria-label", `${formatReadableDate(dateKey)}を入力・編集`);

    dayNumber.className = "day-number";
    dayNumber.textContent = day;
    dayCell.appendChild(dayNumber);

    // 今日の日付だけ見た目を少し変えます。
    if (dateKey === formatDateKey(today)) {
      dayCell.classList.add("is-today");
    }

    // 保存済みデータがある日は、カレンダー上に天気アイコンを表示します。
    if (emotionWeatherData[dateKey]) {
      const weatherMark = document.createElement("img");
      weatherMark.className = "weather-mark";
      weatherMark.src = EMOTION_IMAGES[emotionWeatherData[dateKey].emoji];
      weatherMark.alt = EMOTION_LABELS[emotionWeatherData[dateKey].emoji];
      dayCell.appendChild(weatherMark);
    }

    // 日付マスクリックで、入力・編集エリアを開きます。
    // ただし保存済みアイコンをクリックした場合は、閲覧モーダルを開きます。
    dayCell.addEventListener("click", (event) => {
      if (event.target.closest(".weather-mark")) {
        openDetailModal(dateKey);
        return;
      }

      openInputPanel(dateKey);
    });

    calendarGrid.appendChild(dayCell);
  }
}

// 日付クリックで入力モーダルを表示する処理です。
function openInputPanel(dateKey) {
  selectedDateKey = dateKey;
  selectedDateLabel.textContent = formatReadableDate(dateKey);

  // 登録済みの日付なら、前に保存したアイコンとメモを入力欄へ戻します。
  const savedData = emotionWeatherData[dateKey];
  selectedEmoji = savedData ? savedData.emoji : "";
  commentInput.value = savedData ? savedData.comment : "";
  deleteButton.classList.toggle("is-hidden", !savedData);

  updateSelectedEmotion();
  inputModal.classList.remove("is-hidden");
  commentInput.focus();
}

// 選択中の感情アイコンを見た目で分かるように強調する処理です。
function updateSelectedEmotion() {
  emotionButtons.forEach((button) => {
    const isSelected = button.dataset.emoji === selectedEmoji;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

// 入力モーダルを閉じる処理です。
function closeInputPanel() {
  inputModal.classList.add("is-hidden");
  selectedDateKey = "";
  selectedEmoji = "";
  commentInput.value = "";
  deleteButton.classList.add("is-hidden");
  updateSelectedEmotion();
}

// 選択された日付の感情を保存する処理です。
function saveSelectedEmotion() {
  // アイコンが未選択の場合は、保存前に選択してもらいます。
  if (!selectedEmoji) {
    alert("感情アイコンを選択してください。");
    return;
  }

  emotionWeatherData[selectedDateKey] = {
    emoji: selectedEmoji,
    comment: commentInput.value.trim()
  };

  saveEmotionWeatherData();
  renderCalendar();
  closeInputPanel();
}

// 選択中の日付の記録を削除する処理です。
function deleteSelectedEmotion() {
  // 保存済みデータがない場合は、削除するものがないので何もしません。
  if (!selectedDateKey || !emotionWeatherData[selectedDateKey]) {
    return;
  }

  const isConfirmed = confirm(`${formatReadableDate(selectedDateKey)}の記録を削除しますか？`);

  // 確認画面でキャンセルされたら、削除せずに戻ります。
  if (!isConfirmed) {
    return;
  }

  delete emotionWeatherData[selectedDateKey];
  saveEmotionWeatherData();
  renderCalendar();
  closeInputPanel();
}

// モーダルを開く処理です。保存済みのアイコンとメモを表示します。
function openDetailModal(dateKey) {
  const savedData = emotionWeatherData[dateKey];

  // 念のため、保存データがない場合は何もしません。
  if (!savedData) {
    return;
  }

  modalDate.textContent = formatReadableDate(dateKey);
  modalEmoji.innerHTML = "";
  modalEmoji.appendChild(createEmotionImage(savedData.emoji, "modal__emoji-image"));
  modalEmotionLabel.textContent = EMOTION_LABELS[savedData.emoji];
  modalComment.textContent = savedData.comment || "メモはありません。";
  detailModal.classList.remove("is-hidden");
}

// モーダルを閉じる処理です。
function closeDetailModal() {
  detailModal.classList.add("is-hidden");
}

// 前月ボタンを押したとき、表示月を1か月戻します。
prevMonthButton.addEventListener("click", () => {
  displayMonth--;

  // 1月より前に戻る場合は、前年の12月にします。
  if (displayMonth < 0) {
    displayMonth = 11;
    displayYear--;
  }

  closeInputPanel();
  renderCalendar();
});

// 次月ボタンを押したとき、表示月を1か月進めます。
nextMonthButton.addEventListener("click", () => {
  displayMonth++;

  // 12月より後に進む場合は、翌年の1月にします。
  if (displayMonth > 11) {
    displayMonth = 0;
    displayYear++;
  }

  closeInputPanel();
  renderCalendar();
});

// 今日に戻るボタンを押したとき、今月のカレンダーへ戻します。
todayButton.addEventListener("click", () => {
  displayYear = today.getFullYear();
  displayMonth = today.getMonth();
  closeInputPanel();
  renderCalendar();
});

// 感情アイコンをクリックしたとき、選択中のアイコンとして保存します。
emotionOptions.addEventListener("click", (event) => {
  const clickedButton = event.target.closest(".emotion-button");

  // アイコンボタン以外をクリックした場合は何もしません。
  if (!clickedButton) {
    return;
  }

  selectedEmoji = clickedButton.dataset.emoji;
  updateSelectedEmotion();
});

// 登録ボタンを押したとき、選んだ感情とメモを保存します。
saveButton.addEventListener("click", saveSelectedEmotion);

// 削除ボタンを押したとき、選択中の日付の記録を削除します。
deleteButton.addEventListener("click", deleteSelectedEmotion);

// 戻るボタンを押したとき、入力エリアを閉じます。
backButton.addEventListener("click", closeInputPanel);

// 入力モーダルの閉じるボタンと背景をクリックしたとき、入力モーダルを閉じます。
closeInputButton.addEventListener("click", closeInputPanel);
inputModalOverlay.addEventListener("click", closeInputPanel);

// モーダルの閉じるボタンと背景をクリックしたとき、モーダルを閉じます。
closeModalButton.addEventListener("click", closeDetailModal);
modalOverlay.addEventListener("click", closeDetailModal);

// Escapeキーを押したとき、モーダルを閉じます。
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeInputPanel();
    closeDetailModal();
  }
});

// ページを開いたときに、保存済みデータを反映したカレンダーを表示します。
renderCalendar();
