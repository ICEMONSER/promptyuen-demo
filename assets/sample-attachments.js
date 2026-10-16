import {D as React} from './shared-ui.js';
import {SAMPLE_DOCUMENTS} from './sample-documents.js';
const h=React.createElement;
export function SampleAttachments({record}) {
 const docs=SAMPLE_DOCUMENTS.filter(doc=>(record.documentIds||[]).includes(doc.kind));
 if(!docs.length)return null;
 return h('section',{'aria-label':'เอกสารประกอบคำขอ'},h('h3',null,'เอกสารประกอบคำขอ'),...docs.map(doc=>{
  const url=new URL(`./sample-documents/${doc.kind}.png`,import.meta.url).href;
  return h('figure',{key:doc.kind},h('figcaption',null,doc.name),h('a',{href:url,target:'_blank',rel:'noopener noreferrer','aria-label':`เปิดดู ${doc.name}`},h('img',{src:url,alt:doc.name,style:{maxWidth:'100%',maxHeight:'180px',objectFit:'contain'}})));
 }));
}
