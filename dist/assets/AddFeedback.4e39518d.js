import{k as h,m as x,n as y,b as u,o as w,c as k,d as e,h as s,w as t,s as U,g as C,x as _,a0 as R,y as p}from"./index.7b837cba.js";const S=["onSubmit"],B=s("h2",null,"\u041E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043E\u0442\u043A\u043B\u0438\u043A",-1),F=s("label",null,"\u0418\u043C\u044F",-1),M=s("label",null,"\u0424\u0430\u043C\u0438\u043B\u0438\u044F",-1),N=s("label",null,"\u0422\u0435\u043B\u0435\u0444\u043E\u043D",-1),V=s("label",null,"\u0412\u043E\u0437\u0440\u0430\u0441\u0442",-1),j=_(" \u041F\u043E\u043B "),A=_("\u041C\u0443\u0436\u0447\u0438\u043D\u0430"),T=_("\u0416\u0435\u043D\u0449\u0438\u043D\u0430"),q={class:"d-flex justify-center",style:{width:"100%"}},z=_("\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C "),O={__name:"AddFeedback",setup(E){h();const r=x(),m="/companions",a=y({name:"",surname:"",phone:"",age:"",gender:"Male"});function f(){R.addFeedback(a,r.currentRoute.value.query.companion_id).then(v=>{p.config({duration:1.5,top:"70vh"}),p.success({content:"\u0423\u0441\u043F\u0435\u0448\u043D\u043E!",onClose:()=>{r.push("/companions")}})})}return(v,o)=>{const d=u("a-input"),l=u("a-col"),i=u("a-radio"),b=u("a-radio-group"),g=u("a-button"),c=u("a-row");return w(),k("div",null,[e(C,{backRoute:m}),s("form",{action:"POST",onSubmit:U(f,["prevent"]),enctype:"multipart/form-data"},[e(c,{type:"flex",justify:"center"},{default:t(()=>[e(l,{xs:22,lg:12},{default:t(()=>[B,e(c,{gutter:[16,16]},{default:t(()=>[e(l,{xs:24,md:12},{default:t(()=>[F,e(d,{value:a.name,"onUpdate:value":o[0]||(o[0]=n=>a.name=n)},null,8,["value"])]),_:1}),e(l,{xs:24,md:12},{default:t(()=>[M,e(d,{value:a.surname,"onUpdate:value":o[1]||(o[1]=n=>a.surname=n)},null,8,["value"])]),_:1}),e(l,{xs:24,md:12},{default:t(()=>[N,e(d,{value:a.phone,"onUpdate:value":o[2]||(o[2]=n=>a.phone=n)},null,8,["value"])]),_:1}),e(l,{span:12},{default:t(()=>[V,e(d,{type:"number",min:0,value:a.age,"onUpdate:value":o[3]||(o[3]=n=>a.age=n)},null,8,["value"])]),_:1}),e(l,{span:12,class:"d-flex align-center",style:{"flex-wrap":"wrap"}},{default:t(()=>[j,e(b,{value:a.gender,"onUpdate:value":o[4]||(o[4]=n=>a.gender=n),name:"radioGroup",style:{width:"-webkit-fill-available"}},{default:t(()=>[e(i,{value:"Male"},{default:t(()=>[A]),_:1}),e(i,{value:"Female"},{default:t(()=>[T]),_:1})]),_:1},8,["value"])]),_:1}),s("div",q,[e(g,{type:"primary",class:"lets_go_btn",size:"large","html-type":"submit"},{default:t(()=>[z]),_:1})])]),_:1})]),_:1})]),_:1})],40,S)])}}};export{O as default};