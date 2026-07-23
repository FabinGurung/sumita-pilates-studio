(function(){
  "use strict";
  const app = () => window.StudioApp;

  function render() {
    const site = window.STUDIO_SITE;
    const heroTitle = document.querySelector("#heroTitle");
    if (heroTitle) heroTitle.textContent = site.heroTitle;
    document.querySelector("#heroText").textContent = site.heroText;
    document.querySelector("#heroCity").textContent = site.city;
    document.querySelector("#heroHours").textContent = site.openingHours;

    document.querySelector("#featureGrid").innerHTML = site.highlights.map(item => `
      <article class="feature-card reveal"><div class="feature-icon">${({reformer:"↔",heart:"♡",chart:"↗",community:"◉"})[item.icon] || "•"}</div><h3>${item.title}</h3><p>${item.text}</p></article>`).join("");

    document.querySelector("#journeyGrid").innerHTML = site.journey.map(item => `
      <article class="journey-card reveal"><div class="journey-step">${item.step}</div><h3>${item.title}</h3><p>${item.text}</p></article>`).join("");

    const instances = app().scheduleInstances(8).slice(0, 4);
    document.querySelector("#schedulePreview").innerHTML = instances.map(item => app().renderClassCard(item)).join("");
    bindBookings(instances);

    const passes = (window.STUDIO_PASSES || []).slice(0,3);
    document.querySelector("#passPreview").innerHTML = passes.map((pass, index) => `
      <article class="pass-card reveal ${index === 1 ? "featured" : ""}"><span class="pass-badge">${pass.badge}</span><h3 style="margin-top:18px">${pass.name}</h3><div class="pass-price">${app().formatCurrency(pass.price)} <small>/ ${pass.validityDays} days</small></div><p>${pass.description}</p><ul>${pass.features.map(f => `<li>${f}</li>`).join("")}</ul><a class="button ${index === 1 ? "primary" : "light"}" href="passes.html">View pass details</a></article>`).join("");

    document.querySelector("#instructorPreview").innerHTML = (window.STUDIO_INSTRUCTORS || []).slice(0,3).map(person => `
      <article class="instructor-card reveal"><div class="instructor-portrait" style="border-color:${person.accent}">${person.initials}</div><h3>${person.name}</h3><div class="instructor-role">${person.role}</div><p>${person.bio}</p><div class="tag-row">${person.specialties.map(tag => `<span class="tag">${tag}</span>`).join("")}</div></article>`).join("");

    document.querySelector("#testimonialGrid").innerHTML = site.testimonials.map(item => `
      <article class="quote-card reveal"><blockquote>“${item.quote}”</blockquote><strong>${item.name}</strong><span>${item.detail}</span></article>`).join("");
  }

  function bindBookings(instances) {
    document.querySelectorAll("[data-book-instance]").forEach(button => {
      button.addEventListener("click", () => {
        const instance = instances.find(item => item.instanceId === button.dataset.bookInstance);
        if (instance) app().openBooking(instance);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", render);
})();
