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

const make=(opts={})=>({...E.start(),...opts});
let extra=0;const xcheck=(v,msg)=>{check(v,msg);extra++};
let rich=make({cash:5000});
const original=rich.cash;rich=E.apply(rich,"programme","reserve-deposit");eq(rich.cash,original-50,"reserve deposit cash");eq(rich.programme.reserve,50,"reserve deposit");eq(rich.ap,3,"reserve transfer no action");rich=E.apply(rich,"programme","reserve-withdraw");eq(rich.cash,original,"reserve restored");fail(()=>E.apply(rich,"programme","reserve-withdraw"),"overdraw reserve");fail(()=>E.apply(make({cash:0}),"programme","reserve-deposit"),"deposit cannot overdraw");
rich=E.apply(rich,"programme","insurance");xcheck(rich.programme.insurance,"insurance active");eq(rich.programme.premiums,25,"initial premium");eq(E.forecast(rich).premium,12,"premium forecast");fail(()=>E.apply(rich,"programme","insurance"),"no duplicate policy");
const lossBase={...rich,event:"ransom",seen:["ransom"]};const uninsured={...lossBase,programme:{...lossBase.programme,insurance:false}};const withPolicy=E.apply(lossBase,"resolve",2),withoutPolicy=E.apply(uninsured,"resolve",2);xcheck(withPolicy.programme.payouts>0,"insurance payout");eq(withPolicy.cash-withoutPolicy.cash,withPolicy.programme.payouts,"insurance payout reconciled");eq(withPolicy.losses,withoutPolicy.losses,"gross loss unchanged");const paidPolicy=E.apply(withPolicy,"advance");eq(paidPolicy.programme.premiums,37,"recurring premium charged");eq(paidPolicy.programme.incidents.length,1,"incident register");
let f=E.apply(make(),"programme","funding-request");eq(f.cash,660,"board funding");eq(f.trust,61,"board confidence cost");fail(()=>E.apply(f,"programme","funding-request"),"quarterly request cap");fail(()=>E.apply(make({trust:59}),"programme","funding-request"),"trust threshold");
for(const r of E.riskRegister(make())){let x=make();const old=E.riskRegister(x).find(i=>i.id===r.id).exposure;x=E.apply(x,"programme","review:"+r.id);xcheck(E.riskRegister(x).find(i=>i.id===r.id).exposure<old,"risk review reduces uncertainty");fail(()=>E.apply(x,"programme","review:"+r.id),"duplicate review");const before=E.riskRegister(x).find(i=>i.id===r.id).exposure;x=E.apply(x,"programme","accept:"+r.id);xcheck(E.riskRegister(x).find(i=>i.id===r.id).accepted,"risk accepted");eq(E.riskRegister(x).find(i=>i.id===r.id).exposure,before,"acceptance not mitigation");fail(()=>E.apply(x,"programme","accept:"+r.id),"duplicate acceptance");xcheck(E.valid(x),"risk state valid")}
for(const c of E.controls){const x=E.apply(make({cash:5000}),"control",c[0]);xcheck(x.controls.includes(c[0])&&E.valid(x),"all controls implementable")}
for(const r of E.roles){let x=E.apply(make({cash:5000}),"hire",r[0]);x=E.apply(x,"programme","staff-training");eq(x.programme.training,1,"training recorded");x=E.apply(x,"programme","release:"+r[0]);xcheck(!x.staff[r[0]]&&x.programme.departures===1&&E.valid(x),"release role");}
for(const a of E.actions){const x=E.apply(make({cash:5000}),"action",a[0]);xcheck(x.used.includes(a[0])&&E.valid(x),"all initiatives implementable")}
fail(()=>E.apply(make(),"programme","staff-training"),"training requires staff");fail(()=>E.apply(make(),"programme","release:engineer"),"release requires staff");fail(()=>E.apply(make(),"programme","review:unknown"),"unknown risk");
let legacy=make();delete legacy.programme;xcheck(E.valid(legacy)&&E.valid(E.migrate(legacy)),"legacy migration");
for(const bad of [{reserve:-50},{reserve:1},{insurance:"yes"},{requests:[1,1]},{accepted:{unknown:2}},{reviews:{identity:12}},{incidents:[null]}])xcheck(!E.valid({...make(),programme:{...make().programme,...bad}}),"malformed programme rejected");
let x=make();xcheck(E.maturity(x).every(m=>m.percent===0),"initial framework gaps");xcheck(E.maturity({...x,controls:E.controls.map(c=>c[0])}).every(m=>m.percent===100),"complete coverage");xcheck(E.objectives(x).length===2,"sector objectives");xcheck(E.achievements({...x,controls:E.controls.map(c=>c[0])}).find(a=>a.name==="Defence in depth").earned,"achievement unlocked");
let expandedCampaigns=0;for(const level of Object.keys(E.difficulty))for(const sector of Object.keys(E.sectors))for(let seed=0;seed<30;seed++){let x=E.start(level,sector,seed);for(let i=0;!x.finished&&i<12;i++){let pool=["insurance","insurance-cancel","funding-request","staff-training",...E.riskRegister(x).map(r=>"review:"+r.id),...E.riskRegister(x).map(r=>"accept:"+r.id)];try{x=E.apply(x,"programme","reserve-deposit")}catch{}try{x=E.apply(x,"programme","reserve-withdraw")}catch{}for(let j=0;j<3;j++){try{x=E.apply(x,"programme",pool[(seed+i*5+j*7)%pool.length])}catch{}}let event=E.events.find(e=>e.id===x.event);let choice=event.options.findIndex(o=>o[1]<=x.cash);x=E.apply(x,"resolve",choice);x=E.apply(x,"advance");xcheck(E.valid(x),"expanded campaign valid");}xcheck(x.finished,"expanded campaign terminates");expandedCampaigns++}
console.log(JSON.stringify({expandedAssertions:extra,expandedCampaigns,allAssertions:baseline.checks+checks,allCampaigns:baseline.campaigns+campaigns+expandedCampaigns}));

let edge=0;const verify=(v,m)=>{check(v,m);edge++};
let transfer=E.start();for(let i=0;i<120;i++){transfer=E.apply(transfer,"programme","reserve-deposit");transfer=E.apply(transfer,"programme","reserve-withdraw")}verify(E.valid(transfer)&&transfer.cash===600&&transfer.log.length===100,"reserve transfers cannot invalidate save");
let policy=E.apply(E.start(),"programme","insurance");policy=E.apply(policy,"programme","insurance-cancel");verify(!policy.programme.insurance&&E.forecast(policy).premium===0,"cancellation stops premiums");fail(()=>E.apply(policy,"programme","insurance-cancel"),"cannot cancel inactive policy");
let exp=E.apply(E.start(),"programme","accept:identity");exp=E.apply(exp,"programme","review:identity");const initial=E.riskRegister(exp).find(r=>r.id==="identity");verify(initial.accepted&&initial.reviewed,"assessment and acceptance active");
for(let i=0;i<3;i++){const event=E.events.find(e=>e.id===exp.event);exp=E.apply(exp,"resolve",event.options.findIndex(o=>o[1]<=exp.cash));exp=E.apply(exp,"advance");}
const expired=E.riskRegister(exp).find(r=>r.id==="identity");verify(!expired.accepted&&!expired.reviewed,"risk acceptance and review expire");
let review=E.apply({...E.start(),event:"phish",seen:["phish"]},"programme","review:identity");let noReview={...review,programme:{...review.programme,reviews:{}}};verify(E.apply(review,"resolve",2).losses<E.apply(noReview,"resolve",2).losses,"review reduces incident harm");
let funding=E.apply(E.start(),"programme","funding-request");for(let i=0;i<3;i++){let ev=E.events.find(e=>e.id===funding.event);funding=E.apply(funding,"resolve",ev.options.findIndex(o=>o[1]<=funding.cash));funding=E.apply(funding,"advance");}funding.trust=66;funding=E.apply(funding,"programme","funding-request");verify(funding.programme.requests.length===2&&funding.programme.bonuses===120,"quarterly funding resets");
const forecastState=E.apply(E.apply(E.start(),"hire","analyst"),"programme","insurance"), forecast=E.forecast(forecastState);verify(forecast.net===forecast.income-forecast.payroll-forecast.premium&&forecast.projected===forecastState.cash+forecast.net,"forecast arithmetic");
fail(()=>E.apply(E.start(),"programme","review:identity:extra"),"reject malformed risk identifier");
console.log(JSON.stringify({edgeAssertions:edge,finalAssertions:baseline.checks+checks,allCampaigns:baseline.campaigns+campaigns+expandedCampaigns}));
