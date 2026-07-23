(function(){
  "use strict";
  let site = JSON.parse(JSON.stringify(window.STUDIO_SITE));
  let schedule = JSON.parse(JSON.stringify(window.STUDIO_SCHEDULE));
  let passes = JSON.parse(JSON.stringify(window.STUDIO_PASSES));

  const download = (filename, content) => {
    const blob = new Blob([content], {type:"text/javascript;charset=utf-8"}); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };
  const jsFile = (globalName,obj) => `window.${globalName} = ${JSON.stringify(obj,null,2)};\n`;

  function sitePanel(){
    document.querySelector("#editorPanel").innerHTML = `<h2 style="font-size:2rem">Business details</h2><p>Change the visible brand information, then download a replacement <code>site-data.js</code>.</p><div class="form-grid" id="siteForm">
      ${[["brandName","Business name"],["tagline","Tagline"],["city","City"],["address","Address"],["email","Email"],["phoneDisplay","Displayed phone"],["phoneRaw","Phone link"],["whatsappRaw","WhatsApp number"],["openingHours","Opening hours"],["announcement","Announcement"]].map(([key,label]) => `<div class="field ${["tagline","address","openingHours","announcement"].includes(key)?"full":""}"><label>${label}</label><input data-site-field="${key}" value="${String(site[key]||"").replace(/"/g,"&quot;")}"></div>`).join("")}</div><div class="modal-actions"><button class="button primary" id="downloadSite">Download site-data.js</button></div>`;
    document.querySelectorAll("[data-site-field]").forEach(input => input.addEventListener("input",()=>site[input.dataset.siteField]=input.value));
    document.querySelector("#downloadSite").addEventListener("click",()=>download("site-data.js",jsFile("STUDIO_SITE",site)));
  }

  function schedulePanel(){
    const instructorOptions = (window.STUDIO_INSTRUCTORS||[]).map(i=>`<option value="${i.id}">${i.name}</option>`).join("");
    document.querySelector("#editorPanel").innerHTML = `<h2 style="font-size:2rem">Weekly schedule</h2><p>Edit rows, add a class or delete one. Download the replacement file when finished.</p><div style="overflow:auto"><table class="editor-table"><thead><tr><th>Day</th><th>Time</th><th>Class</th><th>Level</th><th>Instructor</th><th>Capacity</th><th>Booked demo</th><th></th></tr></thead><tbody id="scheduleRows"></tbody></table></div><div class="modal-actions"><button class="button light" id="addClass">Add row</button><button class="button primary" id="downloadSchedule">Download schedule-data.js</button></div>`;
    renderScheduleRows(instructorOptions);
    document.querySelector("#addClass").addEventListener("click",()=>{ schedule.push({id:`class-${Date.now()}`,weekday:0,time:"07:00",duration:50,location:"Pokhara Studio",room:"Studio A",classType:"Reformer All Levels",level:"All Levels",instructorId:"maya",capacity:8,booked:0,accent:"pink"}); renderScheduleRows(instructorOptions); });
    document.querySelector("#downloadSchedule").addEventListener("click",()=>download("schedule-data.js",jsFile("STUDIO_SCHEDULE",schedule)));
  }

  function renderScheduleRows(instructorOptions){
    const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const body=document.querySelector("#scheduleRows"); body.innerHTML=schedule.map((row,index)=>`<tr><td><select data-i="${index}" data-k="weekday">${days.map((d,i)=>`<option value="${i}" ${i===row.weekday?"selected":""}>${d}</option>`).join("")}</select></td><td><input type="time" data-i="${index}" data-k="time" value="${row.time}"></td><td><input data-i="${index}" data-k="classType" value="${row.classType}"></td><td><input data-i="${index}" data-k="level" value="${row.level}"></td><td><select data-i="${index}" data-k="instructorId">${instructorOptions.replace(`value="${row.instructorId}"`,`value="${row.instructorId}" selected`)}</select></td><td><input type="number" min="1" data-i="${index}" data-k="capacity" value="${row.capacity}"></td><td><input type="number" min="0" data-i="${index}" data-k="booked" value="${row.booked}"></td><td><button class="button light small" data-remove="${index}">Delete</button></td></tr>`).join("");
    body.querySelectorAll("[data-i]").forEach(input=>input.addEventListener("input",()=>{ const i=Number(input.dataset.i),k=input.dataset.k; schedule[i][k]=["weekday","capacity","booked"].includes(k)?Number(input.value):input.value; }));
    body.querySelectorAll("[data-remove]").forEach(btn=>btn.addEventListener("click",()=>{ schedule.splice(Number(btn.dataset.remove),1); renderScheduleRows(instructorOptions); }));
  }

  function passesPanel(){
    document.querySelector("#editorPanel").innerHTML = `<h2 style="font-size:2rem">Passes and pricing</h2><p>Sample prices came from the Excel planning model and must be approved before launch.</p><div style="overflow:auto"><table class="editor-table"><thead><tr><th>Name</th><th>Price NPR</th><th>Sessions</th><th>Validity</th><th>Badge</th></tr></thead><tbody>${passes.map((p,i)=>`<tr><td><input data-pi="${i}" data-pk="name" value="${p.name}"></td><td><input type="number" data-pi="${i}" data-pk="price" value="${p.price}"></td><td><input type="number" data-pi="${i}" data-pk="sessions" value="${p.sessions}"></td><td><input type="number" data-pi="${i}" data-pk="validityDays" value="${p.validityDays}"></td><td><input data-pi="${i}" data-pk="badge" value="${p.badge}"></td></tr>`).join("")}</tbody></table></div><div class="modal-actions"><button class="button primary" id="downloadPasses">Download passes-data.js</button></div>`;
    document.querySelectorAll("[data-pi]").forEach(input=>input.addEventListener("input",()=>{ const i=Number(input.dataset.pi),k=input.dataset.pk; passes[i][k]=["price","sessions","validityDays"].includes(k)?Number(input.value):input.value; }));
    document.querySelector("#downloadPasses").addEventListener("click",()=>download("passes-data.js",jsFile("STUDIO_PASSES",passes)));
  }

  function show(name){ document.querySelectorAll("[data-editor-tab]").forEach(btn=>btn.classList.toggle("active",btn.dataset.editorTab===name)); if(name==="site")sitePanel(); if(name==="schedule")schedulePanel(); if(name==="passes")passesPanel(); }
  document.addEventListener("DOMContentLoaded",()=>{ document.querySelectorAll("[data-editor-tab]").forEach(btn=>btn.addEventListener("click",()=>show(btn.dataset.editorTab))); show("site"); });
})();
