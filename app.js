
const phone="584121605673";
const wa=(msg="Hola Takeo, quisiera información sobre la programación Américan Bully.") =>
  `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

document.addEventListener("click",e=>{
  const b=e.target.closest("[data-wa]");
  if(b){e.preventDefault(); location.href=wa(b.dataset.wa||undefined)}
  const burger=e.target.closest(".burger");
  if(burger) document.querySelector(".menu")?.classList.toggle("open");
});
document.querySelectorAll(".menu a").forEach(a=>a.addEventListener("click",()=>document.querySelector(".menu")?.classList.remove("open")));

const demoUsers = {
  "atleta@americanbully.com": {password:"atleta123", role:"ATLETA", name:"Atleta Demo"},
  "takeo@americanbully.com": {password:"takeo123", role:"COACH", name:"Takeo Iwamatsu"}
};

function login(e){
  e.preventDefault();
  const email=document.querySelector("#email").value.trim().toLowerCase();
  const password=document.querySelector("#password").value;
  const u=demoUsers[email];
  const msg=document.querySelector("#loginMsg");
  if(!u || u.password!==password){msg.className="error";msg.textContent="Acceso no autorizado. Verifica tus credenciales.";return}
  localStorage.setItem("ab_user",JSON.stringify(u));
  location.href=u.role==="COACH"?"coach-panel.html":"athlete.html";
}
function logout(){localStorage.removeItem("ab_user");location.href="index.html"}
function guard(role){
  const u=JSON.parse(localStorage.getItem("ab_user")||"null");
  if(!u || (role && u.role!==role)){location.href="login.html";return null}
  document.querySelectorAll("[data-name]").forEach(x=>x.textContent=u.name);
  return u;
}
function renderProgram(){
  const box=document.querySelector("#programTree"); if(!box)return;
  const data=JSON.parse(localStorage.getItem("ab_program")||"{}");
  if(Object.keys(data).length===0){
    box.innerHTML='<div class="notice">No hay entrenamientos publicados todavía. Takeo podrá crear meses, semanas y días desde el Panel de Coach.</div>';
    return;
  }
  box.innerHTML=Object.entries(data).map(([month,weeks])=>`<div class="card"><h3>${month}</h3>${
    Object.entries(weeks).map(([week,days])=>`<div style="margin-top:18px"><strong>${week}</strong>${
      Object.entries(days).map(([day,w])=>`<div class="row" style="margin-top:8px"><strong>${day}</strong><span>${w}</span></div>`).join("")
    }</div>`).join("")
  }</div>`).join("");
}
function saveWorkout(e){
 e.preventDefault();
 const month=document.querySelector("#month").value.trim(),week=document.querySelector("#week").value.trim(),
 day=document.querySelector("#day").value, workout=document.querySelector("#workout").value.trim();
 if(!month||!week||!workout)return;
 const data=JSON.parse(localStorage.getItem("ab_program")||"{}");
 data[month]??={}; data[month][week]??={}; data[month][week][day]=workout;
 localStorage.setItem("ab_program",JSON.stringify(data));
 document.querySelector("#coachMsg").textContent="Entrenamiento guardado en este prototipo.";
 document.querySelector("#workout").value=""; renderProgram();
}
