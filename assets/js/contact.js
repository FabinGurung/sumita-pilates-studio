(function(){
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const site = window.STUDIO_SITE;
    const emailLink = document.querySelector("#contactEmail"); emailLink.textContent = site.email; emailLink.href = `mailto:${site.email}`;
    const phoneLink = document.querySelector("#contactPhone"); phoneLink.textContent = site.phoneDisplay; phoneLink.href = `tel:${site.phoneRaw}`;
    const whatsapp = document.querySelector("#contactWhatsapp"); whatsapp.href = `https://wa.me/${site.whatsappRaw}?text=${encodeURIComponent("Hello, I would like to know more about your Pilates classes.")}`;
    document.querySelector("#contactAddress").textContent = site.address;
    document.querySelector("#contactHours").textContent = site.openingHours;
    document.querySelector("#contactForm").addEventListener("submit", event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      const subject = encodeURIComponent(`Pilates enquiry from ${data.get("name")}`);
      const body = encodeURIComponent(`Name: ${data.get("name")}\nPhone: ${data.get("phone")}\nInterest: ${data.get("interest")}\n\n${data.get("message")}`);
      window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
    });
  });
})();
