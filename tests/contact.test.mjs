import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateContact,documentContact} from '../assets/contact-core.js';
import {renderReport} from '../assets/report.js';
test('requires phone and Gmail, normalizes accepted contact formats',()=>{
 assert.deepEqual(validateContact({phone:'081-234-5678',email:' Demo.User@gmail.com '}),{phone:'0812345678',email:'demo.user@gmail.com'});
 for(const fields of [{},{phone:'0812345678'},{phone:'bad',email:'a@gmail.com'},{phone:'0812345678',email:'a@gmail.com.evil'},{phone:'0812345678',email:'a@example.com'}])assert.throws(()=>validateContact(fields));
});
test('contact must belong to selected verified identity document',()=>{
 const identity={id:'id',kind:'identity',verified:true,fields:{phone:'0812345678',email:'test@gmail.com'}};
 assert.equal(documentContact([identity],['id']).email,'test@gmail.com');
 assert.throws(()=>documentContact([identity],[]));
 assert.throws(()=>documentContact([{...identity,verified:false}],['id']));
});
test('letter prints saved draft reference and only telephone/email in contact block',()=>{
 const html=renderReport({service:'accident',reference:'DEMO-0202D405',fields:{phone:{value:'0812345678'},email:{value:'test@gmail.com'},details:{value:'ข้อความ'}},evidence:[]},{short:'ทดสอบ'},{});
 assert.ok(html.includes('ที่ DEMO-0202D405'));
 assert.ok(!html.includes('[ระบุเลขที่หนังสือ]'));
 const contact=html.split('<div class="letter-contact">')[1].split('</div>')[0];
 assert.ok(contact.includes('0812345678'));assert.ok(contact.includes('test@gmail.com'));
 assert.ok(!/โทรสาร|สังกัด|สำเนาส่ง/.test(contact));
});
