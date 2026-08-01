(() => {
  "use strict";

  const DATA =
    window.PILATES_MAP_DATA;

  const ASSESSMENT =
    window.SITE_ASSESSMENT;

  if (
    !DATA ||
    !ASSESSMENT
  ) {
    console.error(
      "GIS Decision View could not start because map data or site assessment data is missing."
    );

    return;
  }


  /* =======================================================
     CORE DATA
     ======================================================= */

  const site =
    DATA.benchmark;

  const competitors =
    Array.isArray(
      DATA.competitors
    )
      ? DATA.competitors
      : [];

  const anchors =
    Array.isArray(
      DATA.anchors
    )
      ? DATA.anchors.filter(
        item =>
          item.id !==
          "site-a-center"
      )
      : [];

  const gates =
    Array.isArray(
      ASSESSMENT.decisionGates
    )
      ? ASSESSMENT.decisionGates
      : [];


  /* =======================================================
     HELPERS
     ======================================================= */

  function escapeHtml(
    value
  ) {
    return String(
      value ?? ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }


  function haversineMeters(
    from,
    to
  ) {
    const earthRadius =
      6371008.8;

    const toRadians =
      value =>
        (
          value *
          Math.PI
        ) /
        180;

    const lat1 =
      toRadians(
        from.lat
      );

    const lat2 =
      toRadians(
        to.lat
      );

    const deltaLat =
      toRadians(
        to.lat -
        from.lat
      );

    const deltaLng =
      toRadians(
        to.lng -
        from.lng
      );

    const h =
      Math.sin(
        deltaLat /
        2
      ) ** 2 +

      Math.cos(
        lat1
      ) *

      Math.cos(
        lat2
      ) *

      Math.sin(
        deltaLng /
        2
      ) ** 2;

    return (
      2 *
      earthRadius *
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
      return "—";
    }

    if (
      meters <
      1000
    ) {
      return (
        `${Math.round(
          meters
        )} m`
      );
    }

    return (
      `${
        (
          meters /
          1000
        ).toFixed(1)
      } km`
    );
  }


  function findScoreBand(
    score
  ) {
    const bands =
      [
        ...(
          ASSESSMENT.scoreBands ||
          []
        )
      ].sort(
        (
          a,
          b
        ) =>
          b.min -
          a.min
      );

    return (
      bands.find(
        band =>
          score >=
          band.min
      ) ||
      {
        label:
          "Unclassified",

        explanation:
          "No project screening band is currently available."
      }
    );
  }


  function listHtml(
    values,
    className
  ) {
    return values
      .map(
        value => `
          <li class="${className}">
            ${escapeHtml(value)}
          </li>
        `
      )
      .join("");
  }


  function isMobile() {
    return window.matchMedia(
      "(max-width: 820px)"
    ).matches;
  }


  /* =======================================================
     CALCULATED EVIDENCE
     ======================================================= */

  const competitorDistances =
    competitors
      .map(
        item => ({
          item,

          distance:
            haversineMeters(
              site,
              item
            )
        })
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
    anchors
      .map(
        item => ({
          item,

          distance:
            haversineMeters(
              site,
              item
            )
        })
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
      radius
    ) =>
      records.filter(
        record =>
          record.distance <=
          radius
      ).length;


  const competitors500 =
    countWithin(
      competitorDistances,
      500
    );


  const competitors1000 =
    countWithin(
      competitorDistances,
      1000
    );


  const competitors2000 =
    countWithin(
      competitorDistances,
      2000
    );


  const anchors500 =
    countWithin(
      anchorDistances,
      500
    );


  const nearestCompetitor =
    competitorDistances[0] ||
    null;


  const areaScore =
    Number(
      site.score ||
      0
    );


  const scoreBand =
    findScoreBand(
      areaScore
    );


  const lazimpatCandidate =
    (
      DATA.candidates ||
      []
    ).find(
      item =>
        item.id ===
        "lazimpat-area"
    );


  const completedGates =
    gates.filter(
      gate =>
        gate.status ===
        "complete"
    ).length;


  const pendingGates =
    gates.length -
    completedGates;


  const gateProgress =
    gates.length
      ? (
        completedGates /
        gates.length
      ) *
      100
      : 0;


  const highCompetition =
    competitors500 >=
    (
      ASSESSMENT
        .thresholds
        ?.highCompetitionWithin500m ??
      3
    );


  /* =======================================================
     DECISION EXPLANATION
     ======================================================= */

  const decisionConclusion =
    highCompetition
      ? (
        "Lazimpat is strong enough to remain on the shortlist, but nearby competition and unresolved property conditions mean the evidence does not yet justify signing a lease."
      )
      : (
        "Lazimpat is strong enough to remain on the shortlist, but unresolved property conditions mean the evidence does not yet justify signing a lease."
      );


  const competitionInterpretation =
    highCompetition
      ? (
        `${competitors500} mapped Pilates competitors lie within 500 m, indicating proven demand but high direct competitive pressure.`
      )
      : (
        `${competitors500} mapped Pilates competitors lie within 500 m, indicating relatively limited mapped direct competition.`
      );


  const propertyInterpretation =
    completedGates ===
    gates.length &&
    gates.length >
    0
      ? (
        "All current property decision gates are marked complete."
      )
      : (
        `${pendingGates} of ${gates.length} property and commercial checks remain unresolved.`
      );


  /* =======================================================
     BRAND UPDATE
     ======================================================= */

  document.title =
    "Site A Decision View — Kathmandu Pilates GIS";


  const brandEyebrow =
    document.querySelector(
      ".brand .eyebrow"
    );


  const versionPill =
    document.querySelector(
      ".version-pill"
    );


  const brandDescription =
    document.querySelector(
      ".brand > p"
    );


  if (
    brandEyebrow
  ) {
    brandEyebrow.textContent =
      "SUMITA DIDI PROJECT · GIS v1.3";
  }


  if (
    versionPill
  ) {
    versionPill.textContent =
      "DECISION VIEW";
  }


  if (
    brandDescription
  ) {
    brandDescription.textContent =
      "Decision-led screening for the Lazimpat benchmark property.";
  }


  const mapTitle =
    document.querySelector(
      ".map-title-chip strong"
    );


  const mapSubtitle =
    document.querySelector(
      ".map-title-chip span"
    );


  if (
    mapTitle
  ) {
    mapTitle.textContent =
      "Site A · Conditional candidate";
  }


  if (
    mapSubtitle
  ) {
    mapSubtitle.textContent =
      "Property survey required before lease";
  }


  const mobileToggleText =
    document.querySelector(
      "#mobileSidebarToggle span"
    );


  if (
    mobileToggleText
  ) {
    mobileToggleText.textContent =
      "Decision";
  }


  /* =======================================================
     DECISION TAB
     ======================================================= */

  const tabs =
    document.querySelector(
      ".workspace-tabs"
    );


  const existingDecisionTab =
    document.querySelector(
      '.workspace-tab[data-panel="decision"]'
    );


  const decisionTab =
    existingDecisionTab ||
    document.createElement(
      "button"
    );


  if (
    !existingDecisionTab &&
    tabs
  ) {
    decisionTab.type =
      "button";

    decisionTab.className =
      "workspace-tab";

    decisionTab.dataset.panel =
      "decision";

    decisionTab.textContent =
      "Decision";

    tabs.insertBefore(
      decisionTab,
      tabs.firstElementChild
    );
  }


  /* =======================================================
     DECISION PANEL
     ======================================================= */

  const existingPanel =
    document.querySelector(
      '[data-panel-view="decision"]'
    );


  const decisionPanel =
    existingPanel ||
    document.createElement(
      "section"
    );


  decisionPanel.className =
    "workspace-panel decision-panel";


  decisionPanel.dataset.panelView =
    "decision";


  const nearestName =
    nearestCompetitor
      ? nearestCompetitor
        .item
        .name
      : "No mapped competitor";


  const nearestDistance =
    nearestCompetitor
      ? formatDistance(
        nearestCompetitor.distance
      )
      : "—";


  const areaRank =
    lazimpatCandidate
      ?.rank
      ? `#${lazimpatCandidate.rank}`
      : "—";


  const decision =
    ASSESSMENT.decision;


  decisionPanel.innerHTML = `
    <div class="panel-heading decision-panel-heading">

      <div>
        <span class="eyebrow">
          EXECUTIVE DECISION
        </span>

        <h2>
          Should Site A proceed?
        </h2>
      </div>

      <span class="decision-version">
        GIS v${escapeHtml(
          ASSESSMENT.meta.version
        )}
      </span>

    </div>


    <section class="decision-hero">

      <div class="decision-status-row">

        <span class="decision-status-dot"></span>

        <strong>
          ${escapeHtml(
            decision.statusLabel
          )}
        </strong>

      </div>

      <h3>
        ${escapeHtml(
          decision.headline
        )}
      </h3>

      <p>
        ${escapeHtml(
          decision.meaning
        )}
      </p>

      <span class="decision-confidence">
        ${escapeHtml(
          decision.confidenceLabel
        )}
      </span>

    </section>


    <section class="decision-conclusion">

      <span>
        WHAT THE VIEWER SHOULD CONCLUDE
      </span>

      <strong>
        ${escapeHtml(
          decisionConclusion
        )}
      </strong>

    </section>


    <div class="decision-score-grid">

      <article class="decision-score-card">

        <span>
          Area suitability
        </span>

        <strong>
          ${areaScore.toFixed(1)}
        </strong>

        <small>
          /100 · ${escapeHtml(
            scoreBand.label
          )}
        </small>

      </article>


      <article class="decision-score-card property-pending">

        <span>
          Property suitability
        </span>

        <strong>
          Pending
        </strong>

        <small>
          ${pendingGates} checks unresolved
        </small>

      </article>


      <article class="decision-score-card decision-action-card">

        <span>
          Current action
        </span>

        <strong>
          Survey
        </strong>

        <small>
          Do not sign lease yet
        </small>

      </article>

    </div>


    <section class="decision-block">

      <div class="decision-section-heading">

        <div>
          <span class="eyebrow">
            EXPLAINABLE STATUS
          </span>

          <h3>
            Why this is conditional
          </h3>
        </div>

      </div>


      <div class="decision-logic-list">

        <article class="decision-logic-row positive">

          <span class="logic-icon">
            1
          </span>

          <div>

            <strong>
              Area evidence is promising
            </strong>

            <p>
              ${areaScore.toFixed(1)}/100 falls in the
              “${escapeHtml(
                scoreBand.label
              )}” project screening band.
            </p>

          </div>

        </article>


        <article class="decision-logic-row caution">

          <span class="logic-icon">
            2
          </span>

          <div>

            <strong>
              Competition is concentrated
            </strong>

            <p>
              ${escapeHtml(
                competitionInterpretation
              )}
            </p>

          </div>

        </article>


        <article class="decision-logic-row pending">

          <span class="logic-icon">
            3
          </span>

          <div>

            <strong>
              The building is not yet proven
            </strong>

            <p>
              ${escapeHtml(
                propertyInterpretation
              )}
            </p>

          </div>

        </article>

      </div>

    </section>


    <section class="decision-block">

      <div class="decision-section-heading">

        <div>
          <span class="eyebrow">
            CURRENT MAPPED EVIDENCE
          </span>

          <h3>
            What the map proves so far
          </h3>
        </div>

      </div>


      <div class="decision-evidence-grid">

        <article>
          <strong>
            ${competitors500}
          </strong>

          <span>
            mapped Pilates within 500 m
          </span>
        </article>


        <article>
          <strong>
            ${nearestDistance}
          </strong>

          <span title="${escapeHtml(
            nearestName
          )}">
            nearest mapped competitor
          </span>
        </article>


        <article>
          <strong>
            ${areaRank}
          </strong>

          <span>
            provisional Kathmandu area rank
          </span>
        </article>


        <article>
          <strong>
            ${completedGates}/${gates.length}
          </strong>

          <span>
            property checks completed
          </span>
        </article>

      </div>


      <div class="decision-evidence-note">

        <strong>
          Nearest mapped studio:
        </strong>

        <span>
          ${escapeHtml(
            nearestName
          )}
          ·
          ${nearestDistance}
          straight-line
        </span>

      </div>

    </section>


    <section class="decision-block">

      <div class="decision-section-heading">

        <div>
          <span class="eyebrow">
            INTERPRETATION
          </span>

          <h3>
            Why it may work — and why it may fail
          </h3>
        </div>

      </div>


      <div class="decision-case-grid">

        <article class="decision-case positive">

          <h4>
            Why it may work
          </h4>

          <ul>
            ${listHtml(
              ASSESSMENT
                .interpretation
                .strengths,
              "positive"
            )}
          </ul>

        </article>


        <article class="decision-case caution">

          <h4>
            Why it may fail
          </h4>

          <ul>
            ${listHtml(
              ASSESSMENT
                .interpretation
                .cautions,
              "caution"
            )}
          </ul>

        </article>

      </div>


      <p class="decision-interpretation-summary">
        ${escapeHtml(
          ASSESSMENT
            .interpretation
            .summary
        )}
      </p>

    </section>


    <section class="decision-next-action">

      <span class="eyebrow">
        RECOMMENDED NEXT ACTION
      </span>

      <h3>
        Complete property due diligence before negotiating a lease.
      </h3>

      <ol>

        <li>
          Inspect access, parking, frontage, noise and natural light.
        </li>

        <li>
          Record rent, usable floor area, layout and lease conditions.
        </li>

        <li>
          Test customer demand and define a differentiated studio offer.
        </li>

      </ol>

      <div class="decision-button-row">

        <button
          id="decisionFocusMap"
          class="button primary"
          type="button"
        >
          Open Site A map
        </button>

        <button
          id="decisionOpenSitePanel"
          class="button secondary"
          type="button"
        >
          Spatial details
        </button>

      </div>

    </section>


    <section
      class="decision-block"
      id="decisionGateSection"
    >

      <div class="decision-section-heading gate-heading">

        <div>
          <span class="eyebrow">
            LEASE DECISION GATES
          </span>

          <h3>
            ${pendingGates} unresolved checks
          </h3>
        </div>

        <span class="gate-progress-label">
          ${completedGates}/${gates.length}
        </span>

      </div>


      <div class="gate-progress-track">

        <span
          style="width:${gateProgress}%"
        ></span>

      </div>


      <div class="decision-gate-list">

        ${gates
          .map(
            (
              gate,
              index
            ) => `
              <article class="decision-gate">

                <span class="gate-number">
                  ${index + 1}
                </span>

                <div>

                  <div class="gate-title-row">

                    <strong>
                      ${escapeHtml(
                        gate.label
                      )}
                    </strong>

                    <span class="gate-status">
                      ${
                        gate.status ===
                        "complete"
                          ? "Checked"
                          : "Pending"
                      }
                    </span>

                  </div>

                  <p>
                    ${escapeHtml(
                      gate.question
                    )}
                  </p>

                </div>

              </article>
            `
          )
          .join("")}

      </div>

    </section>


    <details class="decision-details">

      <summary>
        Possible differentiation strategies
      </summary>

      <ul>
        ${listHtml(
          ASSESSMENT
            .differentiationOptions,
          "differentiation"
        )}
      </ul>

    </details>


    <details class="decision-details">

      <summary>
        Evidence limitations
      </summary>

      <ul>
        ${listHtml(
          ASSESSMENT.caveats,
          "caveat"
        )}
      </ul>

    </details>
  `;


  if (
    !existingPanel
  ) {
    const firstPanel =
      document.querySelector(
        ".workspace-panel"
      );

    if (
      firstPanel
    ) {
      firstPanel.parentNode.insertBefore(
        decisionPanel,
        firstPanel
      );
    }
  }


  /* =======================================================
     MOBILE FIRST-SCREEN DECISION CARD
     ======================================================= */

  const mapPanel =
    document.querySelector(
      ".map-panel"
    );


  const existingMapCard =
    document.getElementById(
      "decisionMapCard"
    );


  const decisionMapCard =
    existingMapCard ||
    document.createElement(
      "article"
    );


  decisionMapCard.id =
    "decisionMapCard";


  decisionMapCard.className =
    "decision-map-card";


  decisionMapCard.tabIndex =
    0;


  decisionMapCard.setAttribute(
    "role",
    "button"
  );


  decisionMapCard.setAttribute(
    "aria-label",
    "Open Site A decision brief"
  );


  decisionMapCard.innerHTML = `
    <div class="decision-map-card-copy">

      <span>
        CURRENT DECISION
      </span>

      <strong>
        ${escapeHtml(
          decision.statusLabel
        )}
      </strong>

      <small>
        Survey property before lease
      </small>

    </div>

    <div class="decision-map-card-score">

      <strong>
        ${areaScore.toFixed(1)}
      </strong>

      <span>
        area
      </span>

    </div>
  `;


  if (
    !existingMapCard &&
    mapPanel
  ) {
    mapPanel.appendChild(
      decisionMapCard
    );
  }


  /* =======================================================
     PANEL SWITCHING
     ======================================================= */

  function activatePanel(
    panelName
  ) {
    document
      .querySelectorAll(
        ".workspace-tab"
      )
      .forEach(
        tab => {
          tab.classList.toggle(
            "active",
            tab.dataset.panel ===
            panelName
          );
        }
      );


    document
      .querySelectorAll(
        ".workspace-panel"
      )
      .forEach(
        panel => {
          panel.classList.toggle(
            "active",
            panel.dataset.panelView ===
            panelName
          );
        }
      );
  }


  function openDecisionPanel() {
    activatePanel(
      "decision"
    );

    const sidebar =
      document.getElementById(
        "sidebar"
      );

    if (
      isMobile() &&
      sidebar
    ) {
      sidebar.classList.add(
        "open"
      );
    }
  }


  function closeMobileDrawer() {
    const sidebar =
      document.getElementById(
        "sidebar"
      );

    if (
      isMobile() &&
      sidebar
    ) {
      sidebar.classList.remove(
        "open"
      );
    }
  }


  function openSiteMap() {
    const focusButton =
      document.getElementById(
        "focusSite"
      );

    focusButton?.click();

    closeMobileDrawer();
  }


  function openSitePanel() {
    const siteTab =
      document.querySelector(
        '.workspace-tab[data-panel="site"]'
      );

    siteTab?.click();
  }


  decisionTab.addEventListener(
    "click",
    openDecisionPanel
  );


  decisionMapCard.addEventListener(
    "click",
    openDecisionPanel
  );


  decisionMapCard.addEventListener(
    "keydown",
    event => {
      if (
        event.key ===
        "Enter" ||
        event.key ===
        " "
      ) {
        event.preventDefault();

        openDecisionPanel();
      }
    }
  );


  decisionPanel
    .querySelector(
      "#decisionFocusMap"
    )
    ?.addEventListener(
      "click",
      openSiteMap
    );


  decisionPanel
    .querySelector(
      "#decisionOpenSitePanel"
    )
    ?.addEventListener(
      "click",
      openSitePanel
    );


  /* =======================================================
     UPDATE EXISTING SITE A CALLOUT
     ======================================================= */

  const existingCallout =
    document.querySelector(
      '.workspace-panel[data-panel-view="site"] .analysis-callout'
    );


  if (
    existingCallout
  ) {
    const heading =
      existingCallout.querySelector(
        "strong"
      );

    const paragraph =
      existingCallout.querySelector(
        "p"
      );

    if (
      heading
    ) {
      heading.textContent =
        "Current recommendation";
    }

    if (
      paragraph
    ) {
      paragraph.textContent =
        "Keep Site A on the shortlist and begin property due diligence. The 77.5 area score is not lease approval.";
    }
  }


  /* =======================================================
     INITIAL VIEW
     ======================================================= */

  activatePanel(
    "decision"
  );

})();