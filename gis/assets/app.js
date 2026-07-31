(() => {
  'use strict';

  const D = window.PILATES_MAP_DATA;
  const mapEl = document.getElementById('map');
  const statusEl = document.getElementById('mapStatus');

  if (!window.L || !D || !mapEl) {
    if (statusEl) {
      statusEl.textContent = 'Map failed to initialize';
      statusEl.classList.add('warning');
    }

    console.error(
      'GIS initialization failed: Leaflet, map data or map element is missing.'
    );
    return;
  }

  /*
   * These locations are deliberately treated as Valley comparators rather
   * than Kathmandu Metropolitan City candidates.
   */
  const externalBenchmarkIds = new Set([
    'sanepa-jhamsikhel',
    'jawalakhel-pulchowk'
  ]);

  const isExternalBenchmark = item =>
    externalBenchmarkIds.has(item.id);

  /*
   * MAP INITIALIZATION
   */
  const map = L.map('map', {
    zoomControl: true,
    preferCanvas: false
  }).setView(D.meta.center, D.meta.zoom);

  /*
   * OpenStreetMap standard tile layer.
   *
   * We deliberately use tile.openstreetmap.org rather than the older
   * {s}.tile.openstreetmap.org pattern.
   */
  const tiles = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }
  );

  let tileFailures = 0;
  let tileSuccesses = 0;

  tiles.on('tileload', () => {
    tileSuccesses += 1;

    if (tileSuccesses >= 2 && statusEl) {
      statusEl.textContent = 'Map ready';
      statusEl.classList.remove('warning');
      statusEl.classList.add('ready');
    }
  });

  tiles.on('tileerror', () => {
    tileFailures += 1;

    if (statusEl && tileFailures >= 2) {
      statusEl.textContent = 'Some base-map tiles could not load';
      statusEl.classList.remove('ready');
      statusEl.classList.add('warning');
    }
  });

  tiles.addTo(map);

  L.control.scale({
    imperial: false,
    position: 'bottomright'
  }).addTo(map);

  /*
   * MAP LAYERS
   */
  const groups = {
    candidates: L.layerGroup().addTo(map),
    competitors: L.layerGroup().addTo(map),
    anchors: L.layerGroup().addTo(map),
    buffers: L.layerGroup().addTo(map),
    benchmark: L.layerGroup().addTo(map)
  };

  /*
   * Marker lookup tables allow the sidebar and filters to control markers.
   */
  const markerIndex = new Map();
  const markerMeta = new Map();

  let labelsOn = true;

  /*
   * GOOGLE MAPS LINK
   */
  const googleUrl = item => {
    const query =
      item.googleQuery ||
      `${item.lat},${item.lng}`;

    return (
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(query)
    );
  };

  /*
   * SCREENING SCORE DISPLAY CLASSES
   */
  const classForCandidate = score =>
    score >= 80
      ? 'marker-candidate-top'
      : score >= 75
        ? 'marker-candidate-strong'
        : 'marker-candidate-watch';

  const scoreClass = score =>
    score >= 80
      ? 'top'
      : score >= 75
        ? 'strong'
        : 'watch';

  /*
   * Convert our coordinate-precision note into a clearer evidence class.
   *
   * This does NOT claim that every listing itself is independently verified.
   * It describes how confidently the marker has been spatially located.
   */
  const evidenceLabel = item => {
    const precision = String(item.precision || '').toLowerCase();

    if (
      precision.includes('exact user-provided') ||
      precision === 'exact'
    ) {
      return 'Exact project point';
    }

    if (precision.includes('published')) {
      return 'Published location';
    }

    if (precision.includes('decoded from current plus code')) {
      return 'Current listing / decoded point';
    }

    if (precision.includes('approximate')) {
      return 'Approximate listing location';
    }

    if (precision.includes('representative')) {
      return 'Screening centroid';
    }

    return 'Research location';
  };

  /*
   * CUSTOM MARKER ICON
   */
  function icon(kind, text = '') {
    const classes =
      kind === 'benchmark'
        ? 'marker-benchmark'
        : kind === 'competitor'
          ? 'marker-competitor'
          : kind === 'anchor'
            ? 'marker-anchor'
            : kind;

    const size =
      kind === 'benchmark'
        ? 27
        : 20;

    return L.divIcon({
      className: '',
      html:
        `<div class="marker-icon ${classes}" ` +
        `style="width:${size}px;height:${size}px">` +
        `${text}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  }

  /*
   * POPUP CONTENT
   */
  function popup(item, typeLabel) {
    const score =
      typeof item.score === 'number'
        ? (
          `<div class="popup-score">` +
          `Area screening score: ${item.score.toFixed(1)} / 100` +
          `</div>`
        )
        : '';

    const propertyNote =
      item.id === 'site-a-lazimpat'
        ? (
          '<div class="popup-evidence">' +
          'Property suitability: pending site survey' +
          '</div>'
        )
        : '';

    return `
      <div class="popup-type">${typeLabel}</div>

      <div class="popup-title">
        ${item.name}
      </div>

      ${score}

      <div class="popup-desc">
        ${item.description || ''}
      </div>

      <div class="popup-precision">
        Coordinate precision:
        ${item.precision || 'Representative'}
      </div>

      <div class="popup-evidence">
        Evidence class:
        ${evidenceLabel(item)}
      </div>

      ${propertyNote}

      <div class="popup-actions">
        <a
          href="${googleUrl(item)}"
          target="_blank"
          rel="noopener"
        >
          Open in Google Maps
        </a>

        <a
          class="secondary"
          href="#"
          data-copy-coordinates="${item.lat}, ${item.lng}"
        >
          Copy coordinates
        </a>
      </div>
    `;
  }

  /*
   * REGISTER MARKER
   *
   * Stores marker metadata and implements the copy-coordinate button.
   */
  function registerMarker(marker, item, kind) {
    markerIndex.set(item.id, marker);

    markerMeta.set(item.id, {
      marker,
      item,
      kind
    });

    marker.on('popupopen', event => {
      const popupNode =
        event.popup.getElement();

      const copyLink =
        popupNode &&
        popupNode.querySelector(
          '[data-copy-coordinates]'
        );

      if (!copyLink) {
        return;
      }

      copyLink.addEventListener(
        'click',
        async event => {
          event.preventDefault();

          const text =
            copyLink.getAttribute(
              'data-copy-coordinates'
            );

          try {
            await navigator.clipboard.writeText(text);

            copyLink.textContent = 'Copied';

            setTimeout(() => {
              copyLink.textContent =
                'Copy coordinates';
            }, 1200);
          } catch {
            /*
             * Clipboard access can fail on some mobile browsers.
             * Prompt is our fallback.
             */
            window.prompt(
              'Copy coordinates:',
              text
            );
          }
        },
        {
          once: true
        }
      );
    });
  }

  /*
   * LABELS
   *
   * Labels are not permanently displayed anymore.
   * Visibility will depend on map zoom.
   */
  function bindLabel(marker, item) {
    marker.bindTooltip(
      item.name,
      {
        permanent: false,
        direction: 'top',
        offset: [0, -10],
        className: 'location-label'
      }
    );
  }

  /*
   * SITE A — BENCHMARK
   */
  const site =
    D.benchmark;

  const siteMarker =
    L.marker(
      [site.lat, site.lng],
      {
        icon: icon(
          'benchmark',
          'A'
        ),
        zIndexOffset: 1000
      }
    )
      .bindPopup(
        popup(
          site,
          'Benchmark site'
        )
      );

  bindLabel(
    siteMarker,
    site
  );

  siteMarker.addTo(
    groups.benchmark
  );

  registerMarker(
    siteMarker,
    site,
    'benchmark'
  );

  /*
   * SITE A RADIAL BUFFERS
   *
   * These are straight-line Euclidean buffers,
   * NOT road-network catchments or travel-time isochrones.
   */
  [500, 1000, 2000].forEach(
    (radius, index) => {
      L.circle(
        [site.lat, site.lng],
        {
          radius,

          color:
            index === 0
              ? '#c84d55'
              : '#7c8e87',

          weight:
            index === 0
              ? 2
              : 1.4,

          opacity: 0.62,

          fillOpacity:
            index === 0
              ? 0.045
              : 0.018,

          dashArray:
            index === 0
              ? null
              : '6 7'
        }
      )
        .bindTooltip(
          `${
            radius >= 1000
              ? radius / 1000 + ' km'
              : radius + ' m'
          } radial buffer`,
          {
            sticky: true
          }
        )
        .addTo(
          groups.buffers
        );
    }
  );

  /*
   * CANDIDATE AREAS
   */
  D.candidates.forEach(item => {
    const marker =
      L.marker(
        [item.lat, item.lng],
        {
          icon: icon(
            classForCandidate(item.score),
            item.rank
              ? String(item.rank)
              : 'V'
          )
        }
      )
        .bindPopup(
          popup(
            item,
            isExternalBenchmark(item)
              ? 'Valley benchmark area'
              : 'Kathmandu candidate area'
          )
        );

    bindLabel(
      marker,
      item
    );

    marker.addTo(
      groups.candidates
    );

    registerMarker(
      marker,
      item,
      'candidate'
    );
  });

  /*
   * PILATES COMPETITORS
   */
  D.competitors.forEach(item => {
    const marker =
      L.marker(
        [item.lat, item.lng],
        {
          icon: icon(
            'competitor',
            'P'
          )
        }
      )
        .bindPopup(
          popup(
            item,
            'Pilates competitor'
          )
        );

    bindLabel(
      marker,
      item
    );

    marker.addTo(
      groups.competitors
    );

    registerMarker(
      marker,
      item,
      'competitor'
    );
  });

  /*
   * HEALTH / MARKET ANCHORS
   */
  D.anchors.forEach(item => {
    /*
     * site-a-center duplicates the exact benchmark marker
     * and therefore does not need another visible marker.
     */
    if (item.id === 'site-a-center') {
      return;
    }

    const marker =
      L.marker(
        [item.lat, item.lng],
        {
          icon: icon(
            'anchor',
            '+'
          )
        }
      )
        .bindPopup(
          popup(
            item,
            item.category ||
            'Anchor'
          )
        );

    bindLabel(
      marker,
      item
    );

    marker.addTo(
      groups.anchors
    );

    registerMarker(
      marker,
      item,
      'anchor'
    );
  });

  /*
   * ZOOM-AWARE LABEL RULES
   *
   * Candidate areas become readable from zoom 12.
   * Competitors/anchors wait until zoom 14 to avoid label clutter.
   */
  function shouldShowLabel(meta) {
    if (!labelsOn) {
      return false;
    }

    if (meta.kind === 'benchmark') {
      return map.getZoom() >= 12;
    }

    if (meta.kind === 'candidate') {
      return map.getZoom() >= 12;
    }

    return map.getZoom() >= 14;
  }

  function refreshLabels() {
    markerMeta.forEach(meta => {
      const tooltip =
        meta.marker.getTooltip();

      if (!tooltip) {
        return;
      }

      if (
        shouldShowLabel(meta) &&
        map.hasLayer(meta.marker)
      ) {
        meta.marker.openTooltip();
      } else {
        meta.marker.closeTooltip();
      }
    });
  }

  /*
   * CANDIDATE SIDEBAR CARD
   */
  function makeCandidateCard(
    item,
    container
  ) {
    const element =
      document.createElement(
        'article'
      );

    element.className =
      'candidate-card';

    element.dataset.id =
      item.id;

    element.dataset.name =
      item.name.toLowerCase();

    element.dataset.score =
      item.score;

    element.innerHTML = `
      <div class="rank-badge">
        <i class="dot ${scoreClass(item.score)}"></i>
        ${
          item.rank
            ? '#' + item.rank
            : 'V'
        }
      </div>

      <div>
        <div class="candidate-name">
          ${item.name}
        </div>

        <div class="candidate-tag">
          ${item.tag}
        </div>
      </div>

      <div class="candidate-score">
        ${item.score.toFixed(1)}
        <small>/100</small>
      </div>
    `;

    element.addEventListener(
      'click',
      () => {
        const marker =
          markerIndex.get(
            item.id
          );

        map.setView(
          [item.lat, item.lng],
          15,
          {
            animate: true
          }
        );

        marker.openPopup();

        refreshLabels();
      }
    );

    container.appendChild(
      element
    );
  }

  /*
   * BUILD SIDEBAR
   *
   * Kathmandu candidates and external Valley comparators
   * are deliberately separated.
   */
  function buildCandidateCards() {
    const kmcList =
      document.getElementById(
        'kmcCandidateList'
      );

    const valleyList =
      document.getElementById(
        'valleyCandidateList'
      );

    const ordered =
      [...D.candidates].sort(
        (a, b) =>
          b.score - a.score ||
          (a.rank ?? 99) -
          (b.rank ?? 99)
      );

    ordered.forEach(item => {
      makeCandidateCard(
        item,
        isExternalBenchmark(item)
          ? valleyList
          : kmcList
      );
    });
  }

  buildCandidateCards();

  /*
   * FULL STUDY EXTENT
   */
  const allLatLngs = [
    [site.lat, site.lng],

    ...D.candidates.map(
      item =>
        [item.lat, item.lng]
    ),

    ...D.competitors.map(
      item =>
        [item.lat, item.lng]
    ),

    ...D.anchors.map(
      item =>
        [item.lat, item.lng]
    )
  ];

  const allBounds =
    L.latLngBounds(
      allLatLngs
    );

  /*
   * KATHMANDU-FOCUSED EXTENT
   *
   * Excludes the Lalitpur benchmark areas
   * and the Sanepa competitor marker.
   */
  const kathmanduLatLngs = [
    [site.lat, site.lng],

    ...D.candidates
      .filter(
        item =>
          !isExternalBenchmark(item)
      )
      .map(
        item =>
          [item.lat, item.lng]
      ),

    ...D.competitors
      .filter(
        item =>
          item.id !==
          'riddhi-sanepa'
      )
      .map(
        item =>
          [item.lat, item.lng]
      ),

    ...D.anchors.map(
      item =>
        [item.lat, item.lng]
    )
  ];

  const kathmanduBounds =
    L.latLngBounds(
      kathmanduLatLngs
    );

  /*
   * SIDEBAR COUNTS
   */
  function updateCounts() {
    const visibleCards = selector =>
      [
        ...document.querySelectorAll(
          selector
        )
      ].filter(
        element =>
          !element.classList.contains(
            'hidden'
          )
      ).length;

    document.getElementById(
      'kmcCandidateCount'
    ).textContent =
      `${
        visibleCards(
          '#kmcCandidateList .candidate-card'
        )
      } shown`;

    document.getElementById(
      'valleyCandidateCount'
    ).textContent =
      `${
        visibleCards(
          '#valleyCandidateList .candidate-card'
        )
      } shown`;
  }

  /*
   * SEARCH + SCORE FILTER
   */
  function applyFilters() {
    const query =
      document
        .getElementById(
          'searchInput'
        )
        .value
        .trim()
        .toLowerCase();

    const minScore =
      Number(
        document
          .getElementById(
            'scoreFilter'
          )
          .value
      );

    document.getElementById(
      'scoreValue'
    ).textContent =
      minScore;

    D.candidates.forEach(
      item => {
        const marker =
          markerIndex.get(
            item.id
          );

        const haystack =
          `${
            item.name
          } ${
            item.tag
          } ${
            item.description
          }`
            .toLowerCase();

        const matches =
          item.score >= minScore &&
          (
            !query ||
            haystack.includes(
              query
            )
          );

        const card =
          document.querySelector(
            `.candidate-card[data-id="${item.id}"]`
          );

        if (card) {
          card.classList.toggle(
            'hidden',
            !matches
          );
        }

        if (matches) {
          if (
            !groups.candidates.hasLayer(
              marker
            )
          ) {
            groups.candidates.addLayer(
              marker
            );
          }
        } else {
          groups.candidates.removeLayer(
            marker
          );
        }
      }
    );

    updateCounts();

    /*
     * A single exact competitor/anchor text match
     * automatically focuses that feature.
     */
    if (query) {
      const matches = [
        ...D.competitors,
        ...D.anchors
      ].filter(
        item =>
          `${
            item.name
          } ${
            item.description ||
            ''
          }`
            .toLowerCase()
            .includes(query)
      );

      if (matches.length === 1) {
        const item =
          matches[0];

        const marker =
          markerIndex.get(
            item.id
          );

        if (marker) {
          map.setView(
            [item.lat, item.lng],
            15
          );

          marker.openPopup();
        }
      }
    }

    refreshLabels();
  }

  /*
   * LAYER VISIBILITY
   */
  function setGroupVisibility(
    group,
    visible
  ) {
    if (visible) {
      group.addTo(map);
    } else {
      map.removeLayer(group);
    }

    requestAnimationFrame(
      refreshLabels
    );
  }

  /*
   * FILTER CONTROLS
   */
  document
    .getElementById(
      'searchInput'
    )
    .addEventListener(
      'input',
      applyFilters
    );

  document
    .getElementById(
      'scoreFilter'
    )
    .addEventListener(
      'input',
      applyFilters
    );

  document
    .getElementById(
      'showCandidates'
    )
    .addEventListener(
      'change',
      event =>
        setGroupVisibility(
          groups.candidates,
          event.target.checked
        )
    );

  document
    .getElementById(
      'showCompetitors'
    )
    .addEventListener(
      'change',
      event =>
        setGroupVisibility(
          groups.competitors,
          event.target.checked
        )
    );

  document
    .getElementById(
      'showAnchors'
    )
    .addEventListener(
      'change',
      event =>
        setGroupVisibility(
          groups.anchors,
          event.target.checked
        )
    );

  document
    .getElementById(
      'showRings'
    )
    .addEventListener(
      'change',
      event =>
        setGroupVisibility(
          groups.buffers,
          event.target.checked
        )
    );

  document
    .getElementById(
      'showLabels'
    )
    .addEventListener(
      'change',
      event => {
        labelsOn =
          event.target.checked;

        refreshLabels();
      }
    );

  /*
   * MAP EXTENT BUTTONS
   */
  document
    .getElementById(
      'fitAll'
    )
    .addEventListener(
      'click',
      () =>
        map.fitBounds(
          allBounds.pad(0.08)
        )
    );

  document
    .getElementById(
      'fitKathmandu'
    )
    .addEventListener(
      'click',
      () =>
        map.fitBounds(
          kathmanduBounds.pad(0.08)
        )
    );

  document
    .getElementById(
      'focusSite'
    )
    .addEventListener(
      'click',
      () => {
        map.setView(
          [site.lat, site.lng],
          15
        );

        siteMarker.openPopup();
      }
    );

  /*
   * BENCHMARK CARD INTERACTION
   */
  const benchmarkCard =
    document.getElementById(
      'benchmarkCard'
    );

  const focusBenchmark = () => {
    map.setView(
      [site.lat, site.lng],
      16
    );

    siteMarker.openPopup();
  };

  benchmarkCard.addEventListener(
    'click',
    focusBenchmark
  );

  benchmarkCard.addEventListener(
    'keydown',
    event => {
      if (
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault();

        focusBenchmark();
      }
    }
  );

  /*
   * MOBILE SIDEBAR
   */
  const sidebar =
    document.getElementById(
      'sidebar'
    );

  document
    .getElementById(
      'mobileSidebarToggle'
    )
    .addEventListener(
      'click',
      () => {
        sidebar.classList.toggle(
          'open'
        );

        /*
         * Wait until the CSS transform finishes,
         * then force Leaflet to recalculate its viewport.
         */
        setTimeout(
          () =>
            map.invalidateSize({
              pan: false
            }),
          260
        );
      }
    );

  /*
   * CRITICAL LEAFLET RESIZING FIX
   *
   * The original version could initialize Leaflet before the map panel
   * reached its final browser width. That produced blank space and
   * displaced tiles on the deployed site.
   */
  function refreshMapLayout() {
    map.invalidateSize({
      pan: false,
      debounceMoveend: true
    });
  }

  /*
   * Keep labels synchronized with map movement and zoom.
   */
  map.on(
    'zoomend moveend',
    refreshLabels
  );

  /*
   * Browser/window resize handling.
   */
  window.addEventListener(
    'load',
    refreshMapLayout
  );

  window.addEventListener(
    'resize',
    refreshMapLayout
  );

  /*
   * ResizeObserver detects changes to the actual map container,
   * not just changes to the browser window.
   */
  if (
    'ResizeObserver' in window
  ) {
    const observer =
      new ResizeObserver(
        () =>
          refreshMapLayout()
      );

    observer.observe(
      mapEl
    );
  }

  /*
   * Two animation frames allow the CSS grid to finish layout
   * before Leaflet calculates the final viewport and bounds.
   */
  requestAnimationFrame(
    () => {
      refreshMapLayout();

      requestAnimationFrame(
        () => {
          refreshMapLayout();

          map.fitBounds(
            kathmanduBounds.pad(
              0.08
            )
          );

          refreshLabels();
        }
      );
    }
  );

  /*
   * Initial sidebar/filter state.
   */
  applyFilters();
})();