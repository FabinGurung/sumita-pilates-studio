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
      'GIS initialization failed: Leaflet, map data or #map is missing.'
    );

    return;
  }

  const site = D.benchmark;

  const externalBenchmarkIds = new Set([
    'sanepa-jhamsikhel',
    'jawalakhel-pulchowk'
  ]);

  const isExternalBenchmark = item =>
    externalBenchmarkIds.has(item.id);

  const ui = {
    sidebar:
      document.getElementById('sidebar'),

    mobileToggle:
      document.getElementById(
        'mobileSidebarToggle'
      ),

    mapInfoButton:
      document.getElementById(
        'mapInfoButton'
      ),

    searchInput:
      document.getElementById(
        'searchInput'
      ),

    scoreFilter:
      document.getElementById(
        'scoreFilter'
      ),

    scoreValue:
      document.getElementById(
        'scoreValue'
      ),

    showBenchmark:
      document.getElementById(
        'showBenchmark'
      ),

    showCandidates:
      document.getElementById(
        'showCandidates'
      ),

    showCompetitors:
      document.getElementById(
        'showCompetitors'
      ),

    showAnchors:
      document.getElementById(
        'showAnchors'
      ),

    showLabels:
      document.getElementById(
        'showLabels'
      ),

    buffer500:
      document.getElementById(
        'buffer500'
      ),

    buffer1000:
      document.getElementById(
        'buffer1000'
      ),

    buffer2000:
      document.getElementById(
        'buffer2000'
      ),

    focusSite:
      document.getElementById(
        'focusSite'
      ),

    fitKathmandu:
      document.getElementById(
        'fitKathmandu'
      ),

    fitAll:
      document.getElementById(
        'fitAll'
      ),

    benchmarkCard:
      document.getElementById(
        'benchmarkCard'
      ),

    metricPilates500:
      document.getElementById(
        'metricPilates500'
      ),

    metricPilates1000:
      document.getElementById(
        'metricPilates1000'
      ),

    metricPilates2000:
      document.getElementById(
        'metricPilates2000'
      ),

    metricAnchors500:
      document.getElementById(
        'metricAnchors500'
      ),

    nearestCompetitors:
      document.getElementById(
        'nearestCompetitors'
      ),

    siteStrengths:
      document.getElementById(
        'siteStrengths'
      ),

    siteCautions:
      document.getElementById(
        'siteCautions'
      ),

    kmcCandidateList:
      document.getElementById(
        'kmcCandidateList'
      ),

    valleyCandidateList:
      document.getElementById(
        'valleyCandidateList'
      ),

    kmcCandidateCount:
      document.getElementById(
        'kmcCandidateCount'
      ),

    valleyCandidateCount:
      document.getElementById(
        'valleyCandidateCount'
      ),

    datasetCandidateCount:
      document.getElementById(
        'datasetCandidateCount'
      ),

    datasetCompetitorCount:
      document.getElementById(
        'datasetCompetitorCount'
      ),

    datasetAnchorCount:
      document.getElementById(
        'datasetAnchorCount'
      )
  };


  /* =======================================================
     MAP INITIALIZATION
     ======================================================= */

  const map = L.map(
    'map',
    {
      zoomControl: true,
      preferCanvas: false,
      zoomSnap: 0.25,
      zoomDelta: 0.5
    }
  ).setView(
    [
      site.lat,
      site.lng
    ],
    14.5
  );


  const tiles = L.tileLayer(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution:
        '&copy; OpenStreetMap contributors'
    }
  );


  let tileFailures = 0;
  let tileSuccesses = 0;


  tiles.on(
    'tileload',
    () => {
      tileSuccesses += 1;

      if (
        tileSuccesses >= 2 &&
        statusEl
      ) {
        statusEl.textContent =
          'Map ready';

        statusEl.classList.remove(
          'warning'
        );

        statusEl.classList.add(
          'ready'
        );
      }
    }
  );


  tiles.on(
    'tileerror',
    () => {
      tileFailures += 1;

      if (
        tileFailures >= 2 &&
        statusEl
      ) {
        statusEl.textContent =
          'Some base-map tiles could not load';

        statusEl.classList.remove(
          'ready'
        );

        statusEl.classList.add(
          'warning'
        );
      }
    }
  );


  tiles.addTo(map);


  L.control.scale(
    {
      imperial: false,
      position: 'bottomright'
    }
  ).addTo(map);


  /* =======================================================
     PRIMARY LAYERS
     ======================================================= */

  const groups = {
    benchmark:
      L.layerGroup().addTo(map),

    candidates:
      L.layerGroup().addTo(map),

    competitors:
      L.layerGroup().addTo(map),

    anchors:
      L.layerGroup().addTo(map)
  };


  const bufferLayers =
    new Map();

  const markerIndex =
    new Map();

  const markerMeta =
    new Map();

  const candidateMatches =
    new Map();


  let labelsOn = true;


  /* =======================================================
     HELPERS
     ======================================================= */

  const googleUrl = item => {
    const query =
      item.googleQuery ||
      `${item.lat},${item.lng}`;

    return (
      'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(query)
    );
  };


  function haversineMeters(
    a,
    b
  ) {

    const R =
      6371008.8;

    const toRad =
      value =>
        (
          value *
          Math.PI
        ) /
        180;


    const lat1 =
      toRad(a.lat);

    const lat2 =
      toRad(b.lat);

    const dLat =
      toRad(
        b.lat -
        a.lat
      );

    const dLng =
      toRad(
        b.lng -
        a.lng
      );


    const h =
      Math.sin(
        dLat / 2
      ) ** 2 +

      Math.cos(lat1) *
      Math.cos(lat2) *

      Math.sin(
        dLng / 2
      ) ** 2;


    return (
      2 *
      R *
      Math.asin(
        Math.min(
          1,
          Math.sqrt(h)
        )
      )
    );
  }


  function formatDistance(
    meters
  ) {

    if (
      !Number.isFinite(
        meters
      )
    ) {
      return '—';
    }


    if (
      meters <
      1000
    ) {
      return (
        `${Math.round(meters)} m`
      );
    }


    return (
      `${
        (
          meters /
          1000
        ).toFixed(
          meters <
          10000
            ? 1
            : 0
        )
      } km`
    );
  }


  function evidenceLabel(
    item
  ) {

    const precision =
      String(
        item.precision ||
        ''
      ).toLowerCase();


    if (
      precision.includes(
        'exact user-provided'
      ) ||
      precision ===
      'exact'
    ) {
      return (
        'Exact project point'
      );
    }


    if (
      precision.includes(
        'published'
      )
    ) {
      return (
        'Published location'
      );
    }


    if (
      precision.includes(
        'decoded'
      )
    ) {
      return (
        'Decoded listing point'
      );
    }


    if (
      precision.includes(
        'approximate'
      )
    ) {
      return (
        'Approximate listing location'
      );
    }


    if (
      precision.includes(
        'representative'
      )
    ) {
      return (
        'Screening centroid'
      );
    }


    return (
      'Research location'
    );
  }


  function classForCandidate(
    score
  ) {

    if (
      score >=
      80
    ) {
      return (
        'marker-candidate-top'
      );
    }


    if (
      score >=
      75
    ) {
      return (
        'marker-candidate-strong'
      );
    }


    return (
      'marker-candidate-watch'
    );
  }


  /* =======================================================
     MARKER ICON
     ======================================================= */

  function icon(
    kind,
    text = ''
  ) {

    let cssClass =
      kind;


    if (
      kind ===
      'benchmark'
    ) {
      cssClass =
        'marker-benchmark';
    }


    if (
      kind ===
      'competitor'
    ) {
      cssClass =
        'marker-competitor';
    }


    if (
      kind ===
      'anchor'
    ) {
      cssClass =
        'marker-anchor';
    }


    const size =
      kind ===
      'benchmark'
        ? 28
        : 22;


    return L.divIcon(
      {
        className:
          '',

        html:
          `<div class="marker-icon ${cssClass}" ` +
          `style="width:${size}px;height:${size}px">` +
          `${text}` +
          `</div>`,

        iconSize:
          [
            size,
            size
          ],

        iconAnchor:
          [
            size / 2,
            size / 2
          ],

        popupAnchor:
          [
            0,
            -(
              size /
              2
            )
          ]
      }
    );
  }


  /* =======================================================
     POPUPS
     ======================================================= */

  function popup(
    item,
    typeLabel,
    kind
  ) {

    const score =
      typeof item.score ===
      'number'
        ? (
          `<div class="popup-score">` +
          `Area screening score: ` +
          `${item.score.toFixed(1)} / 100` +
          `</div>`
        )
        : '';


    const distance =
      item.id ===
      site.id
        ? ''
        : (
          `<div class="popup-distance">` +
          `Straight-line distance from Site A: ` +
          `${
            formatDistance(
              haversineMeters(
                site,
                item
              )
            )
          }` +
          `</div>`
        );


    const propertyNote =
      item.id ===
      site.id
        ? (
          '<div class="popup-evidence">' +
          'Property suitability: pending site survey' +
          '</div>'
        )
        : '';


    const type =
      kind ===
      'candidate' &&
      isExternalBenchmark(
        item
      )
        ? (
          'Valley benchmark area'
        )
        : typeLabel;


    return `
      <div class="popup-type">
        ${type}
      </div>

      <div class="popup-title">
        ${item.name}
      </div>

      ${score}

      <div class="popup-desc">
        ${item.description || ''}
      </div>

      ${distance}

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
          Google Maps
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


  /* =======================================================
     MARKER REGISTRATION
     ======================================================= */

  function registerMarker(
    marker,
    item,
    kind
  ) {

    markerIndex.set(
      item.id,
      marker
    );


    markerMeta.set(
      item.id,
      {
        marker,
        item,
        kind
      }
    );


    marker.on(
      'popupopen',
      event => {

        const popupNode =
          event.popup.getElement();


        const copyLink =
          popupNode &&
          popupNode.querySelector(
            '[data-copy-coordinates]'
          );


        if (
          !copyLink
        ) {
          return;
        }


        copyLink.addEventListener(
          'click',
          async clickEvent => {

            clickEvent.preventDefault();


            const text =
              copyLink.getAttribute(
                'data-copy-coordinates'
              );


            try {

              await navigator.clipboard.writeText(
                text
              );


              copyLink.textContent =
                'Copied';


              setTimeout(
                () => {
                  copyLink.textContent =
                    'Copy coordinates';
                },
                1200
              );

            } catch {

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

      }
    );
  }


  /* =======================================================
     AREA LABELS
     ======================================================= */

  function bindAreaLabel(
    marker,
    item,
    isSite = false
  ) {

    marker.bindTooltip(
      item.name,
      {
        permanent:
          false,

        direction:
          'top',

        offset:
          [
            0,
            -11
          ],

        className:
          isSite
            ? 'location-label site-label'
            : 'location-label'
      }
    );
  }


  /* =======================================================
     SITE A
     ======================================================= */

  const siteMarker =
    L.marker(
      [
        site.lat,
        site.lng
      ],
      {
        icon:
          icon(
            'benchmark',
            'A'
          ),

        zIndexOffset:
          2000
      }
    )
      .bindPopup(
        popup(
          site,
          'Benchmark property',
          'benchmark'
        )
      )
      .addTo(
        groups.benchmark
      );


  bindAreaLabel(
    siteMarker,
    site,
    true
  );


  registerMarker(
    siteMarker,
    site,
    'benchmark'
  );


  /* =======================================================
     CANDIDATE AREAS
     ======================================================= */

  D.candidates.forEach(
    item => {

      const rankText =
        item.rank
          ? `#${item.rank}`
          : 'V';


      const marker =
        L.marker(
          [
            item.lat,
            item.lng
          ],
          {
            icon:
              icon(
                classForCandidate(
                  item.score
                ),
                rankText
              )
          }
        )
          .bindPopup(
            popup(
              item,
              'Kathmandu candidate area',
              'candidate'
            )
          )
          .addTo(
            groups.candidates
          );


      bindAreaLabel(
        marker,
        item,
        false
      );


      registerMarker(
        marker,
        item,
        'candidate'
      );


      candidateMatches.set(
        item.id,
        true
      );

    }
  );


  /* =======================================================
     PILATES COMPETITORS
     ======================================================= */

  D.competitors.forEach(
    item => {

      const marker =
        L.marker(
          [
            item.lat,
            item.lng
          ],
          {
            icon:
              icon(
                'competitor',
                'P'
              )
          }
        )
          .bindPopup(
            popup(
              item,
              'Pilates competitor',
              'competitor'
            )
          )
          .addTo(
            groups.competitors
          );


      registerMarker(
        marker,
        item,
        'competitor'
      );

    }
  );


  /* =======================================================
     HEALTH / MARKET ANCHORS
     ======================================================= */

  D.anchors.forEach(
    item => {

      if (
        item.id ===
        'site-a-center'
      ) {
        return;
      }


      const marker =
        L.marker(
          [
            item.lat,
            item.lng
          ],
          {
            icon:
              icon(
                'anchor',
                '+'
              )
          }
        )
          .bindPopup(
            popup(
              item,
              item.category ||
              'Health / market anchor',
              'anchor'
            )
          )
          .addTo(
            groups.anchors
          );


      registerMarker(
        marker,
        item,
        'anchor'
      );

    }
  );


  /* =======================================================
     RADIAL BUFFERS
     ======================================================= */

  function createBuffer(
    radius,
    checked
  ) {

    const styles = {

      500: {
        color:
          '#c84d55',

        weight:
          2,

        opacity:
          0.48,

        fillColor:
          '#c84d55',

        fillOpacity:
          0.028,

        dashArray:
          null
      },


      1000: {
        color:
          '#b56c73',

        weight:
          1.5,

        opacity:
          0.38,

        fillColor:
          '#c84d55',

        fillOpacity:
          0.012,

        dashArray:
          '7 8'
      },


      2000: {
        color:
          '#8b9691',

        weight:
          1.35,

        opacity:
          0.34,

        fillColor:
          '#8b9691',

        fillOpacity:
          0.006,

        dashArray:
          '5 10'
      }

    };


    const circle =
      L.circle(
        [
          site.lat,
          site.lng
        ],
        {
          radius,
          ...styles[radius]
        }
      )
        .bindTooltip(
          radius >=
          1000
            ? (
              `${
                radius /
                1000
              } km radial buffer`
            )
            : (
              `${radius} m radial buffer`
            ),
          {
            sticky:
              true,

            className:
              'buffer-label'
          }
        );


    bufferLayers.set(
      radius,
      circle
    );


    if (
      checked
    ) {
      circle.addTo(
        map
      );
    }
  }


  createBuffer(
    500,
    true
  );

  createBuffer(
    1000,
    false
  );

  createBuffer(
    2000,
    false
  );


  function setBufferVisibility(
    radius,
    visible
  ) {

    const layer =
      bufferLayers.get(
        radius
      );


    if (
      !layer
    ) {
      return;
    }


    if (
      visible &&
      !map.hasLayer(layer)
    ) {
      layer.addTo(map);
    }


    if (
      !visible &&
      map.hasLayer(layer)
    ) {
      map.removeLayer(layer);
    }
  }


  /* =======================================================
     GROUP VISIBILITY
     ======================================================= */

  function setGroupVisibility(
    group,
    visible
  ) {

    if (
      visible
    ) {

      if (
        !map.hasLayer(
          group
        )
      ) {
        group.addTo(
          map
        );
      }

    } else if (
      map.hasLayer(
        group
      )
    ) {

      map.removeLayer(
        group
      );

    }


    requestAnimationFrame(
      refreshLabels
    );
  }


  /* =======================================================
     LABEL RULES
     ======================================================= */

  function shouldShowAreaLabel(
    meta
  ) {

    if (
      !labelsOn
    ) {
      return false;
    }


    if (
      !map.hasLayer(
        meta.marker
      )
    ) {
      return false;
    }


    const zoom =
      map.getZoom();


    if (
      meta.kind ===
      'benchmark'
    ) {
      return (
        zoom >=
        13.5
      );
    }


    if (
      meta.kind ===
      'candidate'
    ) {
      return (
        zoom >=
        12.5
      );
    }


    return false;
  }


  function refreshLabels() {

    markerMeta.forEach(
      meta => {

        const tooltip =
          meta.marker.getTooltip();


        if (
          !tooltip
        ) {
          return;
        }


        if (
          shouldShowAreaLabel(
            meta
          )
        ) {

          meta.marker.openTooltip();

        } else {

          meta.marker.closeTooltip();

        }

      }
    );
  }


  /* =======================================================
     HIDE DUPLICATE LAZIMPAT AREA CENTROID AT CLOSE ZOOM
     ======================================================= */

  function syncLazimpatAreaVisibility() {

    const meta =
      markerMeta.get(
        'lazimpat-area'
      );


    if (
      !meta
    ) {
      return;
    }


    const shouldHideForSiteDetail =
      map.getZoom() >=
      15;


    const matches =
      candidateMatches.get(
        'lazimpat-area'
      ) !== false;


    if (
      shouldHideForSiteDetail ||
      !matches
    ) {

      groups.candidates.removeLayer(
        meta.marker
      );

    } else if (
      !groups.candidates.hasLayer(
        meta.marker
      )
    ) {

      groups.candidates.addLayer(
        meta.marker
      );

    }
  }


  /* =======================================================
     WORKSPACE TABS
     ======================================================= */

  function switchPanel(
    panelName,
    openDrawer = false
  ) {

    document
      .querySelectorAll(
        '.workspace-tab'
      )
      .forEach(
        tab => {

          tab.classList.toggle(
            'active',
            tab.dataset.panel ===
            panelName
          );

        }
      );


    document
      .querySelectorAll(
        '.workspace-panel'
      )
      .forEach(
        panel => {

          panel.classList.toggle(
            'active',
            panel.dataset.panelView ===
            panelName
          );

        }
      );


    if (
      openDrawer &&
      window.matchMedia(
        '(max-width: 820px)'
      ).matches
    ) {

      ui.sidebar.classList.add(
        'open'
      );


      setTimeout(
        refreshMapLayout,
        240
      );

    }
  }


  document
    .querySelectorAll(
      '.workspace-tab'
    )
    .forEach(
      tab => {

        tab.addEventListener(
          'click',
          () =>
            switchPanel(
              tab.dataset.panel
            )
        );

      }
    );


  /* =======================================================
     MAP FOCUS HELPERS
     ======================================================= */

  function focusItem(
    item,
    zoom = 15
  ) {

    const marker =
      markerIndex.get(
        item.id
      );


    if (
      !marker
    ) {
      return;
    }


    map.setView(
      [
        item.lat,
        item.lng
      ],
      zoom,
      {
        animate:
          true
      }
    );


    marker.openPopup();


    refreshLabels();
  }


  function focusSite(
    zoom = 15.5,
    openPopup = true
  ) {

    map.setView(
      [
        site.lat,
        site.lng
      ],
      zoom,
      {
        animate:
          true
      }
    );


    if (
      openPopup
    ) {
      siteMarker.openPopup();
    }


    refreshLabels();
  }


  /* =======================================================
     CANDIDATE CARDS
     ======================================================= */

  function createCandidateCard(
    item,
    container
  ) {

    const card =
      document.createElement(
        'article'
      );


    card.className =
      'candidate-card';


    card.dataset.id =
      item.id;


    card.dataset.name =
      item.name.toLowerCase();


    card.dataset.score =
      String(
        item.score
      );


    const badgeClass =
      isExternalBenchmark(
        item
      )
        ? (
          'rank-badge external'
        )
        : (
          'rank-badge'
        );


    const badgeText =
      item.rank
        ? (
          `#${item.rank}`
        )
        : 'V';


    card.innerHTML = `
      <div class="${badgeClass}">
        ${badgeText}
      </div>

      <div class="candidate-content">

        <div class="candidate-name">
          ${item.name}
        </div>

        <div class="candidate-tag">
          ${item.tag || ''}
        </div>

      </div>

      <div class="candidate-score">
        ${item.score.toFixed(1)}
        <small>/100</small>
      </div>
    `;


    card.addEventListener(
      'click',
      () => {

        focusItem(
          item,
          15
        );


        if (
          window.matchMedia(
            '(max-width: 820px)'
          ).matches
        ) {

          ui.sidebar.classList.remove(
            'open'
          );


          setTimeout(
            refreshMapLayout,
            240
          );

        }

      }
    );


    container.appendChild(
      card
    );
  }


  function buildCandidateCards() {

    const ordered =
      [
        ...D.candidates
      ].sort(
        (
          a,
          b
        ) => {

          if (
            isExternalBenchmark(a) !==
            isExternalBenchmark(b)
          ) {

            return (
              isExternalBenchmark(a)
                ? 1
                : -1
            );
          }


          return (
            b.score -
            a.score ||

            (
              a.rank ??
              99
            ) -

            (
              b.rank ??
              99
            )
          );

        }
      );


    ordered.forEach(
      item => {

        createCandidateCard(
          item,

          isExternalBenchmark(
            item
          )
            ? ui.valleyCandidateList
            : ui.kmcCandidateList
        );

      }
    );
  }


  /* =======================================================
     RANKING COUNTS
     ======================================================= */

  function updateCounts() {

    const countVisible =
      selector =>
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


    ui.kmcCandidateCount.textContent =
      `${
        countVisible(
          '#kmcCandidateList .candidate-card'
        )
      } shown`;


    ui.valleyCandidateCount.textContent =
      `${
        countVisible(
          '#valleyCandidateList .candidate-card'
        )
      } shown`;
  }


  /* =======================================================
     SEARCH + SCORE FILTERING
     ======================================================= */

  function applyCandidateFilters() {

    const query =
      ui.searchInput
        .value
        .trim()
        .toLowerCase();


    const minScore =
      Number(
        ui.scoreFilter.value
      );


    ui.scoreValue.textContent =
      Number.isInteger(
        minScore
      )
        ? String(
          minScore
        )
        : minScore.toFixed(
          1
        );


    D.candidates.forEach(
      item => {

        const haystack =
          `${
            item.name
          } ${
            item.tag ||
            ''
          } ${
            item.description ||
            ''
          }`
            .toLowerCase();


        const matches =
          item.score >=
          minScore &&

          (
            !query ||
            haystack.includes(
              query
            )
          );


        candidateMatches.set(
          item.id,
          matches
        );


        const card =
          document.querySelector(
            `.candidate-card[data-id="${item.id}"]`
          );


        if (
          card
        ) {

          card.classList.toggle(
            'hidden',
            !matches
          );

        }


        const marker =
          markerIndex.get(
            item.id
          );


        if (
          !marker
        ) {
          return;
        }


        if (
          matches
        ) {

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


    syncLazimpatAreaVisibility();

    updateCounts();

    refreshLabels();
  }


  function focusUniqueSearchMatch() {

    const query =
      ui.searchInput
        .value
        .trim()
        .toLowerCase();


    if (
      !query
    ) {
      return;
    }


    const pool =
      [
        site,

        ...D.competitors,

        ...D.anchors.filter(
          item =>
            item.id !==
            'site-a-center'
        )
      ];


    const matches =
      pool.filter(
        item =>
          `${
            item.name
          } ${
            item.description ||
            ''
          }`
            .toLowerCase()
            .includes(
              query
            )
      );


    if (
      matches.length ===
      1
    ) {

      focusItem(
        matches[0],
        15.5
      );

    }
  }


  /* =======================================================
     SITE A DASHBOARD
     ======================================================= */

  function buildSiteDashboard() {

    ui.datasetCandidateCount.textContent =
      String(
        D.candidates.length
      );


    ui.datasetCompetitorCount.textContent =
      String(
        D.competitors.length
      );


    ui.datasetAnchorCount.textContent =
      String(
        D.anchors.filter(
          item =>
            item.id !==
            'site-a-center'
        ).length
      );


    const competitorDistances =
      D.competitors
        .map(
          item => (
            {
              item,

              distance:
                haversineMeters(
                  site,
                  item
                )
            }
          )
        )
        .sort(
          (
            a,
            b
          ) =>
            a.distance -
            b.distance
        );


    const anchorDistances =
      D.anchors
        .filter(
          item =>
            item.id !==
            'site-a-center'
        )
        .map(
          item => (
            {
              item,

              distance:
                haversineMeters(
                  site,
                  item
                )
            }
          )
        )
        .sort(
          (
            a,
            b
          ) =>
            a.distance -
            b.distance
        );


    const countWithin =
      (
        records,
        meters
      ) =>
        records.filter(
          record =>
            record.distance <=
            meters
        ).length;


    ui.metricPilates500.textContent =
      String(
        countWithin(
          competitorDistances,
          500
        )
      );


    ui.metricPilates1000.textContent =
      String(
        countWithin(
          competitorDistances,
          1000
        )
      );


    ui.metricPilates2000.textContent =
      String(
        countWithin(
          competitorDistances,
          2000
        )
      );


    ui.metricAnchors500.textContent =
      String(
        countWithin(
          anchorDistances,
          500
        )
      );


    ui.nearestCompetitors.innerHTML =
      '';


    competitorDistances
      .slice(
        0,
        5
      )
      .forEach(
        (
          record,
          index
        ) => {

          const row =
            document.createElement(
              'article'
            );


          row.className =
            'nearest-item';


          row.innerHTML = `
            <div class="nearest-rank">
              ${index + 1}
            </div>

            <div class="nearest-content">

              <div class="nearest-name">
                ${record.item.name}
              </div>

              <div class="nearest-meta">
                ${evidenceLabel(record.item)}
              </div>

            </div>

            <div class="nearest-distance">
              ${formatDistance(record.distance)}
            </div>
          `;


          row.addEventListener(
            'click',
            () => {

              focusItem(
                record.item,
                16
              );


              if (
                window.matchMedia(
                  '(max-width: 820px)'
                ).matches
              ) {

                ui.sidebar.classList.remove(
                  'open'
                );


                setTimeout(
                  refreshMapLayout,
                  240
                );

              }

            }
          );


          ui.nearestCompetitors.appendChild(
            row
          );

        }
      );


    ui.siteStrengths.innerHTML =
      '';


    (
      site.strengths ||
      []
    ).forEach(
      text => {

        const chip =
          document.createElement(
            'span'
          );


        chip.className =
          'insight-chip positive';


        chip.textContent =
          text;


        ui.siteStrengths.appendChild(
          chip
        );

      }
    );


    ui.siteCautions.innerHTML =
      '';


    (
      site.cautions ||
      []
    ).forEach(
      text => {

        const chip =
          document.createElement(
            'span'
          );


        chip.className =
          'insight-chip caution';


        chip.textContent =
          text;


        ui.siteCautions.appendChild(
          chip
        );

      }
    );
  }


  /* =======================================================
     STUDY EXTENTS
     ======================================================= */

  const allLatLngs = [

    [
      site.lat,
      site.lng
    ],

    ...D.candidates.map(
      item =>
        [
          item.lat,
          item.lng
        ]
    ),

    ...D.competitors.map(
      item =>
        [
          item.lat,
          item.lng
        ]
    ),

    ...D.anchors
      .filter(
        item =>
          item.id !==
          'site-a-center'
      )
      .map(
        item =>
          [
            item.lat,
            item.lng
          ]
      )

  ];


  const allBounds =
    L.latLngBounds(
      allLatLngs
    );


  const kathmanduLatLngs = [

    [
      site.lat,
      site.lng
    ],

    ...D.candidates
      .filter(
        item =>
          !isExternalBenchmark(
            item
          )
      )
      .map(
        item =>
          [
            item.lat,
            item.lng
          ]
      ),

    ...D.competitors
      .filter(
        item =>
          item.id !==
          'riddhi-sanepa'
      )
      .map(
        item =>
          [
            item.lat,
            item.lng
          ]
      ),

    ...D.anchors
      .filter(
        item =>
          item.id !==
          'site-a-center'
      )
      .map(
        item =>
          [
            item.lat,
            item.lng
          ]
      )

  ];


  const kathmanduBounds =
    L.latLngBounds(
      kathmanduLatLngs
    );


  /* =======================================================
     QUICK VIEW BUTTONS
     ======================================================= */

  ui.focusSite.addEventListener(
    'click',
    () =>
      focusSite(
        15.5,
        true
      )
  );


  ui.fitKathmandu.addEventListener(
    'click',
    () =>
      map.fitBounds(
        kathmanduBounds.pad(
          0.07
        )
      )
  );


  ui.fitAll.addEventListener(
    'click',
    () =>
      map.fitBounds(
        allBounds.pad(
          0.07
        )
      )
  );


  /* =======================================================
     SITE A CARD
     ======================================================= */

  ui.benchmarkCard.addEventListener(
    'click',
    () =>
      focusSite(
        16,
        true
      )
  );


  ui.benchmarkCard.addEventListener(
    'keydown',
    event => {

      if (
        event.key ===
        'Enter' ||
        event.key ===
        ' '
      ) {

        event.preventDefault();


        focusSite(
          16,
          true
        );

      }

    }
  );


  /* =======================================================
     MAP INFO BUTTON
     ======================================================= */

  ui.mapInfoButton.addEventListener(
    'click',
    () => {

      switchPanel(
        'site',
        true
      );


      focusSite(
        15.5,
        false
      );

    }
  );


  /* =======================================================
     SEARCH
     ======================================================= */

  ui.searchInput.addEventListener(
    'input',
    () => {

      applyCandidateFilters();

      focusUniqueSearchMatch();

    }
  );


  ui.scoreFilter.addEventListener(
    'input',
    applyCandidateFilters
  );


  /* =======================================================
     LAYER CONTROLS
     ======================================================= */

  ui.showBenchmark.addEventListener(
    'change',
    event => {

      setGroupVisibility(
        groups.benchmark,
        event.target.checked
      );

    }
  );


  ui.showCandidates.addEventListener(
    'change',
    event => {

      setGroupVisibility(
        groups.candidates,
        event.target.checked
      );

    }
  );


  ui.showCompetitors.addEventListener(
    'change',
    event => {

      setGroupVisibility(
        groups.competitors,
        event.target.checked
      );

    }
  );


  ui.showAnchors.addEventListener(
    'change',
    event => {

      setGroupVisibility(
        groups.anchors,
        event.target.checked
      );

    }
  );


  ui.showLabels.addEventListener(
    'change',
    event => {

      labelsOn =
        event.target.checked;


      refreshLabels();

    }
  );


  /* =======================================================
     BUFFER CONTROLS
     ======================================================= */

  ui.buffer500.addEventListener(
    'change',
    event =>
      setBufferVisibility(
        500,
        event.target.checked
      )
  );


  ui.buffer1000.addEventListener(
    'change',
    event =>
      setBufferVisibility(
        1000,
        event.target.checked
      )
  );


  ui.buffer2000.addEventListener(
    'change',
    event =>
      setBufferVisibility(
        2000,
        event.target.checked
      )
  );


  /* =======================================================
     MOBILE DRAWER
     ======================================================= */

  ui.mobileToggle.addEventListener(
    'click',
    () => {

      ui.sidebar.classList.toggle(
        'open'
      );


      setTimeout(
        refreshMapLayout,
        240
      );

    }
  );


  map.on(
    'click',
    () => {

      if (
        window.matchMedia(
          '(max-width: 820px)'
        ).matches &&

        ui.sidebar.classList.contains(
          'open'
        )
      ) {

        ui.sidebar.classList.remove(
          'open'
        );


        setTimeout(
          refreshMapLayout,
          240
        );

      }

    }
  );


  /* =======================================================
     MAP EVENTS
     ======================================================= */

  map.on(
    'zoomend moveend',
    () => {

      syncLazimpatAreaVisibility();

      refreshLabels();

    }
  );


  /* =======================================================
     LEAFLET SIZE REPAIR
     ======================================================= */

  function refreshMapLayout() {

    map.invalidateSize(
      {
        pan:
          false,

        debounceMoveend:
          true
      }
    );
  }


  window.addEventListener(
    'load',
    refreshMapLayout
  );


  window.addEventListener(
    'resize',
    refreshMapLayout
  );


  if (
    'ResizeObserver' in
    window
  ) {

    const observer =
      new ResizeObserver(
        refreshMapLayout
      );


    observer.observe(
      mapEl
    );

  }


  /* =======================================================
     BUILD INTERFACE
     ======================================================= */

  buildCandidateCards();

  buildSiteDashboard();

  applyCandidateFilters();


  /* =======================================================
     SITE-A-FIRST STARTUP
     ======================================================= */

  requestAnimationFrame(
    () => {

      refreshMapLayout();


      requestAnimationFrame(
        () => {

          refreshMapLayout();


          focusSite(
            14.5,
            false
          );


          syncLazimpatAreaVisibility();


          refreshLabels();

        }
      );

    }
  );

})();