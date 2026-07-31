(() => {
  const D = window.PILATES_MAP_DATA;
  const map = L.map('map', { zoomControl: true }).setView(D.meta.center, D.meta.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);

  const groups = {
    candidates: L.layerGroup().addTo(map),
    competitors: L.layerGroup().addTo(map),
    anchors: L.layerGroup().addTo(map),
    rings: L.layerGroup().addTo(map),
    benchmark: L.layerGroup().addTo(map)
  };

  const markerIndex = new Map();
  let labelsOn = true;

  const googleUrl = (item) => {
    const query = item.googleQuery || `${item.lat},${item.lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const classForCandidate = score => score >= 80 ? 'marker-candidate-top' : score >= 75 ? 'marker-candidate-strong' : 'marker-candidate-watch';
  const scoreClass = score => score >= 80 ? 'top' : score >= 75 ? 'strong' : 'watch';

  function icon(kind, text = '') {
    const classes = kind === 'benchmark' ? 'marker-benchmark' : kind === 'competitor' ? 'marker-competitor' : kind === 'anchor' ? 'marker-anchor' : kind;
    const size = kind === 'benchmark' ? 27 : 20;
    return L.divIcon({
      className: '',
      html: `<div class="marker-icon ${classes}" style="width:${size}px;height:${size}px">${text}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }

  function popup(item, typeLabel) {
    const score = typeof item.score === 'number' ? `<div class="popup-score">Site score: ${item.score.toFixed(1)} / 100</div>` : '';
    return `
      <div class="popup-type">${typeLabel}</div>
      <div class="popup-title">${item.name}</div>
      ${score}
      <div class="popup-desc">${item.description || ''}</div>
      <div class="popup-precision">Location precision: ${item.precision || 'Representative'}</div>
      <div class="popup-actions">
        <a href="${googleUrl(item)}" target="_blank" rel="noopener">Open in Google Maps</a>
        <a class="secondary" href="#" onclick="navigator.clipboard && navigator.clipboard.writeText('${item.lat}, ${item.lng}');return false;">Copy coordinates</a>
      </div>`;
  }

  function bindLabel(marker, item, className = 'location-label') {
    marker.bindTooltip(item.name, { permanent: true, direction: 'top', offset: [0, -10], className });
  }

  const site = D.benchmark;
  const siteMarker = L.marker([site.lat, site.lng], { icon: icon('benchmark', 'A'), zIndexOffset: 1000 })
    .bindPopup(popup(site, 'Benchmark site'));
  bindLabel(siteMarker, site);
  siteMarker.addTo(groups.benchmark);
  markerIndex.set(site.id, siteMarker);

  [500, 1000, 2000].forEach((radius, i) => {
    L.circle([site.lat, site.lng], {
      radius,
      color: i === 0 ? '#c84d55' : '#7c8e87',
      weight: i === 0 ? 2 : 1.4,
      opacity: .62,
      fillOpacity: i === 0 ? .045 : .018,
      dashArray: i === 0 ? null : '6 7'
    }).bindTooltip(`${radius >= 1000 ? radius/1000 + ' km' : radius + ' m'} catchment`, { sticky: true }).addTo(groups.rings);
  });

  D.candidates.forEach(item => {
    const className = classForCandidate(item.score);
    const marker = L.marker([item.lat, item.lng], { icon: icon(className, item.rank ? String(item.rank) : 'V') })
      .bindPopup(popup(item, 'Candidate area'));
    bindLabel(marker, item);
    marker.addTo(groups.candidates);
    markerIndex.set(item.id, marker);
  });

  D.competitors.forEach(item => {
    const marker = L.marker([item.lat, item.lng], { icon: icon('competitor', 'P') })
      .bindPopup(popup(item, 'Pilates competitor'));
    bindLabel(marker, item);
    marker.addTo(groups.competitors);
    markerIndex.set(item.id, marker);
  });

  D.anchors.forEach(item => {
    if (item.id === 'site-a-center') return;
    const marker = L.marker([item.lat, item.lng], { icon: icon('anchor', '+') })
      .bindPopup(popup(item, item.category || 'Anchor'));
    bindLabel(marker, item);
    marker.addTo(groups.anchors);
    markerIndex.set(item.id, marker);
  });

  function setLabels(enabled) {
    labelsOn = enabled;
    markerIndex.forEach(marker => {
      const tooltip = marker.getTooltip();
      if (!tooltip) return;
      if (enabled) marker.openTooltip(); else marker.closeTooltip();
    });
  }

  function buildCandidateCards() {
    const list = document.getElementById('candidateList');
    const ordered = [...D.candidates].sort((a,b) => b.score - a.score || (a.rank ?? 99) - (b.rank ?? 99));
    ordered.forEach(item => {
      const el = document.createElement('article');
      el.className = 'candidate-card';
      el.dataset.id = item.id;
      el.dataset.name = item.name.toLowerCase();
      el.dataset.score = item.score;
      el.innerHTML = `
        <div class="rank-badge"><i class="dot ${scoreClass(item.score)}"></i>${item.rank ? '#' + item.rank : 'V'}</div>
        <div><div class="candidate-name">${item.name}</div><div class="candidate-tag">${item.tag}</div></div>
        <div class="candidate-score">${item.score.toFixed(1)} <small>/100</small></div>`;
      el.addEventListener('click', () => {
        const marker = markerIndex.get(item.id);
        map.setView([item.lat, item.lng], 15, { animate: true });
        marker.openPopup();
        if (labelsOn) marker.openTooltip();
      });
      list.appendChild(el);
    });
  }
  buildCandidateCards();

  const allLatLngs = [
    [site.lat, site.lng],
    ...D.candidates.map(x => [x.lat, x.lng]),
    ...D.competitors.map(x => [x.lat, x.lng]),
    ...D.anchors.map(x => [x.lat, x.lng])
  ];
  const allBounds = L.latLngBounds(allLatLngs);

  function applyFilters() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const minScore = Number(document.getElementById('scoreFilter').value);
    document.getElementById('scoreValue').textContent = minScore;

    let visible = 0;
    D.candidates.forEach(item => {
      const marker = markerIndex.get(item.id);
      const matches = item.score >= minScore && (!query || `${item.name} ${item.tag} ${item.description}`.toLowerCase().includes(query));
      const card = document.querySelector(`.candidate-card[data-id="${item.id}"]`);
      card.classList.toggle('hidden', !matches);
      if (matches) {
        if (!groups.candidates.hasLayer(marker)) groups.candidates.addLayer(marker);
        visible++;
      } else {
        groups.candidates.removeLayer(marker);
      }
    });
    document.getElementById('candidateCount').textContent = `${visible} shown`;

    // Competitor/anchor text search highlights without hiding normal layers unless a query is active.
    [...D.competitors, ...D.anchors].forEach(item => {
      const marker = markerIndex.get(item.id);
      if (!marker) return;
      if (query && `${item.name} ${item.description || ''}`.toLowerCase().includes(query)) {
        map.setView([item.lat,item.lng], 15);
        marker.openPopup();
      }
    });
    setLabels(labelsOn);
  }

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('scoreFilter').addEventListener('input', applyFilters);
  document.getElementById('showCandidates').addEventListener('change', e => e.target.checked ? groups.candidates.addTo(map) : map.removeLayer(groups.candidates));
  document.getElementById('showCompetitors').addEventListener('change', e => e.target.checked ? groups.competitors.addTo(map) : map.removeLayer(groups.competitors));
  document.getElementById('showAnchors').addEventListener('change', e => e.target.checked ? groups.anchors.addTo(map) : map.removeLayer(groups.anchors));
  document.getElementById('showRings').addEventListener('change', e => e.target.checked ? groups.rings.addTo(map) : map.removeLayer(groups.rings));
  document.getElementById('showLabels').addEventListener('change', e => setLabels(e.target.checked));
  document.getElementById('fitAll').addEventListener('click', () => map.fitBounds(allBounds.pad(.08)));
  document.getElementById('focusSite').addEventListener('click', () => { map.setView([site.lat, site.lng], 15); siteMarker.openPopup(); });
  document.getElementById('benchmarkCard').addEventListener('click', () => { map.setView([site.lat, site.lng], 16); siteMarker.openPopup(); });

  const sidebar = document.getElementById('sidebar');
  document.getElementById('mobileSidebarToggle').addEventListener('click', () => sidebar.classList.toggle('open'));

  map.fitBounds(allBounds.pad(.08));
  setTimeout(() => setLabels(true), 250);
  applyFilters();
})();
