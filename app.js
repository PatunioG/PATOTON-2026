const $ = s => document.querySelector(s);
const nav=$("#mainNav");
$("#menuToggle").addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
const modal=$("#adminModal");
$("#adminLoginOpen").addEventListener("click",()=>modal.hidden=false);
$("#adminModalClose").addEventListener("click",()=>modal.hidden=true);
modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true;});
let sb=null, adminUser=null;
const configured=window.PATOTON_SUPABASE_URL && !window.PATOTON_SUPABASE_URL.includes("PEGA_AQUI") && window.PATOTON_SUPABASE_ANON_KEY && !window.PATOTON_SUPABASE_ANON_KEY.includes("PEGA_AQUI") && window.supabase?.createClient;
if(configured) sb=window.supabase.createClient(window.PATOTON_SUPABASE_URL,window.PATOTON_SUPABASE_ANON_KEY);
function msg(id,text,error=false){const el=$("#"+id);el.textContent=text;el.classList.toggle("error",error);}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function verifyAdmin(user){
  const {data,error}=await sb.from("patoton_admins").select("user_id").eq("user_id",user.id).maybeSingle();
  if(error)throw error;
  return !!data;
}

// Dual live countdowns: Mexico City local time (UTC-6).
function paintCountdown(targetId,statusId,dateString,doneText){
 const target=new Date(dateString+"-06:00").getTime(), now=Date.now(), diff=target-now;
 const el=$("#"+targetId), status=$("#"+statusId);
 if(diff<=0){el.innerHTML="<div><b>🎉</b><small>¡LLEGÓ!</small></div>";status.textContent=doneText;return;}
 const days=Math.floor(diff/86400000),hours=Math.floor(diff%86400000/3600000),mins=Math.floor(diff%3600000/60000),secs=Math.floor(diff%60000/1000);
 el.innerHTML=[[days,"DÍAS"],[hours,"HORAS"],[mins,"MIN"],[secs,"SEG"]].map(([v,l])=>`<div><b>${String(v).padStart(2,"0")}</b><small>${l}</small></div>`).join("");
 status.textContent="¡Cada día estamos más cerca!";
}
function updateCountdowns(){
 paintCountdown("countdownChristmas","countdownChristmasStatus","2026-12-25T00:00:00","¡Feliz Navidad Patuna!");
 paintCountdown("countdownKings","countdownKingsStatus","2027-01-06T00:00:00","¡Feliz Día de Reyes!");
}
updateCountdowns();setInterval(updateCountdowns,1000);

function renderRaised(row){
 if(!row)return;
 $("#raisedMoney").textContent=new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:2}).format(Number(row.money_mxn||0));
 $("#raisedToys").textContent=Number(row.toys||0).toLocaleString("es-MX");
 $("#raisedClothes").textContent=Number(row.clothes||0).toLocaleString("es-MX");
 $("#raisedFood").textContent=Number(row.food||0).toLocaleString("es-MX");
 $("#raisedUpdated").textContent="Última actualización: "+new Date(row.updated_at).toLocaleString("es-MX");
}
async function loadPublicRaised(){
 if(!sb)return;
 try{const row=await adminCall(sb.from("patoton_raised_totals").select("*").eq("id",1).single());renderRaised(row);}catch(e){console.warn("No se pudieron leer los totales",e.message);}
}
async function loadPublicVideos(){
 if(!sb)return;
 try{
  const rows=await adminCall(sb.from("patoton_videos").select("*").eq("is_public",true).order("created_at",{ascending:false}));
  const featured=rows.find(v=>v.is_featured)||rows[0];
  if(featured) $("#tvFeatured").innerHTML=videoEmbed(featured,true);
  $("#publicVideos").innerHTML=rows.filter(v=>!featured||v.id!==featured.id).map(v=>`<article class="tv-video-card">${videoEmbed(v,false)}</article>`).join("")||'<article class="tv-empty"><span>🎬</span><b>MUY PRONTO</b><small>Estamos preparando los videos de PATOTÓN.</small></article>';
 }catch(e){console.warn("No se pudieron cargar videos",e.message);}
}
function youtubeId(url){
 try{const u=new URL(url);if(u.hostname.includes("youtu.be"))return u.pathname.slice(1);if(u.hostname.includes("youtube.com"))return u.searchParams.get("v")||u.pathname.split("/").filter(Boolean).pop();}catch(e){}
 return null;
}
function videoEmbed(v,large){
 const box=large?"tv-feature-video":"tv-card-video";
 if(v.source_type==="youtube"){const id=youtubeId(v.youtube_url||"");return `<div class="${box}"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id||"")}" title="${esc(v.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><div class="tv-video-copy"><b>${esc(v.title)}</b><p>${esc(v.description||"")}</p></div>`;}
 const {data}=sb.storage.from("patoton-tv").getPublicUrl(v.storage_path);
 return `<div class="${box}"><video controls preload="metadata" src="${esc(data.publicUrl)}"></video></div><div class="tv-video-copy"><b>${esc(v.title)}</b><p>${esc(v.description||"")}</p></div>`;
}

$("#adminLoginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  if(!sb){msg("adminLoginStatus","Primero configura Supabase en supabase-config.js.",true);return;}
  msg("adminLoginStatus","Verificando acceso…");
  try{
    const {data,error}=await sb.auth.signInWithPassword({email:$("#adminEmail").value.trim(),password:$("#adminPassword").value});
    if(error)throw error;
    if(!await verifyAdmin(data.user)){await sb.auth.signOut();throw new Error("Esta cuenta no tiene permisos de administrador.");}
    adminUser=data.user;modal.hidden=true;$("#adminShell").hidden=false;$("#adminIdentity").textContent=data.user.email;
    $("#adminShell").scrollIntoView({behavior:"smooth"});await loadOverview();await loadPublicRaised();await loadPublicVideos();
  }catch(err){msg("adminLoginStatus",err.message||"No se pudo iniciar sesión.",true);}
});
$("#adminLogout").addEventListener("click",async()=>{if(sb)await sb.auth.signOut();adminUser=null;$("#adminShell").hidden=true;window.scrollTo({top:0,behavior:"smooth"});});
async function adminCall(promise){const {data,error}=await promise;if(error)throw error;return data;}
async function loadOverview(){
  const names=["patoton_donations","patoton_volunteers","patoton_updates"],ids=["statDonations","statVolunteers","statUpdates"];
  for(let i=0;i<names.length;i++){try{const {count,error}=await sb.from(names[i]).select("*",{count:"exact",head:true});if(error)throw error;$("#"+ids[i]).textContent=count??0;}catch(e){$("#"+ids[i]).textContent="—";console.error(e);}}
}
const tabs=["overview","donations","volunteers","updates","videos","raised","settings"];
$("#adminTabs").querySelectorAll("button").forEach(b=>b.addEventListener("click",async()=>{
  if(!adminUser)return;
  $("#adminTabs").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));
  tabs.forEach(t=>$("#tab-"+t).classList.toggle("active",t===b.dataset.tab));
  try{if(b.dataset.tab==="overview")await loadOverview();if(b.dataset.tab==="donations")await loadDonations();if(b.dataset.tab==="volunteers")await loadVolunteers();if(b.dataset.tab==="updates")await loadUpdates();if(b.dataset.tab==="videos")await loadAdminVideos();if(b.dataset.tab==="raised")await loadAdminRaised();}
  catch(e){console.error(e);alert("No se pudo cargar esta sección: "+e.message);}
}));
async function loadDonations(){
 const rows=await adminCall(sb.from("patoton_donations").select("*").order("created_at",{ascending:false}));
 $("#donationsRows").innerHTML=rows.map(r=>`<tr><td>${esc(r.donation_type)}</td><td>${esc(r.donor_name)}</td><td>${esc(r.contact||"—")}</td><td>${esc(r.message||"—")}</td><td>${esc(r.status)}</td><td><button class="table-action" data-donation="${r.id}" data-status="${r.status==="received"?"pending":"received"}">${r.status==="received"?"MARCAR PENDIENTE":"MARCAR RECIBIDA"}</button></td></tr>`).join("")||'<tr><td colspan="6">Todavía no hay propuestas.</td></tr>';
 document.querySelectorAll("[data-donation]").forEach(b=>b.addEventListener("click",async()=>{try{await adminCall(sb.from("patoton_donations").update({status:b.dataset.status}).eq("id",b.dataset.donation));await loadDonations();await loadOverview();}catch(e){alert(e.message);}}));
}
async function loadVolunteers(){
 const rows=await adminCall(sb.from("patoton_volunteers").select("*").order("created_at",{ascending:false}));
 $("#volunteersRows").innerHTML=rows.map(r=>`<tr><td>${esc(r.full_name)}</td><td>${esc(r.contact||"—")}</td><td>${esc(r.availability||"—")}</td><td>${esc(r.status)}</td></tr>`).join("")||'<tr><td colspan="4">Todavía no hay registros.</td></tr>';
}
async function loadUpdates(){
 const rows=await adminCall(sb.from("patoton_updates").select("*").order("created_at",{ascending:false}));
 $("#adminUpdatesRows").innerHTML=rows.map(r=>`<div class="admin-update"><b>${esc(r.title)}</b><p>${esc(r.body)}</p><button class="table-action" data-update-delete="${r.id}">ELIMINAR</button></div>`).join("")||"<p>Aún no hay actualizaciones.</p>";
 $("#publicUpdates").innerHTML=rows.filter(r=>r.is_public).map(r=>`<article class="update-card"><span>📣</span><div><b>${esc(r.title)}</b><p>${esc(r.body)}</p></div></article>`).join("")||'<article class="update-card"><span>📣</span><div><b>¡PATOTÓN 2026 está en marcha!</b><p>Estamos preparando dos jornadas solidarias: 25 de diciembre y 6 de enero.</p></div></article>';
 document.querySelectorAll("[data-update-delete]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("¿Eliminar esta actualización?"))return;try{await adminCall(sb.from("patoton_updates").delete().eq("id",b.dataset.updateDelete));await loadUpdates();await loadOverview();}catch(e){alert(e.message);}}));
}
$("#donationForm").addEventListener("submit",async e=>{
 e.preventDefault();
 const payload={donation_type:$("#donationType").value,donor_name:$("#donorName").value.trim(),contact:$("#donorContact").value.trim()||null,message:$("#donorMessage").value.trim()||null};
 if(!sb){msg("donationStatus","La recepción de propuestas estará disponible cuando se conecte Supabase. Por ahora puedes preparar la página y después activaremos el formulario.",true);return;}
 try{await adminCall(sb.from("patoton_donations").insert(payload));msg("donationStatus","¡Gracias! Recibimos tu propuesta. Nos pondremos en contacto si dejaste un dato de contacto.");e.target.reset();}
 catch(err){msg("donationStatus","No se pudo enviar: "+err.message,true);}
});
$("#updateForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!adminUser)return;
 try{await adminCall(sb.from("patoton_updates").insert({title:$("#updateTitle").value.trim(),body:$("#updateBody").value.trim(),is_public:true,created_by:adminUser.id}));msg("updateStatus","¡Actualización publicada!");e.target.reset();await loadUpdates();await loadOverview();}
 catch(err){msg("updateStatus",err.message,true);}
});
$("#refreshDonations").addEventListener("click",()=>loadDonations().catch(e=>alert(e.message)));
$("#refreshVolunteers").addEventListener("click",()=>loadVolunteers().catch(e=>alert(e.message)));
$("#saveCampaignLocal").addEventListener("click",()=>msg("campaignStatus","Los datos visuales están preparados. La edición persistente de la campaña se añadirá en la siguiente versión."));

if(sb){loadPublicRaised();loadPublicVideos();}

// PATOTÓN TV admin management
$("#videoType").addEventListener("change",()=>{
 const yt=$("#videoType").value==="youtube";
 $("#youtubeField").hidden=!yt;$("#uploadField").hidden=yt;
 $("#videoYoutube").required=yt;$("#videoFile").required=!yt;
});
async function loadAdminVideos(){
 const rows=await adminCall(sb.from("patoton_videos").select("*").order("created_at",{ascending:false}));
 $("#adminVideosRows").innerHTML=rows.map(v=>`<div class="admin-video-row"><div><b>${esc(v.title)}</b><small>${v.source_type==="youtube"?"YouTube":"Archivo subido"} · ${v.is_public?"Publicado":"Oculto"}${v.is_featured?" · DESTACADO":""}</small></div><button class="table-action" data-video-hide="${v.id}" data-visible="${v.is_public}">${v.is_public?"OCULTAR":"PUBLICAR"}</button><button class="table-action" data-video-delete="${v.id}">ELIMINAR</button></div>`).join("")||"<p>No hay videos publicados todavía.</p>";
 document.querySelectorAll("[data-video-hide]").forEach(b=>b.addEventListener("click",async()=>{try{await adminCall(sb.from("patoton_videos").update({is_public:b.dataset.visible!=="true"}).eq("id",b.dataset.videoHide));await loadAdminVideos();await loadPublicVideos();}catch(e){alert(e.message);}}));
 document.querySelectorAll("[data-video-delete]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm("¿Eliminar este video?"))return;try{const v=rows.find(x=>String(x.id)===b.dataset.videoDelete);if(v?.storage_path)await sb.storage.from("patoton-tv").remove([v.storage_path]);await adminCall(sb.from("patoton_videos").delete().eq("id",b.dataset.videoDelete));await loadAdminVideos();await loadPublicVideos();}catch(e){alert(e.message);}}));
}
$("#refreshVideos").addEventListener("click",()=>loadAdminVideos().catch(e=>alert(e.message)));
$("#videoForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!adminUser)return;
 const type=$("#videoType").value,title=$("#videoTitle").value.trim(),description=$("#videoDescription").value.trim();
 msg("videoStatus","Subiendo y publicando…");
 try{
  let payload={title,description,source_type:type,is_featured:$("#videoFeatured").checked,is_public:true,created_by:adminUser.id};
  if(type==="youtube"){
   const url=$("#videoYoutube").value.trim(),id=youtubeId(url);
   if(!id)throw new Error("Pega un enlace válido de YouTube.");
   payload.youtube_url=url;
  }else{
   const file=$("#videoFile").files[0];
   if(!file)throw new Error("Selecciona un archivo de video.");
   if(file.size>50*1024*1024)throw new Error("El archivo supera el límite de 50 MB.");
   const ext=(file.name.split(".").pop()||"mp4").toLowerCase(),path=`${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
   const {error}=await sb.storage.from("patoton-tv").upload(path,file,{contentType:file.type,upsert:false});
   if(error)throw error;payload.storage_path=path;
  }
  if(payload.is_featured)await adminCall(sb.from("patoton_videos").update({is_featured:false}));
  await adminCall(sb.from("patoton_videos").insert(payload));
  msg("videoStatus","¡Video publicado en PATOTÓN TV!");e.target.reset();$("#videoType").dispatchEvent(new Event("change"));await loadAdminVideos();await loadPublicVideos();
 }catch(err){msg("videoStatus",err.message||"No se pudo publicar el video.",true);}
});
async function loadAdminRaised(){
 const row=await adminCall(sb.from("patoton_raised_totals").select("*").eq("id",1).single());
 $("#raisedAmount").value=row.money_mxn||0;$("#raisedToyCount").value=row.toys||0;$("#raisedClothesCount").value=row.clothes||0;$("#raisedFoodCount").value=row.food||0;
}
$("#raisedForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!adminUser)return;
 const payload={money_mxn:Number($("#raisedAmount").value),toys:Number($("#raisedToyCount").value),clothes:Number($("#raisedClothesCount").value),food:Number($("#raisedFoodCount").value),updated_at:new Date().toISOString()};
 try{await adminCall(sb.from("patoton_raised_totals").update(payload).eq("id",1));msg("raisedStatus","¡Totales guardados y actualizados!");renderRaised({...payload});}
 catch(err){msg("raisedStatus",err.message,true);}
});

// Realtime updates: visitors see admin changes as soon as Supabase broadcasts them.
if(sb){
 sb.channel("patoton-public-live")
  .on("postgres_changes",{event:"UPDATE",schema:"public",table:"patoton_raised_totals"},payload=>renderRaised(payload.new))
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"patoton_videos"},()=>loadPublicVideos())
  .on("postgres_changes",{event:"UPDATE",schema:"public",table:"patoton_videos"},()=>loadPublicVideos())
  .on("postgres_changes",{event:"DELETE",schema:"public",table:"patoton_videos"},()=>loadPublicVideos())
  .subscribe();
}
