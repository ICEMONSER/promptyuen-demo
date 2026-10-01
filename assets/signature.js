import { D as React } from "./shared-ui.js";
import { imageCanvas } from "./import-document.js";
import { thaiDate } from "./report.js";
const h = React.createElement;
export function SignaturePad({ value, onSave }) {
  const canvas = React.useRef(null);
  const drawing = React.useRef(false);
  const [dirty, setDirty] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  React.useEffect(() => {
    const ctx = canvas.current.getContext("2d");
    ctx.clearRect(0, 0, 560, 180);
    setDirty(false);
    if (value) {
      const img = new Image();
      let active = true;
      img.onload = () => {
        if (active) ctx.drawImage(img, 0, 0, 560, 180);
      };
      img.src = value;
      return () => {
        active = false;
      };
    }
  }, [value]);
  function position(event) {
    const rect = canvas.current.getBoundingClientRect();
    return [
      ((event.clientX - rect.left) * 560) / rect.width,
      ((event.clientY - rect.top) * 180) / rect.height,
    ];
  }
  function start(event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const ctx = canvas.current.getContext("2d");
    const [x, y] = position(event);
    ctx.strokeStyle = "#14263e";
    ctx.fillStyle = "#14263e";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y, 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDirty(true);
    setMessage("");
  }
  function move(event) {
    if (!drawing.current) return;
    const ctx = canvas.current.getContext("2d");
    ctx.lineTo(...position(event));
    ctx.stroke();
  }
  async function save(next) {
    setBusy(true);
    try {
      await onSave(next);
      setDirty(false);
      setMessage(next ? "บันทึกลายมือชื่อแล้ว" : "ลบลายมือชื่อแล้ว");
    } catch {
      setMessage("บันทึกลายมือชื่อไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setBusy(false);
    }
  }
  return h(
    "section",
    { className: "assistant-panel" },
    h("h3", null, "ลายมือชื่อสำหรับเอกสาร"),
    h(
      "p",
      { className: "small-note" },
      "วาดลายมือชื่อด้วยนิ้วหรือเมาส์ ข้อมูลเก็บในเบราว์เซอร์นี้และใช้รับรองสำเนาที่คุณเลือก",
    ),
    h("canvas", {
      ref: canvas,
      width: 560,
      height: 180,
      className: "signature-pad",
      "aria-label": "พื้นที่วาดลายมือชื่อ",
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: () => {
        drawing.current = false;
      },
      onPointerCancel: () => {
        drawing.current = false;
      },
    }),
    h(
      "button",
      {
        type: "button",
        disabled: busy,
        onClick: () => {
          canvas.current.getContext("2d").clearRect(0, 0, 560, 180);
          setDirty(false);
          setMessage("วาดลายมือชื่อใหม่ แล้วกดบันทึก");
        },
      },
      "วาดใหม่",
    ),
    h(
      "button",
      {
        type: "button",
        disabled: busy || !dirty,
        onClick: () => save(canvas.current.toDataURL("image/png")),
      },
      "บันทึกลายมือชื่อ",
    ),
    value &&
      h(
        "button",
        { type: "button", disabled: busy, onClick: () => save(null) },
        "ลบลายมือชื่อ",
      ),
    h("p", { role: "status" }, message),
  );
}
export function LocalLogin({ signature, onSave, onEnter }) {
  return h(
    "main",
    { className: "assistant-login" },
    h("h1", null, "พร้อมยื่น · เข้าใช้งานบนเครื่องนี้"),
    h(
      "p",
      null,
      "เตรียมข้อมูลแจ้งความและเอกสารด้วยข้อมูลที่คุณตรวจแล้ว ไม่ต้องสมัครบัญชี",
    ),
    h(SignaturePad, { value: signature, onSave }),
    h(
      "section",
      { className: "assistant-panel" },
      h("button", { type: "button", onClick: onEnter }, "เข้าใช้งาน"),
      h(
        "p",
        { className: "small-note" },
        "เข้าใช้งานก่อนได้ และเพิ่มลายมือชื่อภายหลังในข้อมูลและความเป็นส่วนตัว",
      ),
    ),
  );
}
export async function certifiedCopy(doc, signature) {
  if (!doc.blob || !doc.mime?.startsWith("image/")) return null;
  const original = await imageCanvas(doc.blob, 1600);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(800, original.width);
  canvas.height = original.height + 240;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(original, (canvas.width - original.width) / 2, 0);
  ctx.fillStyle = "#14263e";
  ctx.textAlign = "center";
  ctx.font = "32px Tahoma, sans-serif";
  ctx.fillText("สำเนาถูกต้อง", canvas.width / 2, original.height + 45);
  ctx.font = "24px Tahoma, sans-serif";
  ctx.fillText(`วันที่ ${thaiDate()}`, canvas.width / 2, original.height + 220);
  if (signature) {
    const img = new Image();
    img.src = signature;
    await img.decode();
    ctx.drawImage(img, canvas.width / 2 - 170, original.height + 65, 340, 110);
  } else {
    ctx.font = "24px Tahoma, sans-serif";
    ctx.fillText(
      "ลงชื่อ ........................................",
      canvas.width / 2,
      original.height + 140,
    );
  }
  return { name: doc.name, image: canvas.toDataURL("image/jpeg", 0.9) };
}
