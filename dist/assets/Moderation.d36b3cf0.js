import{_ as M,Q as S,r as b,m as B,p as I,b as l,o as c,f as _,w as a,d as u,e as v,c as N,v as $,F as V,x as m,h as e,t as p,q as L,Y as T,Z as R}from"./index.7b837cba.js";const r=d=>(T("data-v-6dd897e8"),d=d(),R(),d),j=r(()=>e("h3",null,"\u041D\u0430 \u043C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u0438",-1)),q={style:{"text-align":"center"}},E=r(()=>e("span",{class:"mdi mdi-compass-outline"},null,-1)),O=r(()=>e("span",{class:"mdi mdi-calendar-arrow-right"},null,-1)),Q=r(()=>e("span",{class:"mdi mdi-calendar-arrow-left"},null,-1)),Y={class:"actions d-flex justify-center"},Z=r(()=>e("span",{class:"mdi mdi-delete",style:{color:"#ff6600",cursor:"pointer"}},null,-1)),z=["onClick"],A=m(" \u041D\u0435\u0442 \u0442\u0443\u0440\u043E\u0432 \u043D\u0430 \u043C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u0438 "),G={__name:"Moderation",setup(d){let g=S(),f=b([]),k=B();I(async()=>{let{data:t}=await g.findForModeration();f.value=t});async function w(t){let{response:s}=await g.deleteById(t),{status:i}=s;if(i!="400")for(let n=0;n<trips.value.length;n++)trips.value[n]._id==t&&trips.value.splice(n,1)}const y=t=>{let s;return t.length==13?s=new Date(Number(t)):s=new Date(t),s.toLocaleDateString("ru-Ru",{year:"2-digit",month:"2-digit",day:"2-digit"})};return(t,s)=>{const i=l("a-divider"),n=l("a-popconfirm"),C=l("a-card"),h=l("a-col"),x=l("a-row");return c(),_(x,null,{default:a(()=>[u(h,{span:24},{default:a(()=>[j,u(x,{gutter:[8,8],class:"mt-8"},{default:a(()=>[v(f).length>0?(c(!0),N(V,{key:0},$(v(f),(o,D)=>(c(),_(h,{lg:8,sm:12,xs:24,key:D},{default:a(()=>[u(C,{class:"card",hoverable:""},{default:a(()=>[e("div",q,p(o.name),1),u(i,{class:"ma-4",style:{"border-color":"#205F79"}}),e("div",null,[E,m(p(o.location),1)]),e("div",null,[O,m(" "+p(`c ${y(o.start)}`)+" ",1),Q,m(" "+p(`\u043F\u043E ${y(o.end)}`),1)]),e("div",Y,[!o.billsList.length>0?(c(),_(n,{key:0,title:"\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B?","ok-text":"\u0414\u0430","cancel-text":"\u041D\u0435\u0442",onConfirm:F=>w(o._id)},{default:a(()=>[Z]),_:2},1032,["onConfirm"])):L("",!0),e("span",{class:"mdi mdi-check-decagram-outline",onClick:F=>v(k).push(`/trip-moderation?_id=${o._id}`),style:{color:"#245159",cursor:"pointer"}},null,8,z)])]),_:2},1024)]),_:2},1024))),128)):(c(),_(h,{key:1,lg:8,sm:12,xs:24},{default:a(()=>[A]),_:1}))]),_:1})]),_:1})]),_:1})}}},J=M(G,[["__scopeId","data-v-6dd897e8"]]);export{J as default};