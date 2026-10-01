import { D as React } from "./shared-ui.js";
import { checklist } from "./case-config.js";
export function DocumentChecklist({
  topic,
  documents,
  selected,
  labels,
  onChange,
}) {
  const h = React.createElement;
  return h(
    "section",
    { className: "assistant-panel" },
    h("h3", null, "เอกสารประกอบที่ควรเตรียม"),
    h(
      "p",
      { className: "small-note" },
      "รายการเบื้องต้นสำหรับเตรียมข้อมูล เลือกใช้หรือไม่ใช้เอกสารได้ และตรวจข้อกำหนดกับหน่วยงานอีกครั้ง",
    ),
    ...checklist(topic, documents, selected).map((item) =>
      h(
        "p",
        { key: item.type, className: item.selected ? "available" : "missing" },
        `${item.selected ? "พร้อมใช้" : item.available ? "ยังไม่ได้เลือก" : "ยังขาด"} · ${labels[item.type]}`,
      ),
    ),
    onChange &&
      documents
        .filter((doc) => doc.verified)
        .map((doc) =>
          h(
            "label",
            { key: doc.id, className: "check-label" },
            h("input", {
              type: "checkbox",
              checked: selected.includes(doc.id),
              onChange: (event) =>
                onChange(
                  event.target.checked
                    ? [...selected, doc.id]
                    : selected.filter((id) => id !== doc.id),
                ),
            }),
            labels[doc.kind],
          ),
        ),
    h("small", null, "ยังเตรียมคำขอต่อได้แม้เอกสารไม่ครบ"),
  );
}
