const loading = new Map();
export function loadScript(src, globalName) {
  if (globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
  if (!loading.has(src))
    loading.set(
      src,
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        const timeout = setTimeout(fail, 45000);
        function fail() {
          clearTimeout(timeout);
          script.remove();
          loading.delete(src);
          reject(
            new Error(
              "โหลดเครื่องมือไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่",
            ),
          );
        }
        script.src = src;
        script.onload = () => {
          clearTimeout(timeout);
          globalThis[globalName] ? resolve(globalThis[globalName]) : fail();
        };
        script.onerror = fail;
        document.head.append(script);
      }),
    );
  return loading.get(src);
}
export const normalizeDigits = (text) =>
  String(text).replace(/[๐-๙]/g, (c) => String(c.charCodeAt(0) - 3664));
export function validThaiId(value) {
  const id = normalizeDigits(value).replace(/[\s-]/g, "");
  if (!/^[1-8]\d{12}$/.test(id)) return false;
  return (
    (11 -
      ([...id.slice(0, 12)].reduce(
        (sum, n, i) => sum + Number(n) * (13 - i),
        0,
      ) %
        11)) %
      10 ===
    Number(id[12])
  );
}
export async function imageCanvas(blob, limit = 2400) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => {
      throw new Error("เปิดภาพไม่ได้ กรุณาใช้ภาพเจเพ็กหรือพีเอ็นจี");
    });
    const scale = Math.min(
      1,
      limit / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function enhancePixels(data) {
  const histogram=new Uint32Array(256);
  const gray=new Uint8Array(data.length/4);
  for(let i=0;i<gray.length;i++){gray[i]=Math.round(.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2]);histogram[gray[i]]++;}
  const percentile=(target)=>{let n=0;for(let i=0;i<256;i++){n+=histogram[i];if(n>=target)return i;}return 255;};
  const low=percentile(gray.length*.015), high=percentile(gray.length*.985), span=Math.max(32,high-low);
  for(let i=0;i<gray.length;i++){const value=Math.max(0,Math.min(255,Math.round((gray[i]-low)*255/span)));data[i*4]=data[i*4+1]=data[i*4+2]=value;}
  return data;
}
export async function readIdPhoto(blob, progress = () => {}, scoreText = text => text.replace(/\s/g,'').length) {
  const engine = await loadScript(
    "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js",
    "Tesseract",
  );
  let worker;
  try {
    worker = await engine.createWorker("tha+eng", 1, {
      workerPath:
        "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js",
      corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0",
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
      cacheMethod: "none",
      logger: (event) => {
        if (event.status === "recognizing text")
          progress(Math.round(event.progress * 100));
      },
      errorHandler: () => {},
    });
    const original=await imageCanvas(blob,2400);
    const prepared=document.createElement('canvas');
    const scale=Math.min(2,2400/Math.max(original.width,original.height));
    prepared.width=Math.round(original.width*scale);prepared.height=Math.round(original.height*scale);
    const ctx=prepared.getContext('2d',{willReadFrequently:true});
    ctx.drawImage(original,0,0,prepared.width,prepared.height);
    const pixels=ctx.getImageData(0,0,prepared.width,prepared.height);
    enhancePixels(pixels.data);ctx.putImageData(pixels,0,0);
    await worker.setParameters({user_defined_dpi:'300',preserve_interword_spaces:'1',tessedit_pageseg_mode:'11'});
    const first=(await worker.recognize(original)).data;
    progress(50);
    await worker.setParameters({tessedit_pageseg_mode:'6'});
    const second=(await worker.recognize(prepared)).data;
    progress(100);
    // Keep one coherent reading rather than combining contradictory personal details.
    const a=scoreText(first.text),b=scoreText(second.text);
    return b>a||(a===b&&second.confidence>first.confidence)?second.text:first.text;
  } catch {
    throw new Error("อ่านภาพไม่สำเร็จ กรุณาลองใหม่หรือกรอกข้อมูลเพื่อตรวจเอง");
  } finally {
    if (worker) await worker.terminate();
  }
}
export function parseLicenseQR(raw, parseText = () => ({})) {
  // Public QR payloads vary. Never fetch an embedded URL or guess encrypted values.
  let values = {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      values = parsed;
  } catch {}
  if (!Object.keys(values).length) {
    try {
      const url = new URL(raw);
      values = Object.fromEntries(url.searchParams);
    } catch {
      for (const line of raw.split(/[\n|;]/)) {
        const match = /^\s*([^:=]+)\s*[:=]\s*(.+)$/.exec(line);
        if (match) values[match[1].trim()] = match[2].trim();
      }
    }
  }
  const aliases = {
    fullName: ["fullName", "name", "ชื่อ-นามสกุล"],
    nationalId: ["nationalId", "citizenId", "idNumber", "เลขประจำตัวประชาชน"],
    birthDate: ["birthDate", "dob", "วันเกิด"],
    address: ["address", "ที่อยู่"],
    licenseNumber: ["licenseNumber", "licenceNumber", "เลขที่ใบอนุญาต"],
    expiryDate: ["expiryDate", "วันหมดอายุ"],
  };
  const fields = parseText(raw);
  for (const [key, names] of Object.entries(aliases))
    for (const name of names)
      if (typeof values[name] === "string") {
        fields[key] = values[name].slice(0, 500);
        break;
      }
  return {
    fields,
    warning: Object.keys(fields).length
      ? "อ่านคิวอาร์แล้ว กรุณาตรวจเทียบใบขับขี่ก่อนบันทึก"
      : "คิวอาร์นี้เป็นรหัสหรือลิงก์ที่แอปอ่านข้อมูลภายในไม่ได้ กรุณากรอกข้อมูลจากใบขับขี่เอง",
  };
}
export async function readLicenseQR(blob, parseText) {
  const decode = await loadScript(
    "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
    "jsQR",
  );
  const canvas = await imageCanvas(blob);
  const frame = canvas
    .getContext("2d")
    .getImageData(0, 0, canvas.width, canvas.height);
  const result = decode(frame.data, frame.width, frame.height, {
    inversionAttempts: "attemptBoth",
  });
  if (!result)
    throw new Error("ไม่พบคิวอาร์ กรุณาใช้ภาพชัดเจนหรือกรอกข้อมูลเอง");
  return { ...parseLicenseQR(result.data, parseText), rawText: result.data };
}
