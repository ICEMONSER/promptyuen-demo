// User-provided competition fixtures. These are not verified identity records.
export const SAMPLE_VERSION = '2026-10-17';
export const SAMPLE_CONTACT = {phone:'0846592461',email:'myteklnwza007@gmail.com'};
export const SAMPLE_DOCUMENTS = [
 {kind:'identity',name:'บัตรประชาชน',fields:{fullName:'XXXXX XXXXXXXXX',nationalId:'0000000000000',birthDate:'28 มีนาคม 2537',address:'xx/xx หมู่ที่ xx ถนน xxxxx แขวง xxxxx อ. xxx จ. xxxxx',...SAMPLE_CONTACT}},
 {kind:'license',name:'ใบขับขี่',fields:{fullName:'น.ส. ศศิธร น้ำใจงาม',nationalId:'9999999999999',birthDate:'13 กรกฎาคม 2528',licenseNumber:'56010726',expiryDate:'13 กรกฎาคม 2561'}},
 {kind:'vehicle',name:'ใบคู่มือจดทะเบียนรถ',fields:{}}
];
export async function loadSampleDocuments(fetcher=fetch) {
 return Promise.all(SAMPLE_DOCUMENTS.map(async doc=>{
  const response=await fetcher(new URL(`./sample-documents/${doc.kind}.png`,import.meta.url));
  if(!response.ok)throw Error('โหลดเอกสารตัวอย่างไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ');
  const blob=await response.blob();
  return {...doc,fields:{...doc.fields},id:doc.kind,mime:'image/png',size:blob.size,blob,verified:true,demo:true,sampleVersion:SAMPLE_VERSION,method:'sample',createdAt:'2026-10-17T00:00:00+07:00'};
 }));
}
