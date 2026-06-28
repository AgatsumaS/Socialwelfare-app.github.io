const steps = [
  {
    id: "datetime",
    number: "1",
    title: "支援日時",
    help: "日付，時間を選択し，担当者名を入力してください．",
    fields: [
      { id: "date", label: "日付", type: "dateRoll" },
      { id: "time", label: "時間", type: "timeRoll" },
      { id: "staff", label: "担当者", type: "text"}
    ]
  },
  {
    id: "condition",
    number: "2",
    title: "状態変化",
    help: "状態変化の有無と，体温・脈拍・SpO2・尿量などを自由に記録してください．",
    fields: [
      { id: "condition", label: "記録内容", type: "textarea" }
    ]
  },
  {
    id: "observation",
    number: "3",
    title: "医療的ケアの事柄に関する観察",
    help: "痰，気切，口腔吸引など，観察内容を入力してください．",
    fields: [
      { id: "observation", label: "記録内容", type: "textarea"}
    ]
  },
  {
    id: "notes",
    number: "4",
    title: "その他，申し送り事項",
    help: "ご家族への共有，往診予定，交換予定などを入力してください．",
    fields: [
      { id: "notes", label: "申し送り内容", type: "textarea"}
    ]
  },
  {
    id: "careReport",
    number: "5",
    title: "医療的ケア報告",
    help: "報告状況を入力してください．",
    fields: [
      { id: "careReport", label: "報告状況", type: "text", placeholder: "例: 済み", defaultValue: "済み" }
    ]
  },
  {
    id: "performance",
    number: "6",
    title: "電子実績表入力・承認",
    help: "入力・承認状況を入力してください．",
    fields: [
      { id: "performance", label: "入力・承認状況", type: "text", placeholder: "例: 済み", defaultValue: "済み" }
    ]
  },
  {
    id: "handover",
    number: "7",
    title: "引き継ぎ者",
    help: "引き継ぎ先の方を入力してください．",
    fields: [
      { id: "handover", label: "引き継ぎ者", type: "text" }
    ]
  }
];

const state = Object.fromEntries(
  steps.flatMap((step) => step.fields.map((field) => [field.id, field.defaultValue || ""]))
);

let currentStep = 0;

const fields = document.getElementById("fields");
const questionKicker = document.getElementById("questionKicker");
const questionTitle = document.getElementById("questionTitle");
const questionHelp = document.getElementById("questionHelp");
const progressBar = document.getElementById("progressBar");
const statusPill = document.getElementById("statusPill");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const newReportButton = document.getElementById("newReportButton");
const maxStep = steps.length;
const weekdays = ["日", "月", "火", "水", "木", "金", "土"];

function createSelect(options, value, label, onChange) {
  const select = document.createElement("select");
  select.setAttribute("aria-label", label);

  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    select.appendChild(item);
  });

  select.value = value || "";
  select.addEventListener("change", onChange);
  return select;
}

function updateDateValue() {
  const year = state.dateYear;
  const month = state.dateMonth;
  const day = state.dateDay;

  if (!year || !month || !day) {
    state.date = "";
    return;
  }

  const date = new Date(year, Number(month) - 1, Number(day));
  const weekday = weekdays[date.getDay()];
  state.date = `${year}/${Number(month)}/${Number(day)}(${weekday})`;
}

function updateTimeValue() {
  const startHour = state.startHour;
  const startMinute = state.startMinute;
  const endHour = state.endHour;
  const endMinute = state.endMinute;

  if (!startHour || !startMinute || !endHour || !endMinute) {
    state.time = "";
    return;
  }

  state.time = `${Number(startHour)}:${startMinute}〜${Number(endHour)}:${endMinute}`;
}

function dayOptionsForMonth(month) {
  const year = state.dateYear || new Date().getFullYear();
  const dayCount = month ? new Date(year, Number(month), 0).getDate() : 31;
  return [
    { value: "", label: "日" },
    ...Array.from({ length: dayCount }, (_, index) => {
      const day = String(index + 1);
      return { value: day, label: `${day}日` };
    })
  ];
}

function renderDateRoll(field) {
  const label = document.createElement("label");
  label.textContent = field.label;

  const row = document.createElement("div");
  row.className = "roll-menu date-roll";

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: "", label: "年" },
    ...Array.from({ length: 5 }, (_, index) => {
      const year = String(currentYear - 2 + index);
      return { value: year, label: `${year}年` };
    })
  ];
  const monthOptions = [
    { value: "", label: "月" },
    ...Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1);
      return { value: month, label: `${month}月` };
    })
  ];

  const yearSelect = createSelect(yearOptions, state.dateYear, "年", () => {
    state.dateYear = yearSelect.value;
    const dayCount = new Date(Number(state.dateYear) || currentYear, Number(state.dateMonth), 0).getDate();
    if (Number(state.dateDay) > dayCount) state.dateDay = "";
    updateDateValue();
    renderQuestion();
    renderMeta();
  });

  const monthSelect = createSelect(monthOptions, state.dateMonth, "月", () => {
    state.dateMonth = monthSelect.value;
    const dayCount = new Date(Number(state.dateYear) || currentYear, Number(state.dateMonth), 0).getDate();
    if (Number(state.dateDay) > dayCount) state.dateDay = "";
    updateDateValue();
    renderQuestion();
    renderMeta();
  });

  const daySelect = createSelect(dayOptionsForMonth(state.dateMonth), state.dateDay, "日", () => {
    state.dateDay = daySelect.value;
    updateDateValue();
    preview.textContent = state.date || "日付を選択";
    renderMeta();
  });

  const preview = document.createElement("output");
  preview.textContent = state.date || "日付を選択";

  row.append(yearSelect, monthSelect, daySelect, preview);
  label.appendChild(row);
  return label;
}

function renderTimeRoll(field) {
  const label = document.createElement("label");
  label.textContent = field.label;

  const row = document.createElement("div");
  row.className = "roll-menu time-roll";

  const hourOptions = [
    { value: "", label: "時" },
    ...Array.from({ length: 24 }, (_, index) => {
      const hour = String(index);
      return { value: hour, label: `${hour}時` };
    })
  ];
  const minuteOptions = [
    { value: "", label: "分" },
    ...["00", "15", "30", "45"].map((minute) => ({ value: minute, label: `${minute}分` }))
  ];

  const startHour = createSelect(hourOptions, state.startHour, "開始時", () => {
    state.startHour = startHour.value;
    updateTimeValue();
    preview.textContent = state.time || "時間を選択";
    renderMeta();
  });
  const startMinute = createSelect(minuteOptions, state.startMinute, "開始分", () => {
    state.startMinute = startMinute.value;
    updateTimeValue();
    preview.textContent = state.time || "時間を選択";
    renderMeta();
  });
  const separator = document.createElement("span");
  separator.className = "roll-separator";
  separator.textContent = "〜";
  const endHour = createSelect(hourOptions, state.endHour, "終了時", () => {
    state.endHour = endHour.value;
    updateTimeValue();
    preview.textContent = state.time || "時間を選択";
    renderMeta();
  });
  const endMinute = createSelect(minuteOptions, state.endMinute, "終了分", () => {
    state.endMinute = endMinute.value;
    updateTimeValue();
    preview.textContent = state.time || "時間を選択";
    renderMeta();
  });

  const preview = document.createElement("output");
  preview.textContent = state.time || "時間を選択";

  row.append(startHour, startMinute, separator, endHour, endMinute, preview);
  label.appendChild(row);
  return label;
}

function renderQuestion() {
  if (currentStep === maxStep) {
    renderResult();
    return;
  }

  const step = steps[currentStep];
  questionKicker.textContent = `${step.number} / ${steps.length}`;
  questionTitle.textContent = step.title;
  questionHelp.textContent = step.help;
  fields.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = step.id === "datetime" || step.fields.length === 1 ? "field-grid" : "inline-fields";

  step.fields.forEach((field) => {
    if (field.type === "dateRoll") {
      wrapper.appendChild(renderDateRoll(field));
      return;
    }

    if (field.type === "timeRoll") {
      wrapper.appendChild(renderTimeRoll(field));
      return;
    }

    const label = document.createElement("label");
    label.textContent = field.label;

    const input = field.type === "textarea"
      ? document.createElement("textarea")
      : document.createElement("input");

    input.id = field.id;
    input.value = state[field.id] || "";
    input.placeholder = field.placeholder || "";
    if (field.type !== "textarea") input.type = field.type;

    input.addEventListener("input", (event) => {
      state[field.id] = event.target.value;
      renderMeta();
    });

    label.appendChild(input);
    wrapper.appendChild(label);
  });

  fields.appendChild(wrapper);
}

function buildReport() {
  const sectionOne = [state.date, state.time, state.staff]
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value, index) => index === 0 ? value : `    ${value}`)
    .join("\n");

  const lines = [
    "【支援報告】",
    "",
    `①支援日時：\n ${sectionOne}`,
    "",
    `②状態変化：\n ${state.condition.trim()}`,
    "",
    `③医療的ケアの事柄に関する観察：\n ${state.observation.trim()}`,
    "",
    `④その他，申し送り事項：\n ${state.notes.trim()}`,
    "",
    `⑤医療的ケア報告：${state.careReport.trim()}`,
    "",
    `⑥電子実績表入力・承認：${state.performance.trim()}`,
    "",
    `⑦引き継ぎ者：${state.handover.trim()}`
  ];

  return lines.join("\n").replace(/[ \t]+$/gm, "");
}

function renderMeta() {
  const progress = Math.round((currentStep / maxStep) * 100);
  progressBar.style.width = `${progress}%`;
  statusPill.textContent = currentStep === maxStep
    ? "確認画面"
    : `${currentStep + 1} / ${steps.length} 入力中`;
  prevButton.disabled = currentStep === 0;
  nextButton.textContent = currentStep === maxStep ? "コピー" : "進む";
  newReportButton.hidden = currentStep !== maxStep;
}

function render() {
  renderQuestion();
  renderMeta();
}

function renderResult() {
  questionKicker.textContent = "確認";
  questionTitle.textContent = "全体表示";
  questionHelp.textContent = "内容を確認して，問題なければコピーしてください．";
  fields.innerHTML = "";

  const result = document.createElement("section");
  result.setAttribute("aria-label", "全体表示");

  const status = document.createElement("div");
  status.className = "copy-status";
  status.id = "copyStatus";
  status.setAttribute("aria-live", "polite");

  const preview = document.createElement("pre");
  preview.className = "result-preview";
  preview.textContent = buildReport();

  result.append(status, preview);
  fields.appendChild(result);
}

async function copyReport() {
  const text = buildReport();
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopyStatus("コピーしました");
  } catch (error) {
    setCopyStatus("コピーできませんでした");
  }

  window.setTimeout(() => {
    setCopyStatus("");
  }, 2600);
}

function setCopyStatus(message) {
  const copyStatus = document.getElementById("copyStatus");
  if (copyStatus) copyStatus.textContent = message;
}

function resetReport() {
  if (!window.confirm("内容をクリアして新しく作成しますか？")) return;

  Object.keys(state).forEach((key) => {
    state[key] = "";
  });

  steps.forEach((step) => {
    step.fields.forEach((field) => {
      state[field.id] = field.defaultValue || "";
    });
  });
  currentStep = 0;
  render();
}

prevButton.addEventListener("click", () => {
  currentStep = Math.max(0, currentStep - 1);
  render();
});

nextButton.addEventListener("click", () => {
  if (currentStep < maxStep) {
    currentStep += 1;
    render();
  } else {
    copyReport();
  }
});

newReportButton.addEventListener("click", resetReport);

render();
