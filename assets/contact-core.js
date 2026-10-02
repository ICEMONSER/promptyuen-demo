export function validateContact(fields={}) {
 const phone=String(fields.phone||'').trim().replace(/[\s()-]/g,'');
 const email=String(fields.email||'').trim().toLowerCase();
 if(!/^(?:0\d{8,9}|\+66\d{8,9})$/.test(phone))throw Error('กรุณากรอกหมายเลขโทรศัพท์ไทยให้ถูกต้องในหน้าอัปโหลด/ตรวจเอกสารบัตรประชาชน');
 if(!/^[a-z0-9]+(?:[.][a-z0-9]+)*(?:\+[a-z0-9._-]+)?@gmail\.com$/.test(email))throw Error('กรุณากรอก Gmail ที่ถูกต้อง เช่น name@gmail.com ในหน้าอัปโหลด/ตรวจเอกสารบัตรประชาชน');
 return {phone,email};
}
export function documentContact(documents,selected) {
 const identity=documents.find(d=>d.kind==='identity'&&d.verified&&(!selected||selected.includes(d.id)));
 return validateContact(identity?.fields);
}
