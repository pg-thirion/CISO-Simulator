"use strict";
const assert=require("node:assert/strict");
const {CISO:E,tests}=require("./engine.js");
const baseline=tests(E);
let checks=0;const check=(x,message)=>{assert.ok(x,message);checks++};
const eq=(a,b,message)=>{assert.deepEqual(a,b,message);checks++};
const fail=(fn,message)=>{assert.throws(fn,undefined,message);checks++};
const seed=E.start();
for(const bad of [null,[],{}, {...seed,staff:[]},{...seed,cash:-1},{...seed,cash:Infinity},{...seed,level:"constructor"},{...seed,sector:"__proto__"},{...seed,seen:[]},{...seed,seen:[seed.event,seed.event]},{...seed,used:["support"]},{...seed,history:[{}]},{...seed,reason:"false"},{...seed,finished:true},{...seed,log:[{month:99,title:"x",detail:"y"}]},{...seed,staff:{engineer:3}},{...seed,staff:{engineer:0}},{...seed,ap:4}])check(!E.valid(bad),"reject malformed save");
fail(()=>E.start("constructor"),"reject inherited difficulty");
fail(()=>E.start("standard","__proto__"),"reject inherited sector");
for(const level of Object.keys(E.difficulty))for(const sector of Object.keys(E.sectors)){
for(const event of E.events){
for(let choice=0;choice<event.options.length;choice++){
const base={...E.start(level,sector,1),event:event.id,seen:[event.id],cash:1000};
const before=JSON.stringify(base);
const result=E.apply(base,"resolve",choice);
check(result.resolved,"incident resolved");
check(E.valid(result),"response state valid");
eq(JSON.stringify(base),before,"response immutable");
check(result.cash<=base.cash-event.options[choice][1],"response cost applied");
const next=E.apply(result,"advance");check(E.valid(next),"advance valid");
if(event.risk&&event.guard){
const guarded={...base,controls:[event.guard]};
const protectedResult=E.apply(guarded,"resolve",choice);
check(protectedResult.losses<=result.losses,"controls mitigate losses");
}
}
}}
let s=E.start();s=E.apply(s,"action","support");fail(()=>E.apply(s,"action","support"),"initiative cannot repeat in same month");s=E.apply(s,"resolve",2);s=E.apply(s,"advance");check(!s.used.includes("support"),"monthly action reset");
let hire=E.start();hire=E.apply(hire,"hire","analyst");hire=E.apply(hire,"hire","analyst");fail(()=>E.apply(hire,"hire","analyst"),"role cap");let paid=E.apply(hire,"resolve",2);let next=E.apply(paid,"advance");eq(next.spent,paid.spent+36,"salary charged");
let early={...E.start(),security:0,trust:0};early=E.apply(early,"resolve",2);early=E.apply(early,"advance");check(early.finished,"early dismissal");fail(()=>E.apply(early,"advance"),"finished campaign immutable");
let campaigns=0,finished=0,earlyCount=0;for(const level of Object.keys(E.difficulty))for(const sector of Object.keys(E.sectors))for(let seed=0;seed<100;seed++){
let x=E.start(level,sector,seed),turns=0;
while(!x.finished){
for(let i=0;i<3;i++){const pool=[...E.controls.map(c=>["control",c[0]]),...E.roles.map(r=>["hire",r[0]]),...E.actions.map(a=>["action",a[0]])];const [kind,id]=pool[(seed*17+x.month*7+i*13)%pool.length];try{x=E.apply(x,kind,id)}catch{}}
let e=E.events.find(e=>e.id===x.event),option=(seed+x.month)%3;while(e.options[option][1]>x.cash)option++;x=E.apply(x,"resolve",option);x=E.apply(x,"advance");check(E.valid(x),"mixed strategy valid");check(++turns<=12,"campaign terminates");
}
campaigns++;if(x.month===12)finished++;else earlyCount++;
}
console.log(JSON.stringify({baseline,additionalAssertions:checks,mixedCampaigns:campaigns,completedYear:finished,earlyDismissals:earlyCount},null,2));
