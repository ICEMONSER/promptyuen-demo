// One versioned JSON record; document binaries are data URLs, never server uploads.
const DB = "promptyuen-free-v1";
export const pendingDocs = new Map();
export const STORE_VERSION = 2;
const empty = () => ({
  version: STORE_VERSION,
  docs: {},
  signature: null,
  contact: null,
  cases: [],
});
function connect() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("workspace");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(new Error("เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูล กรุณาใช้โหมดปกติ"));
  });
}
async function record(mode, value) {
  const db = await connect();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("workspace", mode);
    const req =
      mode === "readonly"
        ? tx.objectStore("workspace").get("state")
        : tx.objectStore("workspace").put(value, "state");
    tx.oncomplete = () => {
      db.close();
      resolve(req.result);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(
        new Error(
          "บันทึกไม่สำเร็จ พื้นที่เบราว์เซอร์อาจเต็ม กรุณาลบข้อมูลที่ไม่ใช้",
        ),
      );
    };
  });
}
export function toDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(blob);
  });
}
export function rebuildCases(cases, docs) {
  return cases.map((record) => ({
    ...record,
    fields: Object.fromEntries(
      Object.entries(record.fields || {}).map(([key, field]) => {
        if (!field.documentId) return [key, field];
        const doc = Object.values(docs).find(
          (doc) => doc.id === field.documentId,
        );
        return [
          key,
          {
            ...field,
            value: doc?.verified ? doc.fields[key] || "" : "",
            source: doc?.name || "เอกสารถูกลบ กรุณาตรวจใหม่",
          },
        ];
      }),
    ),
  }));
}
export async function readWorkspace() {
  let state = (await record("readonly")) || empty();
  if (state.version > STORE_VERSION)
    throw new Error("ข้อมูลเป็นรุ่นใหม่กว่า กรุณาอัปเดตหน้าเว็บ");
  if (!state.version) {
    // Preserve legacy records; newest document of each type wins deterministically.
    const docs = {};
    const remap = {};
    for (const doc of state.documents || []) {
      remap[doc.id] = doc.kind;
      if (!docs[doc.kind])
        docs[doc.kind] = {
          ...doc,
          id: doc.kind,
          image: doc.blob ? await toDataURL(doc.blob) : "",
          updated: doc.createdAt,
        };
    }
    for (const item of state.cases || []) {
      item.documentIds = [
        ...new Set(
          (item.documentIds || []).map((id) => remap[id]).filter(Boolean),
        ),
      ];
      for (const field of Object.values(item.fields || {}))
        if (field.documentId)
          field.documentId = remap[field.documentId] || field.documentId;
    }
    state = { ...empty(), docs, cases: state.cases || [] };
    await writeWorkspace({ ...state, documents: Object.values(docs) });
  }
  const documents = await Promise.all(
    Object.values(state.docs).map(async (doc) => ({
      ...doc,
      blob: doc.image ? await (await fetch(doc.image)).blob() : null,
    })),
  );
  return {
    ...state,
    documents,
    cases: rebuildCases(state.cases, state.docs),
    events: [],
  };
}
export async function writeWorkspace(workspace) {
  const docs = {};
  for (const doc of workspace.documents || []) {
    const { blob, rawText, ...metadata } = doc;
    docs[doc.kind] = {
      ...metadata,
      id: doc.kind,
      fields: doc.fields || {},
      image: doc.image || (blob ? await toDataURL(blob) : ""),
      updated: doc.updated || new Date().toISOString(),
    };
  }
  const cases = workspace.cases.map((item) => ({
    ...item,
    fields: Object.fromEntries(
      Object.entries(item.fields || {}).map(([key, field]) => {
        if (!field.documentId) return [key, field];
        const { value, ...reference } = field;
        return [key, reference];
      }),
    ),
  }));
  await record(
    "readwrite",
    JSON.parse(
      JSON.stringify({
        version: STORE_VERSION,
        docs,
        signature: workspace.signature || null,
        contact: workspace.contact || null,
        cases,
      }),
    ),
  );
}
export async function clearWorkspace() {
  await record("readwrite", empty());
  pendingDocs.clear();
  sessionStorage.removeItem("promptyuen-ai");
  sessionStorage.removeItem("promptyuen-google-maps-key");
}
