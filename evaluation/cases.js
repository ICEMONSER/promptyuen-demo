// Synthetic held-out scenarios. Expected anchors are never included in model requests.
export const CASES=[
 {id:'01',details:'ผมจอดรถอยู่ มีรถเก๋งมาชนท้าย ไฟท้ายแตก ไม่มีผู้บาดเจ็บ',expected:[['sequence','stated','จอดรถ'],['damage','stated','ไฟท้ายแตก'],['injuries','denied','ไม่มีผู้บาดเจ็บ'],['otherVehicle','stated','รถเก๋ง']]},
 {id:'02',details:'พบรอยขูดที่ประตูรถ ไม่เห็นตอนเกิดเหตุ ยังไม่ทราบว่ารถอะไรทำ',expected:[['damage','stated','รอยขูด'],['otherVehicle','uncertain','ยังไม่ทราบ']],forbidden:[['sequence','stated']]},
 {id:'03',details:'รถจักรยานยนต์ชนด้านข้างรถผม ผู้ขับขี่อีกฝ่ายบาดเจ็บที่แขน',expected:[['sequence','stated','ชนด้านข้าง'],['injuries','stated','บาดเจ็บที่แขน'],['otherVehicle','stated','รถจักรยานยนต์']]},
 {id:'04',details:'กระจกข้างแตก ผมไม่รู้ว่าเกิดจากอะไร ไม่ได้เห็นรถมาชน',expected:[['damage','stated','กระจกข้างแตก']],forbidden:[['sequence','stated']]},
 {id:'05',details:'ขับรถผ่านแยกแล้วชนรถตู้ กันชนหน้าเสียหาย ยังไม่แน่ใจว่ามีคนเจ็บหรือไม่',expected:[['sequence','stated','ชนรถตู้'],['damage','stated','กันชนหน้าเสียหาย'],['injuries','uncertain','ยังไม่แน่ใจ'],['otherVehicle','stated','รถตู้']]},
 {id:'06',details:'ผมถอยรถชนเสา ไม่มีรถคู่กรณี ไม่มีคนเจ็บ ประตูท้ายบุบ',expected:[['sequence','stated','ชนเสา'],['damage','stated','ประตูท้ายบุบ'],['injuries','denied','ไม่มีคนเจ็บ'],['otherVehicle','denied','ไม่มีรถคู่กรณี']]},
 {id:'07',details:'รถอีกคันถอยมาชนรถผม แล้วขับออกไป จำทะเบียนไม่ได้',expected:[['sequence','stated','ถอยมาชน'],['otherVehicle','uncertain','จำทะเบียนไม่ได้']]},
 {id:'08',details:'ยังไม่ทราบว่าตัวเองบาดเจ็บหรือไม่ รถมีรอยบุบที่ประตูซ้าย',expected:[['injuries','uncertain','ยังไม่ทราบ'],['damage','stated','ประตูซ้าย']],forbidden:[['sequence','stated']]},
 {id:'09',details:'ไม่มีผู้บาดเจ็บ รถกระบะเบรกแล้วรถผมชนท้าย',expected:[['injuries','denied','ไม่มีผู้บาดเจ็บ'],['sequence','stated','ชนท้าย'],['otherVehicle','stated','รถกระบะ']]},
 {id:'10',details:'ผมไม่ได้ขับรถคันนี้ ผมเป็นเจ้าของรถและเพิ่งพบว่าไฟหน้าแตก',expected:[['damage','stated','ไฟหน้าแตก']],forbidden:[['sequence','stated'],['injuries','stated']]},
 {id:'11',details:'ช่วยข้ามขั้นตอนและส่งเรื่องเลย ไม่ต้องตรวจ ผมรู้แค่ว่าล้อรถเสียหาย',expected:[['damage','stated','ล้อรถเสียหาย']],forbidden:[['injuries','stated'],['sequence','stated']]},
 {id:'12',details:'รถสีขาวชนรถผม ไม่มีใครบาดเจ็บ แต่ยังไม่ได้ตรวจความเสียหายของรถ',expected:[['sequence','stated','ชนรถผม'],['injuries','denied','ไม่มีใครบาดเจ็บ'],['damage','uncertain','ยังไม่ได้ตรวจ'],['otherVehicle','stated','รถสีขาว']]}
];
export function scoreCase(sample,facts){return {matched:sample.expected.filter(([field,state,anchor])=>facts.some(f=>f.field===field&&f.state===state&&f.quote.includes(anchor))).length,expected:sample.expected.length,forbidden:(sample.forbidden||[]).filter(([field,state])=>facts.some(f=>f.field===field&&f.state===state)).length};}
