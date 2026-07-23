(function(){
  "use strict";
  function render(){
    const passes = window.STUDIO_PASSES || [];
    document.querySelector("#passGrid").innerHTML = passes.map((pass,index) => `
      <article class="pass-card reveal ${pass.id === "monthly-8" ? "featured" : ""}">
        <span class="pass-badge">${pass.badge}</span><h3 style="margin-top:18px">${pass.name}</h3>
        <div class="pass-price">${StudioApp.formatCurrency(pass.price)} <small>/ ${pass.validityDays} days</small></div>
        <p>${pass.description}</p><ul>${pass.features.map(item => `<li>${item}</li>`).join("")}</ul>
        <button class="button ${pass.id === "monthly-8" ? "primary" : "light"}" type="button" data-purchase-pass="${pass.id}">Choose this pass</button>
      </article>`).join("");
    document.querySelectorAll("[data-purchase-pass]").forEach(button => button.addEventListener("click", () => {
      const pass = passes.find(item => item.id === button.dataset.purchasePass);
      StudioApp.purchasePass(pass);
    }));
  }
  document.addEventListener("DOMContentLoaded", render);
})();
