(function(){
  "use strict";
  const SESSION_KEY = "sumitaPilatesSession";

  function isSignedIn(){ return StudioApp.storage.get(SESSION_KEY) === "1" && !!StudioApp.getProfile(); }
  function signIn(){ StudioApp.storage.set(SESSION_KEY,"1"); render(); }
  function signOut(){ StudioApp.storage.remove(SESSION_KEY); render(); }

  function authView(){
    document.querySelector("#memberRoot").innerHTML = `
      <div class="auth-card">
        <div class="notice">This is a browser-only prototype. The demo login is <strong>sumita@example.com</strong> with PIN <strong>1234</strong>. Real accounts require a secure backend or booking provider.</div>
        <div class="auth-tabs" style="margin-top:20px"><button type="button" class="active" data-auth-tab="signin">Sign in</button><button type="button" data-auth-tab="create">Create account</button></div>
        <form id="signinForm">
          <div class="field"><label>Email</label><input type="email" name="email" value="sumita@example.com" required></div>
          <div class="field" style="margin-top:12px"><label>PIN</label><input type="password" name="pin" inputmode="numeric" value="1234" required></div>
          <button class="button primary" type="submit" style="width:100%;margin-top:18px">Sign in</button>
        </form>
        <form id="createForm" hidden>
          <div class="form-grid"><div class="field"><label>Full name</label><input name="name" required></div><div class="field"><label>Phone</label><input name="phone" required></div><div class="field full"><label>Email</label><input name="email" type="email" required></div><div class="field full"><label>Create a 4-digit PIN</label><input name="pin" type="password" pattern="[0-9]{4}" inputmode="numeric" required></div></div>
          <button class="button primary" type="submit" style="width:100%;margin-top:18px">Create browser account</button>
        </form>
        <p id="authMessage" style="color:var(--danger);margin-bottom:0"></p>
      </div>`;
    const signin = document.querySelector("#signinForm"), create = document.querySelector("#createForm");
    document.querySelectorAll("[data-auth-tab]").forEach(btn => btn.addEventListener("click", () => {
      document.querySelectorAll("[data-auth-tab]").forEach(x => x.classList.toggle("active", x === btn));
      const isSignin = btn.dataset.authTab === "signin"; signin.hidden = !isSignin; create.hidden = isSignin; document.querySelector("#authMessage").textContent = "";
    }));
    signin.addEventListener("submit", event => {
      event.preventDefault(); const data = new FormData(event.currentTarget); const email = String(data.get("email")).toLowerCase(); const pin = String(data.get("pin"));
      const saved = StudioApp.getProfile(); const demo = window.STUDIO_MEMBER_DEMO;
      if (email === demo.email && pin === demo.pin) {
        StudioApp.saveProfile({ ...demo.profile, email: demo.email, phone: "+977 980-000-0000", pin: demo.pin, demo: true }); signIn(); return;
      }
      if (saved && String(saved.email).toLowerCase() === email && String(saved.pin) === pin) { signIn(); return; }
      document.querySelector("#authMessage").textContent = "Email or PIN not recognised in this browser.";
    });
    create.addEventListener("submit", event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      StudioApp.saveProfile({ name:data.get("name"), phone:data.get("phone"), email:data.get("email"), pin:data.get("pin"), plan:"No active pass", sessionsRemaining:0, memberSince:new Date().toISOString().slice(0,10) }); signIn();
    });
  }

  function processPendingPurchase(){
    const params = new URLSearchParams(location.search); const id = params.get("purchase");
    if (!id || sessionStorage.getItem(`handled-${id}`)) return;
    const pass = (window.STUDIO_PASSES || []).find(item => item.id === id);
    if (pass) { StudioApp.purchasePass(pass); sessionStorage.setItem(`handled-${id}`,"1"); history.replaceState({},"",location.pathname); }
  }

  function dashboardView(){
    processPendingPurchase();
    const profile = StudioApp.getProfile(); const demo = window.STUDIO_MEMBER_DEMO;
    const reservations = StudioApp.getReservations().filter(item => item.status !== "Cancelled").sort((a,b) => `${a.dateIso}${a.time}`.localeCompare(`${b.dateIso}${b.time}`));
    const future = reservations.filter(item => new Date(`${item.dateIso}T${item.time}:00`) >= new Date());
    const passes = StudioApp.getPasses();
    const activePass = passes[passes.length-1];
    const sessionsRemaining = activePass ? activePass.remaining : (profile.sessionsRemaining ?? demo.profile.sessionsRemaining);
    const progress = demo.progress[demo.progress.length-1];
    const initials = String(profile.name || "Member").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
    document.querySelector("#memberRoot").innerHTML = `
      <div class="member-shell">
        <aside class="member-sidebar"><div class="member-avatar">${initials}</div><h3 style="margin-top:15px">${profile.name}</h3><p>${profile.email}<br>${activePass ? activePass.name : profile.plan || "No active pass"}</p><nav class="member-nav"><button class="active">Overview</button><a class="button ghost small" href="schedule.html">Book a class</a><button id="signOutButton">Sign out</button></nav></aside>
        <div>
          <div class="notice">Prototype member area: data is stored only in this browser. It is not a secure customer database and does not send real email reminders.</div>
          <div class="dashboard-grid" style="margin-top:20px">
            <article class="metric-card"><div class="metric-label">Sessions remaining</div><div class="metric-value">${sessionsRemaining}</div></article>
            <article class="metric-card"><div class="metric-label">Upcoming bookings</div><div class="metric-value">${future.length}</div></article>
            <article class="metric-card"><div class="metric-label">Goal progress</div><div class="metric-value">${progress.goal}%</div></article>
            <article class="metric-card"><div class="metric-label">Member since</div><div class="metric-value" style="font-size:1.25rem">${new Date(`${profile.memberSince || demo.profile.memberSince}T00:00:00`).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</div></article>
          </div>
          <section class="dashboard-panel"><div class="dashboard-panel-head"><div><h3>Upcoming reservations</h3><p style="color:var(--muted);margin:6px 0 0">Reservations made on this browser appear here.</p></div><a class="button primary small" href="schedule.html">Book</a></div><div class="reservation-list" id="reservationList"></div></section>
          <section class="dashboard-panel"><div class="dashboard-panel-head"><div><h3>Progress snapshot</h3><p style="color:var(--muted);margin:6px 0 0">Demo customer-facing metrics from the Excel progress model.</p></div><span class="tag">Week 4</span></div><div class="progress-bars">${["mobility","core","balance","posture","energy"].map(key => `<div class="progress-row"><strong>${key[0].toUpperCase()+key.slice(1)}</strong><div class="progress-track"><span style="width:${progress[key]*10}%"></span></div><span>${progress[key]}/10</span></div>`).join("")}</div></section>
          <section class="dashboard-panel"><div class="dashboard-panel-head"><div><h3>Instructor notes</h3><p style="color:var(--muted);margin:6px 0 0">Only client-approved notes should appear here in a live system.</p></div></div><ul class="check-list">${demo.notes.map(note => `<li>${note}</li>`).join("")}</ul></section>
          <section class="dashboard-panel"><div class="dashboard-panel-head"><div><h3>My passes</h3><p style="color:var(--muted);margin:6px 0 0">Prototype purchases are not paid transactions.</p></div><a class="button light small" href="passes.html">Purchase a pass</a></div>${passes.length ? passes.map(pass => `<div class="reservation-item"><div><strong>${pass.remaining}</strong><br><small>left</small></div><div><strong>${pass.name}</strong><br><span style="color:var(--muted)">${StudioApp.formatCurrency(pass.price)} · ${pass.status}</span></div></div>`).join("") : `<div class="empty-state"><p>No prototype pass purchases yet.</p></div>`}</section>
        </div>
      </div>`;
    document.querySelector("#signOutButton").addEventListener("click", signOut);
    renderReservations(future);
  }

  function renderReservations(items){
    const host = document.querySelector("#reservationList");
    if (!items.length) { host.innerHTML = `<div class="empty-state"><h3>No upcoming reservations</h3><p>Choose a class from the schedule to create a prototype reservation.</p></div>`; return; }
    host.innerHTML = items.map(item => `<article class="reservation-item"><div><strong>${StudioApp.formatTime(item.time)}</strong><br><small>${item.dateIso.slice(5)}</small></div><div><strong>${item.classType}</strong><br><span style="color:var(--muted)">${item.location} · ${item.status}</span></div><div class="reservation-actions"><button class="button light small" type="button" data-calendar="${item.id}">Calendar</button> <button class="button light small" type="button" data-cancel="${item.id}">Cancel</button></div></article>`).join("");
    host.querySelectorAll("[data-calendar]").forEach(btn => btn.addEventListener("click", () => StudioApp.downloadICS(items.find(x=>x.id===btn.dataset.calendar))));
    host.querySelectorAll("[data-cancel]").forEach(btn => btn.addEventListener("click", () => { const result = StudioApp.cancelReservation(btn.dataset.cancel); alert(result.message); if(result.ok) dashboardView(); }));
  }

  function render(){ if(isSignedIn()) dashboardView(); else authView(); }
  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("studio:reservationChanged", () => { if(isSignedIn()) dashboardView(); });
})();
