(function () {
  "use strict";

  const site = window.STUDIO_SITE || {};
  const storageKeys = {
    profile: "sumitaPilatesProfile",
    reservations: "sumitaPilatesReservations",
    passes: "sumitaPilatesPasses",
    announcement: "sumitaPilatesAnnouncementClosed"
  };

  const memoryStore = {};
  const storage = {
    get(key) { try { return window.localStorage.getItem(key); } catch { return Object.prototype.hasOwnProperty.call(memoryStore,key) ? memoryStore[key] : null; } },
    set(key,value) { try { window.localStorage.setItem(key,value); } catch { memoryStore[key] = String(value); } },
    remove(key) { try { window.localStorage.removeItem(key); } catch { delete memoryStore[key]; } }
  };

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function safeJsonParse(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;
    try {
      const parsed = JSON.parse(value);
      return parsed === null || parsed === undefined ? fallback : parsed;
    } catch { return fallback; }
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return `${site.currency || "NPR"} ${amount.toLocaleString("en-IN")}`;
  }

  function formatDate(date, options) {
    return new Intl.DateTimeFormat("en-US", options || { weekday: "long", month: "long", day: "numeric" }).format(date);
  }

  function formatTime(time) {
    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date(2026, 0, 1, hours, minutes);
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  }

  function instructorById(id) {
    return (window.STUDIO_INSTRUCTORS || []).find(item => item.id === id) || {
      id: id || "unknown", name: "Instructor", initials: "IN", accent: "#d987b5"
    };
  }

  function localDateIso(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function scheduleInstances(days = 14) {
    const templates = window.STUDIO_SCHEDULE || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const instances = [];
    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      templates.filter(item => item.weekday === date.getDay()).forEach(item => {
        const [hour, minute] = item.time.split(":").map(Number);
        const start = new Date(date);
        start.setHours(hour, minute, 0, 0);
        const end = new Date(start.getTime() + item.duration * 60000);
        instances.push({
          ...item,
          instanceId: `${item.id}-${localDateIso(date)}`,
          date: new Date(date),
          dateIso: localDateIso(date),
          start,
          end
        });
      });
    }
    return instances.sort((a, b) => a.start - b.start);
  }

  function getProfile() {
    return safeJsonParse(storage.get(storageKeys.profile), null);
  }

  function saveProfile(profile) {
    storage.set(storageKeys.profile, JSON.stringify(profile));
  }

  function getReservations() {
    return safeJsonParse(storage.get(storageKeys.reservations), []);
  }

  function saveReservations(items) {
    storage.set(storageKeys.reservations, JSON.stringify(items));
  }

  function getPasses() {
    return safeJsonParse(storage.get(storageKeys.passes), []);
  }

  function savePasses(items) {
    storage.set(storageKeys.passes, JSON.stringify(items));
  }

  function reservationCount(instanceId) {
    return getReservations().filter(item => item.instanceId === instanceId && item.status === "Booked").length;
  }

  function availableSpots(instance) {
    return Math.max(0, instance.capacity - instance.booked - reservationCount(instance.instanceId));
  }

  function navLink(href, label, page, currentPage) {
    return `<a href="${href}" ${page === currentPage ? 'aria-current="page"' : ""}>${label}</a>`;
  }

  function injectChrome() {
    const page = document.body.dataset.page || "home";
    const rootPrefix = document.body.dataset.root || "";
    const path = name => `${rootPrefix}${name}`;
    document.title = `${document.title || page} | ${site.brandName || "Pilates Studio"}`;

    const headerHost = qs("#site-header");
    if (headerHost) {
      const announcementHidden = storage.get(storageKeys.announcement) === "1";
      headerHost.innerHTML = `
        ${announcementHidden ? "" : `<div class="announcement" id="announcementBar"><span>${site.announcement || ""}</span><button type="button" aria-label="Close announcement" id="closeAnnouncement">×</button></div>`}
        <header class="site-header">
          <div class="container nav-shell">
            <a class="brand" href="${path("index.html")}" aria-label="${site.brandName} home">
              <img src="${path("assets/images/logo-mark.svg")}" alt="" width="44" height="44">
              <span class="brand-copy"><strong>${site.brandName}</strong><span>${site.city}</span></span>
            </a>
            <nav class="desktop-nav" aria-label="Primary navigation">
              ${navLink(path("index.html"), "Home", "home", page)}
              ${navLink(path("schedule.html"), "Schedule", "schedule", page)}
              ${navLink(path("passes.html"), "Passes", "passes", page)}
              ${navLink(path("instructors.html"), "Instructors", "instructors", page)}
              ${navLink(path("about.html"), "About", "about", page)}
              ${navLink(path("contact.html"), "Contact", "contact", page)}
            </nav>
            <div class="nav-actions">
              <a class="button light small member-button" href="${path("member.html")}">Member area</a>
              <a class="button primary small book-button" href="${path("schedule.html")}">Book a class</a>
              <button class="menu-button" id="menuButton" type="button" aria-label="Open menu" aria-expanded="false"><span class="menu-lines"></span></button>
            </div>
          </div>
        </header>
        <div class="drawer-backdrop" id="drawerBackdrop"></div>
        <aside class="drawer" id="mobileDrawer" aria-hidden="true">
          <div class="drawer-head"><strong>${site.brandName}</strong><button class="drawer-close" id="drawerClose" type="button" aria-label="Close menu">×</button></div>
          <nav class="drawer-links" aria-label="Mobile navigation">
            ${navLink(path("index.html"), "Home", "home", page)}
            ${navLink(path("schedule.html"), "Schedule", "schedule", page)}
            ${navLink(path("passes.html"), "Purchase a pass", "passes", page)}
            ${navLink(path("instructors.html"), "Instructors", "instructors", page)}
            ${navLink(path("about.html"), "About the studio", "about", page)}
            ${navLink(path("contact.html"), "Contact", "contact", page)}
          </nav>
          <div class="drawer-actions">
            <a class="button light" href="${path("member.html")}">Sign in / Create account</a>
            <a class="button primary" href="${path("schedule.html")}">View schedule</a>
          </div>
        </aside>`;
    }

    const footerHost = qs("#site-footer");
    if (footerHost) {
      footerHost.innerHTML = `
        <footer class="site-footer">
          <div class="container">
            <div class="footer-grid">
              <div class="footer-brand">
                <a class="brand" href="${path("index.html")}" style="color:white">
                  <img src="${path("assets/images/logo-mark.svg")}" alt="" width="44" height="44">
                  <span class="brand-copy"><strong>${site.brandName}</strong><span style="color:rgba(255,255,255,.58)">${site.city}</span></span>
                </a>
                <p>${site.tagline} This is a static prototype designed for GitHub Pages and easy editing through separate data files.</p>
              </div>
              <div class="footer-column"><h3>Explore</h3><a href="${path("schedule.html")}">Schedule</a><a href="${path("passes.html")}">Passes</a><a href="${path("instructors.html")}">Instructors</a><a href="${path("member.html")}">Member area</a></div>
              <div class="footer-column"><h3>Studio</h3><span>${site.address}</span><span>${site.openingHours}</span><a href="mailto:${site.email}">${site.email}</a><a href="tel:${site.phoneRaw}">${site.phoneDisplay}</a></div>
              <div class="footer-column"><h3>Important</h3><a href="${path("about.html#faq")}">FAQ</a><a href="${path("docs/WHAT_IS_DEMO_VS_LIVE.md")}">Prototype notes</a><a href="${path("tools/data-editor.html")}">Owner data editor</a><span>Medical and payment functions are not live in this prototype.</span></div>
            </div>
            <div class="footer-bottom"><span>© <span id="footerYear"></span> ${site.brandName}. Prototype content—replace before launch.</span><span>Excel-backed planning · Static GitHub Pages front end</span></div>
          </div>
        </footer>`;
    }

    if (site.prototype) {
      const ribbon = document.createElement("div");
      ribbon.className = "prototype-ribbon";
      ribbon.textContent = "PROTOTYPE";
      document.body.appendChild(ribbon);
    }

    const footerYear = qs("#footerYear");
    if (footerYear) footerYear.textContent = new Date().getFullYear();

    qsa("[data-brand]").forEach(el => { el.textContent = site.brandName; });
    qsa("[data-city]").forEach(el => { el.textContent = site.city; });
    qsa("[data-email]").forEach(el => { el.textContent = site.email; });
    qsa("[data-phone]").forEach(el => { el.textContent = site.phoneDisplay; });
  }

  function bindChrome() {
    const button = qs("#menuButton");
    const drawer = qs("#mobileDrawer");
    const backdrop = qs("#drawerBackdrop");
    const close = qs("#drawerClose");
    const closeDrawer = () => {
      if (!drawer || !backdrop) return;
      drawer.classList.remove("open");
      backdrop.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      button?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("modal-open");
    };
    const openDrawer = () => {
      drawer?.classList.add("open");
      backdrop?.classList.add("open");
      drawer?.setAttribute("aria-hidden", "false");
      button?.setAttribute("aria-expanded", "true");
      document.body.classList.add("modal-open");
    };
    button?.addEventListener("click", openDrawer);
    close?.addEventListener("click", closeDrawer);
    backdrop?.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

    qs("#closeAnnouncement")?.addEventListener("click", () => {
      storage.set(storageKeys.announcement, "1");
      qs("#announcementBar")?.remove();
    });

    qsa(".faq-item button").forEach(buttonEl => {
      buttonEl.addEventListener("click", () => {
        const item = buttonEl.closest(".faq-item");
        item.classList.toggle("open");
        buttonEl.setAttribute("aria-expanded", item.classList.contains("open") ? "true" : "false");
      });
    });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      qsa(".reveal").forEach(el => observer.observe(el));
    } else {
      qsa(".reveal").forEach(el => el.classList.add("visible"));
    }
  }

  function ensureBookingModal() {
    if (qs("#bookingModal")) return;
    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "bookingModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="modal" role="document">
        <div class="modal-head">
          <div><h3 id="bookingModalTitle">Reserve a class</h3><p id="bookingModalSubtitle"></p></div>
          <button class="modal-close" type="button" data-close-modal aria-label="Close">×</button>
        </div>
        <div class="modal-body" id="bookingModalBody"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => { if (event.target === modal || event.target.matches("[data-close-modal]")) closeBookingModal(); });
  }

  function closeBookingModal() {
    const modal = qs("#bookingModal");
    modal?.classList.remove("open");
    document.body.classList.remove("modal-open");
  }

  function openBooking(instance) {
    ensureBookingModal();
    const spots = availableSpots(instance);
    const instructor = instructorById(instance.instructorId);
    const profile = getProfile() || {};
    const isWaitlist = spots <= 0;
    qs("#bookingModalTitle").textContent = isWaitlist ? "Join the waitlist" : "Reserve your spot";
    qs("#bookingModalSubtitle").textContent = `${instance.classType} · ${formatDate(instance.date)} · ${formatTime(instance.time)}`;
    qs("#bookingModalBody").innerHTML = `
      <div class="notice ${isWaitlist ? "" : "success"}">${isWaitlist ? "This class is currently full. Submit your details to join the prototype waitlist." : `${spots} spot${spots === 1 ? "" : "s"} currently available. Instructor: ${instructor.name}.`}</div>
      <form id="bookingForm" style="margin-top:18px">
        <div class="form-grid">
          <div class="field"><label for="bookName">Full name</label><input id="bookName" name="name" required autocomplete="name" value="${profile.name || ""}"></div>
          <div class="field"><label for="bookPhone">Phone</label><input id="bookPhone" name="phone" required autocomplete="tel" value="${profile.phone || ""}"></div>
          <div class="field full"><label for="bookEmail">Email</label><input id="bookEmail" name="email" type="email" required autocomplete="email" value="${profile.email || ""}"></div>
          <div class="field full"><label><input type="checkbox" name="healthAck" required> I will tell the instructor about relevant pain, injury, pregnancy or health concerns before class.</label></div>
        </div>
        <div class="modal-actions"><button class="button light" type="button" data-close-modal>Not now</button><button class="button primary" type="submit">${isWaitlist ? "Join waitlist" : "Confirm reservation"}</button></div>
      </form>`;
    const modal = qs("#bookingModal");
    modal.classList.add("open");
    document.body.classList.add("modal-open");
    qs("#bookingForm").addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const newProfile = { name: data.get("name"), phone: data.get("phone"), email: data.get("email") };
      saveProfile({ ...(getProfile() || {}), ...newProfile });
      const reservations = getReservations();
      const existing = reservations.find(item => item.instanceId === instance.instanceId && item.email === newProfile.email && item.status !== "Cancelled");
      if (!existing) {
        reservations.push({
          id: `RSV-${Date.now()}`,
          instanceId: instance.instanceId,
          templateId: instance.id,
          dateIso: instance.dateIso,
          time: instance.time,
          endTime: `${String(instance.end.getHours()).padStart(2,"0")}:${String(instance.end.getMinutes()).padStart(2,"0")}`,
          classType: instance.classType,
          location: instance.location,
          room: instance.room,
          instructorId: instance.instructorId,
          name: newProfile.name,
          email: newProfile.email,
          phone: newProfile.phone,
          status: isWaitlist ? "Waitlisted" : "Booked",
          createdAt: new Date().toISOString()
        });
        saveReservations(reservations);
      }
      const latest = getReservations().find(item => item.instanceId === instance.instanceId && item.email === newProfile.email && item.status !== "Cancelled");
      qs("#bookingModalTitle").textContent = isWaitlist ? "Waitlist request saved" : "Reservation saved";
      qs("#bookingModalSubtitle").textContent = "Prototype confirmation";
      qs("#bookingModalBody").innerHTML = `
        <div class="notice success"><strong>${isWaitlist ? "You are on the prototype waitlist." : "Your prototype reservation is confirmed."}</strong><br>This browser saved the reservation locally. A real launch needs a secure booking service or backend to email reminders and synchronise capacity across customers.</div>
        <div class="story-card" style="margin-top:18px;box-shadow:none">
          <strong>${latest.classType}</strong><p>${formatDate(new Date(`${latest.dateIso}T00:00:00`))} · ${formatTime(latest.time)} · ${latest.location}</p>
        </div>
        <div class="modal-actions"><button class="button light" type="button" id="downloadCalendar">Add to calendar</button><a class="button primary" href="member.html">View member area</a></div>`;
      qs("#downloadCalendar")?.addEventListener("click", () => downloadICS(latest));
      document.dispatchEvent(new CustomEvent("studio:reservationChanged"));
    });
    qsa("[data-close-modal]", modal).forEach(btn => btn.addEventListener("click", closeBookingModal));
  }

  function downloadICS(reservation) {
    const start = new Date(`${reservation.dateIso}T${reservation.time}:00`);
    const [endHour, endMinute] = reservation.endTime.split(":").map(Number);
    const end = new Date(start); end.setHours(endHour, endMinute, 0, 0);
    const toUtc = date => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const body = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sumita Pilates Prototype//EN", "BEGIN:VEVENT",
      `UID:${reservation.id}@sumita-pilates-prototype`, `DTSTAMP:${toUtc(new Date())}`,
      `DTSTART:${toUtc(start)}`, `DTEND:${toUtc(end)}`,
      `SUMMARY:${reservation.classType}`, `LOCATION:${reservation.location} - ${reservation.room || "Studio"}`,
      `DESCRIPTION:Prototype reservation. Please arrive early and contact the studio about any relevant health concerns.`,
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${reservation.classType.replace(/\s+/g,"-").toLowerCase()}-${reservation.dateIso}.ics`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  function purchasePass(pass) {
    const profile = getProfile();
    if (!profile) {
      window.location.href = `member.html?purchase=${encodeURIComponent(pass.id)}`;
      return;
    }
    const passes = getPasses();
    passes.push({
      id: `PASS-${Date.now()}`,
      passId: pass.id,
      name: pass.name,
      sessions: pass.sessions,
      remaining: pass.sessions,
      price: pass.price,
      purchasedAt: new Date().toISOString(),
      status: "Prototype pending payment"
    });
    savePasses(passes);
    alert(`${pass.name} was added to this browser as a prototype purchase. No payment was taken.`);
  }

  function cancelReservation(id) {
    const reservations = getReservations();
    const target = reservations.find(item => item.id === id);
    if (!target) return { ok: false, message: "Reservation not found." };
    const start = new Date(`${target.dateIso}T${target.time}:00`);
    const hours = (start - new Date()) / 3600000;
    if (hours < (site.bookingPolicy?.cancellationHours || 8)) {
      return { ok: false, message: `This prototype applies a ${site.bookingPolicy?.cancellationHours || 8}-hour cancellation window.` };
    }
    target.status = "Cancelled";
    target.cancelledAt = new Date().toISOString();
    saveReservations(reservations);
    document.dispatchEvent(new CustomEvent("studio:reservationChanged"));
    return { ok: true, message: "Reservation cancelled in this browser." };
  }

  function renderClassCard(instance, options = {}) {
    const instructor = instructorById(instance.instructorId);
    const spots = availableSpots(instance);
    const badgeClass = spots === 0 ? "full" : spots <= 2 ? "low" : "";
    const badgeText = spots === 0 ? "Class full · Waitlist available" : `${spots} spot${spots === 1 ? "" : "s"} left`;
    return `
      <article class="class-card accent-${instance.accent || "pink"}" data-instance-id="${instance.instanceId}">
        <div class="class-time"><strong>${formatTime(instance.time)}</strong><span>${instance.duration} minutes</span></div>
        <div class="class-main"><h3>${instance.classType}</h3><div class="class-meta"><span>◷ ${instance.duration} min</span><span>⌖ ${instance.location}</span><span>♙ ${instance.room}</span><span>${instance.level}</span></div><span class="spot-badge ${badgeClass}">${badgeText}</span></div>
        <div class="class-right"><div class="avatar" style="border-color:${instructor.accent}" title="${instructor.name}">${instructor.initials}</div>${options.hideButton ? "" : `<button class="button ${spots === 0 ? "light" : "primary"} small class-action" type="button" data-book-instance="${instance.instanceId}">${spots === 0 ? "Join waitlist" : "Book"}</button>`}</div>
      </article>`;
  }

  window.StudioApp = {
    site, storageKeys, storage, qs, qsa, formatCurrency, formatDate, formatTime, instructorById,
    localDateIso, scheduleInstances, getProfile, saveProfile, getReservations, saveReservations,
    getPasses, savePasses, availableSpots, openBooking, closeBookingModal, downloadICS,
    purchasePass, cancelReservation, renderClassCard
  };

  document.addEventListener("DOMContentLoaded", () => {
    injectChrome();
    bindChrome();
  });
})();
