import { D as React } from "./shared-ui.js";
import {
  AI_LABEL,
  analyzePhoto,
  downscalePhoto,
  getAISettings,
  saveAISettings,
} from "./vision.js";
const h = React.createElement;
export function AISettings() {
  const [settings, setSettings] = React.useState(() => ({
    ...getAISettings(),
    model: getAISettings().model || "gpt-4.1-mini",
  }));
  const [message, setMessage] = React.useState("");
  const field = (key, label, type = "text") =>
    h(
      "label",
      { className: "assistant-field" },
      label,
      h("input", {
        type,
        value: settings[key] || "",
        autoComplete: "off",
        spellCheck: false,
        onChange: (event) =>
          setSettings({ ...settings, [key]: event.target.value }),
      }),
    );
  return h(
    "section",
    { className: "assistant-panel" },
    h("h3", null, "ตั้งค่า AI วิเคราะห์ภาพ"),
    h(
      "p",
      { className: "small-note" },
      "ใช้บริการที่รองรับคำขอวิเคราะห์ภาพรูปแบบโอเพนเอไอและอนุญาตให้เว็บนี้เชื่อมต่อ รหัสเก็บเฉพาะเซสชัน ไม่รวมในเอกสารหรือไฟล์ส่งออก",
    ),
    field("endpoint", "ที่อยู่บริการวิเคราะห์ภาพ", "url"),
    field("key", "รหัสเข้าใช้งาน", "password"),
    field("model", "ชื่อรุ่นโมเดล"),
    h(
      "button",
      {
        type: "button",
        onClick: () => {
          try {
            saveAISettings(settings);
            setMessage("บันทึกการตั้งค่าสำหรับเซสชันนี้แล้ว");
          } catch (error) {
            setMessage(error.message);
          }
        },
      },
      "บันทึกการตั้งค่า AI",
    ),
    h(
      "button",
      {
        type: "button",
        onClick: () => {
          saveAISettings({});
          setSettings({ endpoint: "", key: "", model: "gpt-4.1-mini" });
          setMessage("ลบการตั้งค่า AI แล้ว");
        },
      },
      "ลบการตั้งค่า AI",
    ),
    h("p", { role: "status" }, message),
  );
}
export function EvidencePanel({ record, onAttach, onRemove }) {
  const [image, setImage] = React.useState("");
  const [analysis, setAnalysis] = React.useState(null);
  const [consent, setConsent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  async function run(task) {
    setBusy(true);
    setMessage("");
    try {
      await task();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  const resultView = (data) =>
    h(
      "div",
      null,
      h(
        "p",
        null,
        `${data.part} · ระดับ ${data.severity} จาก 3 · ความมั่นใจ ${Math.round(data.confidence * 100)}%`,
      ),
      h("p", null, data.summary_th),
    );
  let destination = "บริการที่ตั้งค่า";
  try {
    destination = new URL(getAISettings().endpoint).hostname;
  } catch {}
  return h(
    "section",
    { className: "assistant-panel" },
    h("h3", null, "ภาพหลักฐานอุบัติเหตุ"),
    h("p", { className: "small-note" }, AI_LABEL),
    h(
      "label",
      { className: "assistant-field" },
      "เพิ่มภาพอุบัติเหตุ",
      h("input", {
        type: "file",
        accept: "image/jpeg,image/png,image/webp",
        disabled: busy,
        onChange: (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setAnalysis(null);
          setConsent(false);
          setImage("");
          run(async () => setImage(await downscalePhoto(file)));
        },
      }),
    ),
    image &&
      h("img", {
        className: "evidence-preview",
        src: image,
        alt: "ภาพที่ย่อแล้วสำหรับตรวจสอบ",
      }),
    image &&
      h(
        "label",
        { className: "check-label" },
        h("input", {
          type: "checkbox",
          checked: consent,
          disabled: busy,
          onChange: (event) => setConsent(event.target.checked),
        }),
        `อนุญาตส่งเฉพาะภาพนี้ไปยัง ${destination} เพื่อประเมิน`,
      ),
    h(
      "button",
      {
        type: "button",
        disabled: busy || !image,
        onClick: () =>
          run(async () => {
            setAnalysis(null);
            setAnalysis(await analyzePhoto(image, consent));
          }),
      },
      busy ? "กำลังดำเนินการ…" : "วิเคราะห์ภาพด้วย AI",
    ),
    analysis && resultView(analysis),
    analysis &&
      h(
        "button",
        {
          type: "button",
          disabled: busy,
          onClick: () =>
            run(async () => {
              await onAttach({
                id: crypto.randomUUID(),
                image,
                analysis,
                label: AI_LABEL,
                createdAt: new Date().toISOString(),
              });
              setImage("");
              setAnalysis(null);
              setConsent(false);
              setMessage("แนบหลักฐานแล้ว");
            }),
        },
        "ตรวจแล้วและแนบเป็นหลักฐาน",
      ),
    h("p", { role: "status" }, message),
    ...(record.evidence || []).map((item) =>
      h(
        "article",
        { key: item.id },
        h("img", {
          className: "evidence-preview",
          src: item.image,
          alt: "ภาพหลักฐานที่แนบ",
        }),
        h("p", null, item.label),
        resultView(item.analysis),
        h(
          "button",
          {
            type: "button",
            disabled: busy,
            onClick: () => run(() => onRemove(item.id)),
          },
          "นำภาพนี้ออก",
        ),
      ),
    ),
  );
}
