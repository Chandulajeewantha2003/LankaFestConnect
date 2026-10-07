require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ChatsService } = require('../dist/modules/chats/chats.service');
const { ConversationSchema, ChatMessageSchema } = require('../dist/modules/chats/chat.schema');
const seeker='000000000000000000000001', organizer='000000000000000000000002', stranger='000000000000000000000003', second='000000000000000000000004';
function setup() {
 const threads=[], messages=[];
 function matches(row,q) { return Object.entries(q).every(([k,v]) => k === '$or' ? v.some(clause => matches(row,clause)) : typeof v === 'object' && v.$lt ? row[k] < v.$lt : row[k] === v); }
 const query=value=>({ exec:async()=>value, select(){return this;} });
 const conversations={ findOneAndUpdate:(q,u)=>{let row=threads.find(r=>matches(r,q)); if(!row){row={...u.$setOnInsert,_id:(threads.length+10).toString(16).padStart(24,'0'),lastMessage:''};threads.push(row);}return query(row);},findOne:q=>query(threads.find(r=>matches(r,q))),find:q=>({sort:()=>query(threads.filter(r=>matches(r,q)))}),updateOne:(q,u)=>{Object.assign(threads.find(r=>matches(r,q)),u.$set);return query({});} };
 const messageModel={findOneAndUpdate:(q,u)=>{let row=messages.find(r=>matches(r,q));if(!row){row={...u.$setOnInsert,_id:(messages.length+20).toString(16).padStart(24,'0'),createdAt:new Date()};messages.push(row);}return query(row);},find:q=>({sort:()=>({limit:()=>query(messages.filter(r=>matches(r,q)).slice().reverse())})})};
 const users={findById:id=>query({ _id:id,fullName:id===organizer?'Organizer One':id===second?'Organizer Two':'Seeker',role:[organizer,second].includes(id)?'ORGANIZER':'SEEKER' })};
 const events={findOne:async id=>({organizerId:id==='second-event'?second:organizer})};
 return { service:new ChatsService(conversations,messageModel,users,events), threads,messages };
}
test('same account pair reuses one chat across events, different organizers have separate chats',async()=>{
 const {service,threads}=setup();const first=await service.open(seeker,'event-one');const again=await service.open(seeker,'event-two');const other=await service.open(seeker,'second-event');assert.equal(first.id,again.id);assert.notEqual(first.id,other.id);assert.equal(threads.length,2);assert.equal((await service.list(organizer)).length,1);assert.equal((await service.list(second)).length,1);assert.deepEqual(await service.list(stranger),[]);
});
test('only participants can read or send, and retries do not duplicate messages',async()=>{
 const {service,messages}=setup();const chat=await service.open(seeker,'event');await assert.rejects(service.history(chat.id,stranger),/not found/);await assert.rejects(service.send(chat.id,stranger,'Hello','id'),/not found/);
 await service.send(chat.id,seeker,'Hello','retry-one');await service.send(chat.id,seeker,'Hello','retry-one');await service.send(chat.id,organizer,'Welcome','reply-one');assert.equal(messages.length,2);assert.equal((await service.history(chat.id,seeker)).length,2);assert.equal((await service.history(chat.id,organizer))[1].text,'Welcome');await assert.rejects(service.send(chat.id,seeker,'  ','blank'),/Enter a message/);await assert.rejects(service.open(organizer,'event'),/seeker account/);
});
test('database indexes enforce unique account pairs and idempotent sends',()=>{
 assert.ok(ConversationSchema.indexes().some(([fields,options])=>fields.seekerId===1&&fields.organizerId===1&&options.unique));assert.ok(ChatMessageSchema.indexes().some(([fields,options])=>fields.clientId===1&&fields.senderId===1&&fields.conversationId===1&&options.unique));
});
