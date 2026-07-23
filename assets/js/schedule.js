(function(){
  "use strict";
  let allInstances = [];

  function unique(values){ return [...new Set(values)].sort(); }
  function optionList(items, allLabel){ return `<option value="">${allLabel}</option>` + items.map(v => `<option value="${v}">${v}</option>`).join(""); }

  function setupFilters(){
    allInstances = StudioApp.scheduleInstances(21);
    document.querySelector("#locationFilter").innerHTML = optionList(unique(allInstances.map(x => x.location)), "All locations");
    document.querySelector("#classFilter").innerHTML = optionList(unique(allInstances.map(x => x.classType)), "All classes");
    document.querySelector("#instructorFilter").innerHTML = optionList(unique(allInstances.map(x => StudioApp.instructorById(x.instructorId).name)), "All instructors");
    ["locationFilter","classFilter","instructorFilter"].forEach(id => document.querySelector(`#${id}`).addEventListener("change", render));
    document.querySelector("#clearFilters").addEventListener("click", () => {
      ["locationFilter","classFilter","instructorFilter"].forEach(id => document.querySelector(`#${id}`).value = "");
      render();
    });
  }

  function render(){
    const location = document.querySelector("#locationFilter").value;
    const classType = document.querySelector("#classFilter").value;
    const instructorName = document.querySelector("#instructorFilter").value;
    const filtered = allInstances.filter(item =>
      (!location || item.location === location) &&
      (!classType || item.classType === classType) &&
      (!instructorName || StudioApp.instructorById(item.instructorId).name === instructorName)
    );
    const groups = filtered.reduce((acc,item) => {
      (acc[item.dateIso] ||= []).push(item); return acc;
    },{});
    const host = document.querySelector("#scheduleList");
    if (!filtered.length) { host.innerHTML = `<div class="empty-state"><h3>No classes match those filters</h3><p>Clear a filter and try again.</p></div>`; return; }
    host.innerHTML = Object.entries(groups).map(([dateIso, items]) => {
      const date = new Date(`${dateIso}T00:00:00`);
      const isToday = StudioApp.localDateIso(new Date()) === dateIso;
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
      const isTomorrow = StudioApp.localDateIso(tomorrow) === dateIso;
      return `<section class="day-group"><div class="day-heading"><h3>${StudioApp.formatDate(date,{month:"long",day:"numeric"})}</h3><span>${StudioApp.formatDate(date,{weekday:"long"})}${isToday ? " · TODAY" : isTomorrow ? " · TOMORROW" : ""}</span></div>${items.map(item => StudioApp.renderClassCard(item)).join("")}</section>`;
    }).join("");
    host.querySelectorAll("[data-book-instance]").forEach(button => button.addEventListener("click", () => {
      const instance = allInstances.find(item => item.instanceId === button.dataset.bookInstance);
      StudioApp.openBooking(instance);
    }));
  }

  document.addEventListener("DOMContentLoaded", () => { setupFilters(); render(); });
  document.addEventListener("studio:reservationChanged", render);
})();
