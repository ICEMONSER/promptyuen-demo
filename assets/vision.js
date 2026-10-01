import { imageCanvas } from "./import-document.js";
export const AI_LABEL = "ผลประเมินเบื้องต้นโดย AI ไม่ใช่คำวินิจฉัยทางกฎหมาย";
export function validateAnalysis(data) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof data.part !== "string" ||
    !/[ก-๙]/.test(data.part) ||
    /[a-z]/i.test(data.part) ||
    data.part.length > 160 ||
    !Number.isInteger(data.severity) ||
    data.severity < 1 ||
    data.severity > 3 ||
    typeof data.summary_th !== "string" ||
    !/[ก-๙]/.test(data.summary_th) ||
    /[a-z]/i.test(data.summary_th) ||
    data.summary_th.length > 1200 ||
    typeof data.confidence !== "number" ||
    !Number.isFinite(data.confidence) ||
    data.confidence < 0 ||
    data.confidence > 1
  )
    throw new Error("คำตอบจาก AI ไม่ตรงรูปแบบหรือไม่ใช่ภาษาไทย กรุณาลองใหม่");
  return {
    part: data.part,
    severity: data.severity,
    summary_th: data.summary_th,
    confidence: data.confidence,
  };
}
export async function downscalePhoto(file) {
  if (
    !file ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    !file.size ||
    file.size > 15 * 1024 * 1024
  )
    throw new Error("ใช้ภาพเจเพ็ก พีเอ็นจี หรือเว็บพี ไม่เกิน 15 เมกะไบต์");
  return (await imageCanvas(file, 1024)).toDataURL("image/jpeg", 0.7);
}
