const steps = [
  {
    id: "datetime",
    number: "①",
    title: "支援日時",
    help: "日付、時間、担当者名を入力してください。",
    fields: [
      { id: "date", label: "日付", type: "text", placeholder: "例: 6/21(日)" },
      { id: "time", label: "時間", type: "text", placeholder: "例: 20:00〜8:00" },
      { id: "staff", label: "担当者", type: "text", placeholder: "例: 曽我" }
    ]
  },
  {
    id: "condition",
    number: "②",
    title: "状態変化",
    help: "状態変化の有無と、体温・脈拍・SpO2・尿量などを自由に記録してください。",
    fields: [
      { id: "condition", label: "記録内容", type: "textarea", placeholder: "例:\n状態変化 あり\n入室時 KT 37.9℃\n..." }
    ]
  },
  {
    id: "observation",
    number: "③",
    title: "医療的ケアの事柄に関する観察",
    help: "痰、気切、口腔吸引など、観察内容を入力してください。",
    fields: [
      { id: "observation", label: "記録内容", type: "textarea", placeholder: "例:\n痰は粘調強め\n気切 中量2回\n..." }
    ]
  },
  {
    id: "notes",
    number: "④",
    title: "その他、申し送り事項",
    help: "ご家族への共有、往診予定、交換予定などを入力してください。",
    fields: [
      { id: "notes", label: "申し送り内容", type: "textarea", placeholder: "例:\n足先冷感あり毛布でくるんでいます。\n..." }
    ]
  },
  {
    id: "careReport",
    number: "⑤",
    title: "医療的ケア報告",
    help: "報告状況を入力してください。",
    fields: [
      { id: "careReport", label: "報告状況", type: "text", placeholder: "例: 済み", defaultValue: "済み" }
    ]
  },
  {
    id: "performance",
    number: "⑥",
    title: "電子実績表入力・承認",
    help: "入力・承認状況を入力してください。",
    fields: [
      { id: "performance", label: "入力・承認状況", type: "text", placeholder: "例: 済み", defaultValue: "済み" }
    ]
  },
  {
    id: "handover",
    number: "⑦",
    title: "引き継ぎ者",
    help: "引き継ぎ先の方を入力してください。",
    fields: [
      { id: "handover", label: "引き継ぎ者", type: "text", placeholder: "例: ご主人" }
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
  wrapper.className = step.fields.length > 1 ? "inline-fields" : "field-grid";

  step.fields.forEach((field) => {
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
    `①${sectionOne}`,
    "",
    `②${state.condition.trim()}`,
    "",
    `③${state.observation.trim()}`,
    "",
    `④${state.notes.trim()}`,
    "",
    `⑤医療的ケア報告 ${state.careReport.trim()}`,
    `⑥電子実績表入力・承認 ${state.performance.trim()}`,
    "⑦引き継ぎ者",
    `　　${state.handover.trim()}`
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
  questionHelp.textContent = "内容を確認して、問題なければコピーしてください。";
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
