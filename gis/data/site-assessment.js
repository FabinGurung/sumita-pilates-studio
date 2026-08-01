window.SITE_ASSESSMENT = {
  meta: {
    version: "1.3",
    label: "Decision View",
    updated: "2026-08-01"
  },

  decision: {
    statusCode: "CONDITIONAL_CANDIDATE",
    statusLabel: "Conditional candidate",

    confidenceLabel:
      "Preliminary — area evidence only",

    headline:
      "Proceed to property survey — do not sign a lease yet.",

    meaning:
      "The Lazimpat area is promising enough to investigate, but the building itself has not yet passed the property-level checks required for a lease decision.",

    currentAction:
      "Advance to property due diligence",

    finalDecision:
      "Lease decision pending",

    reviewOwner:
      "Project team / property survey"
  },

  /*
   * These are project-defined screening bands.
   * They are not an external industry standard.
   */
  scoreBands: [
    {
      min: 80,
      label: "Strong area candidate",

      explanation:
        "High-priority area for property search, subject to property due diligence."
    },

    {
      min: 75,
      label: "Promising but conditional",

      explanation:
        "Good enough to investigate, but important risks or unknowns remain."
    },

    {
      min: 70,
      label: "Watch / investigate",

      explanation:
        "Potential exists, but the area needs stronger evidence or a standout property."
    },

    {
      min: 0,
      label: "Lower priority",

      explanation:
        "Keep as a secondary option unless the property economics are exceptional."
    }
  ],

  interpretation: {
    strengths: [
      "Premium, central Lazimpat catchment",

      "Existing studios validate real Pilates demand",

      "Wellness and healthcare activity support specialist positioning",

      "Close to Baluwatar, Panipokhari, Naxal and central office demand"
    ],

    cautions: [
      "Several mapped Pilates competitors are very close",

      "Parking, access, rent and internal layout are still unknown",

      "The studio needs a clear reason for customers to choose it",

      "Current POI coverage is incomplete and distances are straight-line"
    ],

    summary:
      "Lazimpat looks like a proven premium Pilates market rather than an empty market. That reduces demand uncertainty, but raises the importance of property quality and differentiation."
  },

  /*
   * A final lease recommendation remains blocked until
   * these six decision gates are investigated.
   */
  decisionGates: [
    {
      id: "rent",

      label:
        "Rent and lease terms",

      question:
        "Is total occupancy cost sustainable under conservative membership assumptions?",

      status:
        "pending"
    },

    {
      id: "access",

      label:
        "Road access and parking",

      question:
        "Can clients arrive, park and leave without unacceptable friction?",

      status:
        "pending"
    },

    {
      id: "space",

      label:
        "Usable studio layout",

      question:
        "Does the floor plate support equipment, circulation, reception, changing and toilets?",

      status:
        "pending"
    },

    {
      id: "environment",

      label:
        "Light, noise and comfort",

      question:
        "Is the space calm, bright, ventilated and suitable for a premium wellness experience?",

      status:
        "pending"
    },

    {
      id: "differentiation",

      label:
        "Competitive differentiation",

      question:
        "Is the offer clearly different from nearby Pilates studios?",

      status:
        "pending"
    },

    {
      id: "demand",

      label:
        "Customer validation",

      question:
        "Do interviews, trial classes or pre-launch interest support the proposed price and schedule?",

      status:
        "pending"
    }
  ],

  differentiationOptions: [
    "Rehabilitation / posture-led Pilates",

    "Premium small-group reformer experience",

    "Women-focused privacy and service",

    "Beginner-friendly onboarding",

    "Corporate and hotel partnerships",

    "Distinct pricing, schedule or instructor proposition"
  ],

  thresholds: {
    /*
     * Three or more mapped competitors within 500 m
     * is treated as high competition for this project.
     */
    highCompetitionWithin500m: 3
  },

  caveats: [
    "Area scores are project screening values, not an external industry standard.",

    "Mapped business records are not a complete census of Kathmandu.",

    "Radial buffers measure straight-line distance, not actual travel time.",

    "A final recommendation requires property inspection and commercial due diligence."
  ]
};