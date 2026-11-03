const products = [
  ['Silla Junco','Asientos','Madera curvada y fibra natural',3500,'#e7e4d5'],
  ['Mesa Olmo','Mesas','Mesa de comedor para 6 personas',22000,'#e5dfd3'],
  ['Florero Greda','Detalles','Cerámica mate, tono terracota',4500,'#eadfd5'],
  ['Banca Lenga','Asientos','Asiento corrido para 3 personas',12000,'#e0e5d9'],
  ['Mesa Nido','Mesas','Mesa auxiliar redonda de madera',8500,'#dedfd2'],
  ['Candelero Alba','Detalles','Latón cepillado con vela marfil',3000,'#eae4d2']
];
const byId = id => document.getElementById(id);
const money = n => new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP'}).format(n);
const quantities = products.map(()=>0);
let filter = 'Todos';
const grid = byId('grid');
const preview = byId('preview');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const reveal = new IntersectionObserver(entries=>{
  for(const entry of entries){
    if(!entry.isIntersecting)continue;
    if(!motionPreference.matches){
      entry.target.animate(
        [{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:650,delay:Number(entry.target.dataset.index || 0)%3*70,easing:'cubic-bezier(.2,.7,.2,1)',fill:'backwards'}
      );
    }
    reveal.unobserve(entry.target);
  }
},{threshold:.12});
function drawCatalog(){
  for(const card of grid.children)reveal.unobserve(card);
  grid.replaceChildren();
  products.forEach(([name,category,detail,price,color],i)=>{
    if(filter!=='Todos' && filter!==category) return;
    const card=document.createElement('article');
    card.className='card'; card.dataset.index=i;
    card.style.setProperty('--swatch',color);
    card.innerHTML=`<div class="plate"><span class="sku">F—0${i+1}</span><img loading="lazy" width="512" height="512" src="pieza-${i+1}.jpg" alt="${name}"></div><div class="details"><h3>${name}</h3></div><p class="desc">${detail}</p><div class="bottom"><span class="price">${money(price)} / día</span><div class="control"><button type="button" data-change="-1" aria-label="Quitar una unidad de ${name}">−</button><input type="number" min="0" max="999" step="1" inputmode="numeric" aria-label="Cantidad de ${name}" value="${quantities[i]}"><button type="button" data-change="1" aria-label="Agregar una unidad de ${name}">+</button></div></div>`;
    grid.append(card);
    reveal.observe(card);
  });
  update();
}
function update(){
  const count=quantities.reduce((a,b)=>a+b,0);
  const badge=byId('badge');
  const changed=badge.textContent!==String(count);
  badge.textContent=count;
  if(changed && !motionPreference.matches){
    for(const animation of badge.getAnimations())animation.cancel();
    badge.animate(
      [{transform:'scale(1)'},{transform:'scale(1.3)',offset:.4},{transform:'scale(1)'}],
      {duration:340,easing:'ease-out'}
    );
  }
  const rows=byId('lines'); rows.replaceChildren();
  let total=0;
  products.forEach(([name,,,price],i)=>{
    if(!quantities[i])return;
    const row=document.createElement('div');
    row.className='row';
    const label=document.createElement('span'); label.textContent=quantities[i]+' × '+name;
    const amount=document.createElement('span'); amount.textContent=money(quantities[i]*price);
    row.append(label,amount); rows.append(row);total+=quantities[i]*price;
  });
  if(!count) rows.textContent='Tu selección está vacía. Agrega una pieza del catálogo.';
  byId('total').textContent=money(total);
  for(const card of grid.children){
    const q=quantities[Number(card.dataset.index)];
    card.classList.toggle("chosen",q>0);
    card.querySelector('[data-change="-1"]').disabled=q===0;
    card.querySelector('[data-change="1"]').disabled=q===999;
  }
}
grid.addEventListener('click',e=>{
  const button=e.target.closest('[data-change]');if(!button)return;
  const card=button.closest('article'),i=Number(card.dataset.index);
  quantities[i]=Math.min(999,Math.max(0,quantities[i]+Number(button.dataset.change)));
  card.querySelector('input').value=quantities[i];
  card.classList.remove('bump');void card.offsetWidth;card.classList.add('bump');
  update();byId('live').textContent=products[i][0]+', cantidad '+quantities[i];
});
grid.addEventListener('input',e=>{
  if(!e.target.matches('input'))return;
  const i=Number(e.target.closest('article').dataset.index);
  const value=Math.min(999,Math.max(0,Math.trunc(Number(e.target.value)||0)));
  quantities[i]=value;
  if(e.target.value!=='')e.target.value=value;
  update();
});
grid.addEventListener('focusout',e=>{if(e.target.matches('input') && !e.target.value)e.target.value=0;});
document.querySelector('.filters').addEventListener('click',e=>{
  const button=e.target.closest('[data-filter]');if(!button)return;
  filter=button.dataset.filter;
  for(const item of button.parentElement.children)item.setAttribute('aria-pressed',String(item===button));
  drawCatalog();byId('live').textContent=grid.children.length+' piezas visibles';
});
const dateInput=byId('date');
const localISO=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
dateInput.min=localISO(new Date());
byId('example').onclick=()=>{
  quantities.fill(0);quantities[0]=30;quantities[1]=5;
  const next=new Date();next.setDate(next.getDate()+7);dateInput.value=localISO(next);
  byId('town').value='Providencia'; drawCatalog();
  byId('live').textContent='Ejemplo cargado. 30 sillas y 5 mesas.';
  byId('form').querySelector('[type=submit]').focus();
};
byId('form').onsubmit=e=>{
  e.preventDefault();
  if(!quantities.some(Boolean)){byId('live').textContent='Agrega una pieza antes de cotizar.';grid.querySelector('[data-change="1"]').focus();return;}
  const town=byId('town'); if(!town.value.trim()){town.value='';town.reportValidity();return;}
  const date=new Intl.DateTimeFormat('es-CL',{dateStyle:'long'}).format(new Date(dateInput.value+'T12:00:00'));
  const lines=products.flatMap(([name,,,price],i)=>quantities[i]?[quantities[i]+' × '+name+' · '+money(price*quantities[i])]:[]);
  const msg=['Demo Forma · Solicitud de cotización','Evento del '+date+' en '+town.value.trim(),'',...lines,'','Subtotal de muestra: '+byId('total').textContent+' CLP por jornada.','Despacho por cotizar.'].join('\n');
  byId('message').textContent=msg;byId('whatsapp').href='https://wa.me/?text='+encodeURIComponent(msg);
  byId('copy-status').textContent='En WhatsApp eliges el destinatario antes de enviar.';preview.showModal();
};
byId('close').onclick=()=>preview.close();
byId('copy').onclick=async()=>{
  try {await navigator.clipboard.writeText(byId('message').textContent);byId('copy-status').textContent='Mensaje copiado.';}
  catch {const range=document.createRange();range.selectNodeContents(byId('message'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);byId('copy-status').textContent='Texto seleccionado. Usa la opción Copiar de tu navegador.';}
};
drawCatalog();

/* Compositions use the same product order and prices as the catalogue. */
const arrangements = [
  {title:'Almuerzo en el patio',guests:12,description:'Dos mesas, flores bajas y sillas de junco para conversar sin apuro.',units:[12,2,2,0,0,0]},
  {title:'Cena de celebración',guests:30,description:'Cinco mesas de seis puestos, con una luz de vela en cada mesa.',units:[30,5,0,0,0,5]}
];
const scenes=document.getElementById('scenes');
function tablePlan(tableCount){
  const table='<rect x="-12" y="-7" width="24" height="14" rx="2" fill="currentColor" opacity=".85"/>'+[-8,0,8].map(x=>[-11,11].map(y=>`<circle cx="${x}" cy="${y}" r="2.2" fill="currentColor"/>`).join('')).join('');
  const coords=tableCount===2?[[37,34],[77,34]]:[[24,18],[59,18],[94,18],[41,47],[76,47]];
  return `<svg aria-hidden="true" viewBox="0 0 118 66">${coords.map(([x,y])=>`<g transform="translate(${x} ${y})">${table}</g>`).join('')}</svg>`;
}
arrangements.forEach(({title,guests,description,units},index)=>{
  const card=document.createElement('article');card.className='scene';
  const subtotal=units.reduce((sum,q,i)=>sum+q*products[i][3],0);
  card.innerHTML=`<div class="plan">${tablePlan(units[1])}</div><div class="scene-info"><small>MONTAJE 0${index+1} · ${guests} PERSONAS</small><h3>${title}</h3><p>${description}</p><div class="scene-action"><span>${money(subtotal)} / día</span><button class="linkbtn" type="button">Usar montaje <span aria-hidden="true">↗</span></button></div></div>`;
  card.querySelector('button').addEventListener('click',()=>{
    units.forEach((q,i)=>quantities[i]=q);drawCatalog();
    byId('live').textContent=title+' cargado en tu selección.';
    byId('cotizar').scrollIntoView();dateInput.focus({preventScroll:true});
  });scenes.append(card);
  reveal.observe(card);
});
