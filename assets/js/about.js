(function(){
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const host = document.querySelector("#faqList");
    host.innerHTML = (window.STUDIO_SITE.faq || []).map((item,index) => `<article class="faq-item"><button type="button" aria-expanded="false"><span>${item.q}</span><span>＋</span></button><div class="faq-answer">${item.a}</div></article>`).join("");
    host.querySelectorAll(".faq-item button").forEach(button => button.addEventListener("click", () => {
      const item = button.closest(".faq-item"); item.classList.toggle("open"); button.setAttribute("aria-expanded", item.classList.contains("open"));
    }));
  });
})();
