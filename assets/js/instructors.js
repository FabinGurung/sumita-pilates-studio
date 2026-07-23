(function(){
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#instructorGrid").innerHTML = (window.STUDIO_INSTRUCTORS || []).map(person => `
      <article class="instructor-card reveal"><div class="instructor-portrait" style="border-color:${person.accent}">${person.initials}</div><h3>${person.name}</h3><div class="instructor-role">${person.role}</div><p>${person.bio}</p><h4>Training & focus</h4><ul class="check-list">${person.qualifications.map(item => `<li>${item}</li>`).join("")}</ul><div class="tag-row">${person.specialties.map(tag => `<span class="tag">${tag}</span>`).join("")}</div></article>`).join("");
  });
})();
