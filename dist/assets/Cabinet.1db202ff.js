import{k as b,m as k,r as x,I as g,b as _,o as w,c as R,d as e,w as t,g as v,h as m,e as f,H as C,a3 as V,x as s}from"./index.7b837cba.js";const B=s(" \u041A\u0430\u0431\u0438\u043D\u0435\u0442 "),K=s(" \u041E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435 "),N=s("\u0422\u0443\u0440\u044B"),j=s("\u0421\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0435"),z=s("\u0417\u0430\u0431\u0440\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435"),A=s("\u0417\u0430\u043A\u0430\u0437\u0430\u043D\u043D\u044B\u0435"),E=s(" \u041F\u043E\u043F\u0443\u0442\u0447\u0438\u043A\u0438 "),H=s("\u0410\u0434\u043C\u0438\u043D"),I=s("\u041C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u044F"),O=s("\u0418\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441"),U={__name:"Cabinet",setup(S){const p=b(),u=k();let a=x([u.currentRoute.value.path]);const h=()=>{p.logout(),u.push("/")};return g(a,(i,n)=>{u.push(i[0])}),(i,n)=>{const c=_("a-col"),d=_("a-row"),o=_("a-menu-item"),r=_("a-sub-menu"),y=_("a-menu");return w(),R("div",null,[e(v),e(d,{type:"flex",justify:"center"},{default:t(()=>[e(c,{xs:22,sm:16},{default:t(()=>[m("h2",null,[B,m("span",{onClick:n[0]||(n[0]=l=>h()),class:"mdi mdi-24px mdi-logout",style:{cursor:"pointer",float:"right"}})])]),_:1})]),_:1}),e(d,{type:"flex",justify:"center"},{default:t(()=>[e(c,{xs:22,lg:16,class:"mb-8"},{default:t(()=>[e(y,{selectedKeys:f(a),"onUpdate:selectedKeys":n[1]||(n[1]=l=>C(a)?a.value=l:a=l),mode:"horizontal"},{default:t(()=>[e(o,{key:"/cabinet/me"},{default:t(()=>[K]),_:1}),e(r,{key:"sub1"},{title:t(()=>[N]),default:t(()=>[e(o,{key:"/cabinet/created-trips"},{default:t(()=>[j]),_:1}),e(o,{key:"/cabinet/purchased-trips"},{default:t(()=>[z]),_:1}),e(o,{key:"/cabinet/booking-trips"},{default:t(()=>[A]),_:1})]),_:1}),e(o,{key:"/cabinet/my-companions"},{default:t(()=>[E]),_:1}),e(r,{key:"sub2"},{title:t(()=>[H]),default:t(()=>[e(o,{key:"/cabinet/moderation"},{default:t(()=>[I]),_:1}),e(o,{key:"/cabinet/interface"},{default:t(()=>[O]),_:1})]),_:1})]),_:1},8,["selectedKeys"])]),_:1}),e(c,{xs:22,lg:16},{default:t(()=>[e(f(V))]),_:1})]),_:1})])}}};export{U as default};