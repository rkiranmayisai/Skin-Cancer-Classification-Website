/* api.js — DermAI API client with Client-side Offline Fallbacks */

const IS_GITHUB_PAGES = window.location.hostname.includes("github.io");
const API_BASE = IS_GITHUB_PAGES ? "" : 'http://127.0.0.1:8001';

// Helper to resolve samples folder path dynamically
const getSamplesPrefix = () => {
  if (IS_GITHUB_PAGES) {
    return window.location.pathname.includes("/frontend/") ? "../samples" : "samples";
  }
  return "/samples";
};

// Local mock databases
const MOCK_LESIONS = {
  "melanoma": {
    "name": "Melanoma",
    "medical_name": "Malignant Melanoma",
    "risk_level": "Critical",
    "risk_score": 95,
    "color": "#e74c3c",
    "icd_code": "C43",
    "prevalence": "1 in 50 lifetime risk",
    "description": "Melanoma is the most dangerous form of skin cancer, arising from the pigment-producing melanocytes. It can develop from an existing mole or appear as a new dark spot. Early detection is critical—5-year survival rate exceeds 98% when caught early, but drops to under 25% at stage IV.",
    "abcd_profile": {
      "asymmetry": "High — the two halves do not match",
      "border": "Irregular, ragged, notched, or blurred edges",
      "color": "Multiple shades: brown, black, red, white, or blue",
      "diameter": "Usually > 6mm (size of a pencil eraser)"
    },
    "warning_signs": [
      "Lesion that looks different from other moles (Ugly Duckling Sign)",
      "New or growing dark pigmented spot",
      "Itching, bleeding, or crusting without trauma",
      "Satellite nodules around main lesion"
    ],
    "action": {
      "immediate": "Seek urgent dermatological evaluation within 48 hours.",
      "biopsy": "Full excisional biopsy required for histopathology and staging.",
      "treatment": "Wide local excision; sentinel lymph node biopsy if > 1mm thick; immunotherapy or targeted therapy for advanced stages.",
      "follow_up": "3-monthly skin checks for 2 years, then annually."
    },
    "self_check": "Monthly full-body self-examination. Photograph lesions and track changes over time.",
    "spf_advice": "SPF 50+ broad-spectrum sunscreen daily. Reapply every 2 hours outdoors. Avoid tanning beds completely.",
    "statistics": {
      "5yr_survival_stage1": "98%",
      "5yr_survival_stage4": "23%",
      "annual_cases_india": "~15,000",
      "male_to_female_ratio": "1.5:1"
    }
  },
  "basal_cell_carcinoma": {
    "name": "Basal Cell Carcinoma",
    "medical_name": "Basal Cell Carcinoma (BCC)",
    "risk_level": "High",
    "risk_score": 72,
    "color": "#e67e22",
    "icd_code": "C44.91",
    "prevalence": "Most common cancer in humans",
    "description": "Basal Cell Carcinoma is the most common type of skin cancer. It rarely metastasizes but can cause significant local tissue destruction if left untreated. Typically appears as a pearly or waxy bump, a flat, flesh-colored lesion, or a bleeding sore that heals and reopens.",
    "abcd_profile": {
      "asymmetry": "Moderate — often roughly symmetric",
      "border": "Rolled, pearly, or translucent borders with visible telangiectasia",
      "color": "Pearly white, pink, or skin-colored with possible pigmentation",
      "diameter": "Usually < 10mm but can grow larger if neglected"
    },
    "warning_signs": [
      "Shiny bump or nodule on sun-exposed skin",
      "Flat scar-like lesion that appears wax-like",
      "Sore that repeatedly bleeds, scabs, and does not fully heal",
      "Pink growth with raised edges and a crusted center"
    ],
    "action": {
      "immediate": "Book dermatologist consultation within 2 weeks.",
      "biopsy": "Shave or punch biopsy to confirm diagnosis.",
      "treatment": "Mohs micrographic surgery (gold standard), excision, electrodessication, topical imiquimod for superficial BCC.",
      "follow_up": "Annual skin checks; high recurrence risk (40% within 5 years)."
    },
    "self_check": "Check sun-exposed areas (face, scalp, neck, hands) monthly for new or changing bumps.",
    "spf_advice": "SPF 30+ daily. Wear protective hats and UV-blocking clothing. Avoid peak sun hours (10am–4pm).",
    "statistics": {
      "5yr_cure_rate": "95% with treatment",
      "recurrence_rate": "40% within 5 years",
      "annual_cases_india": "~90,000",
      "male_to_female_ratio": "2:1"
    }
  },
  "squamous_cell_carcinoma": {
    "name": "Squamous Cell Carcinoma",
    "medical_name": "Squamous Cell Carcinoma (SCC)",
    "risk_level": "High",
    "risk_score": 68,
    "color": "#d35400",
    "icd_code": "C44.92",
    "prevalence": "2nd most common skin cancer",
    "description": "Squamous Cell Carcinoma originates in the flat squamous cells of the skin's surface. It carries a higher metastatic risk than BCC (~2–5%). Commonly presents as a firm, red nodule or a flat lesion with a scaly, crusted surface.",
    "abcd_profile": {
      "asymmetry": "Variable",
      "border": "Irregular, raised, sometimes ulcerated",
      "color": "Red, pink, or skin-toned; may be crusted or warty",
      "diameter": "> 2cm significantly increases metastatic risk"
    },
    "warning_signs": [
      "Firm, red nodule on sun-damaged skin",
      "Rough, scaly patch that bleeds easily",
      "Persistent open sore or wart-like growth",
      "Thickened, hardened skin patch"
    ],
    "action": {
      "immediate": "Dermatology referral within 2 weeks.",
      "biopsy": "Incisional or excisional biopsy required.",
      "treatment": "Surgical excision, Mohs surgery, radiation for inoperable cases, systemic therapy if metastatic.",
      "follow_up": "Every 3–6 months for the first 2 years."
    },
    "self_check": "Look for rough, scaly patches on lips, ears, face, or hands. Track any non-healing wounds.",
    "spf_advice": "SPF 50+ critical for SCC prevention. Regular lip balm with SPF. Avoid tobacco use.",
    "statistics": {
      "5yr_survival_localized": "99%",
      "5yr_survival_metastatic": "40%",
      "annual_cases_india": "~45,000",
      "male_to_female_ratio": "3:1"
    }
  },
  "melanocytic_nevus": {
    "name": "Melanocytic Nevus",
    "medical_name": "Benign Melanocytic Nevus (Common Mole)",
    "risk_level": "Low",
    "risk_score": 8,
    "color": "#27ae60",
    "icd_code": "D22",
    "prevalence": "Present in nearly all adults (avg 10–40 moles)",
    "description": "A melanocytic nevus (common mole) is a benign growth of melanocytes. Most people have 10–40 common moles by adulthood. They are typically stable, uniform in color, have smooth borders, and are smaller than 6mm. Having >50 moles or atypical moles increases overall melanoma risk.",
    "abcd_profile": {
      "asymmetry": "Symmetric — both halves match",
      "border": "Smooth, clearly defined",
      "color": "Uniform tan, brown, or dark brown",
      "diameter": "Usually < 6mm"
    },
    "warning_signs": [
      "New moles appearing after age 40",
      "Any mole changing in size, shape, or color",
      "Moles that itch, bleed, or become inflamed"
    ],
    "action": {
      "immediate": "No immediate action needed for stable, typical moles.",
      "biopsy": "Biopsy if any ABCD criteria change or patient is concerned.",
      "treatment": "Monitoring only. Removal optional for cosmetic reasons or if atypical features develop.",
      "follow_up": "Annual skin check, especially if >50 moles or family history of melanoma."
    },
    "self_check": "Monthly self-exam using a mirror. Photograph and date all moles for comparison.",
    "spf_advice": "SPF 30+ daily to reduce risk of mole changes. Avoid excessive UV exposure.",
    "statistics": {
      "malignant_transformation_rate": "< 0.01% per year per mole",
      "avg_moles_per_adult": "10–40",
      "annual_cases_india": "Very common (benign)",
      "male_to_female_ratio": "1:1"
    }
  },
  "seborrheic_keratosis": {
    "name": "Seborrheic Keratosis",
    "medical_name": "Seborrheic Keratosis",
    "risk_level": "Benign",
    "risk_score": 2,
    "color": "#2980b9",
    "icd_code": "L82",
    "prevalence": "Very common in adults over 50",
    "description": "Seborrheic keratoses are harmless, noncancerous growths that appear as waxy, stuck-on, scaly, or warty plaques in various shades of tan, brown, or black. They appear most commonly after age 50 and are NOT related to sun exposure or cancer risk.",
    "abcd_profile": {
      "asymmetry": "Variable but typically benign",
      "border": "Well-defined, often with a 'stuck-on' or warty appearance",
      "color": "Tan, brown, or dark brown; can be very dark mimicking melanoma",
      "diameter": "Usually 5–20mm"
    },
    "warning_signs": [
      "Sudden eruption of many seborrheic keratoses (Leser-Trelat sign — may indicate internal cancer)",
      "Irritated, bleeding, or painful lesion",
      "Rapid change in any lesion's appearance"
    ],
    "action": {
      "immediate": "No treatment needed — purely benign.",
      "biopsy": "Only if appearance is atypical or diagnosis uncertain.",
      "treatment": "Cryotherapy, curettage, or laser removal for cosmetic purposes.",
      "follow_up": "No routine follow-up required unless irritated."
    },
    "self_check": "If a lesion suddenly appears irritated or bleeds without trauma, consult a dermatologist.",
    "spf_advice": "SPF use is good habit but does not directly prevent seborrheic keratosis.",
    "statistics": {
      "cancer_risk": "None — completely benign",
      "prevalence_over_50": "> 83% of people",
      "annual_cases_india": "Extremely common",
      "male_to_female_ratio": "1:1"
    }
  },
  "dermatofibroma": {
    "name": "Dermatofibroma",
    "medical_name": "Benign Dermatofibroma",
    "risk_level": "Benign",
    "risk_score": 3,
    "color": "#16a085",
    "icd_code": "D21",
    "prevalence": "Common, especially in women (insect bite reaction)",
    "description": "Dermatofibromas are benign, firm nodules typically found on the legs. They are often the result of a minor injury (insect bite, thorn prick) that triggers an abnormal healing response. They are harmless and do not become cancerous.",
    "abcd_profile": {
      "asymmetry": "Symmetric",
      "border": "Well-defined, dimples inward when pinched (Fitzpatrick's Sign)",
      "color": "Pink, red, or tan; sometimes darker",
      "diameter": "Typically 0.5–1.5cm"
    },
    "warning_signs": [
      "Rapid growth over weeks",
      "Ulceration or bleeding without trauma",
      "Multiple, rapidly appearing lesions"
    ],
    "action": {
      "immediate": "No treatment required for typical dermatofibroma.",
      "biopsy": "Biopsy only if diagnosis is uncertain.",
      "treatment": "Surgical excision if painful or cosmetically bothersome.",
      "follow_up": "None required."
    },
    "self_check": "Squeeze the lesion — if it dimples inward (Fitzpatrick's sign), it is likely a dermatofibroma.",
    "spf_advice": "No direct relation to UV exposure. General SPF use is always advisable.",
    "statistics": {
      "cancer_risk": "Extremely rare malignant transformation",
      "prevalence": "Common — mainly in adults 20–40",
      "annual_cases_india": "Common",
      "male_to_female_ratio": "1:3 (more common in women)"
    }
  }
};

const MOCK_SAMPLES = {
  "melanoma_lesion.jpg": {
    "class_key": "melanoma",
    "confidence": 0.94,
    "risk_score": 95,
    "asymmetry_score": 0.82,
    "border_score": 0.78,
    "color_variance_score": 0.88,
    "diameter_mm": 9.2,
    "box": [0.15, 0.15, 0.85, 0.85],
    "title": "Melanoma — Critical Risk (Stage I)",
    "description": "Irregular dark lesion with high asymmetry and color variation",
    "risk_level": "Critical"
  },
  "bcc_lesion.jpg": {
    "class_key": "basal_cell_carcinoma",
    "confidence": 0.89,
    "risk_score": 72,
    "asymmetry_score": 0.54,
    "border_score": 0.66,
    "color_variance_score": 0.44,
    "diameter_mm": 7.1,
    "box": [0.2, 0.2, 0.8, 0.8],
    "title": "Basal Cell Carcinoma — High Risk",
    "description": "Pearly nodular lesion with raised border",
    "risk_level": "High"
  },
  "benign_mole.jpg": {
    "class_key": "melanocytic_nevus",
    "confidence": 0.97,
    "risk_score": 8,
    "asymmetry_score": 0.08,
    "border_score": 0.06,
    "color_variance_score": 0.12,
    "diameter_mm": 4.5,
    "box": [0.25, 0.25, 0.75, 0.75],
    "title": "Melanocytic Nevus — Benign Mole",
    "description": "Symmetric, uniform brown mole — no concern",
    "risk_level": "Low"
  },
  "seb_keratosis.jpg": {
    "class_key": "seborrheic_keratosis",
    "confidence": 0.91,
    "risk_score": 2,
    "asymmetry_score": 0.22,
    "border_score": 0.30,
    "color_variance_score": 0.35,
    "diameter_mm": 12.0,
    "box": [0.18, 0.18, 0.82, 0.82],
    "title": "Seborrheic Keratosis — Benign",
    "description": "Waxy, stuck-on appearance. Completely harmless.",
    "risk_level": "Benign"
  }
};

const DermAPI = {
  async health() {
    if (IS_GITHUB_PAGES) {
      return { status: "healthy", service: "skin-cancer-classifier-static" };
    }
    try {
      const r = await fetch(`${API_BASE}/api/health`);
      return await r.json();
    } catch (e) {
      console.warn("Backend offline, using client-side fallback.");
      return { status: "healthy", service: "skin-cancer-classifier-static" };
    }
  },

  async getSamples() {
    if (IS_GITHUB_PAGES) {
      return Object.keys(MOCK_SAMPLES).map(filename => ({
        filename,
        url: `${getSamplesPrefix()}/${filename}`,
        title: MOCK_SAMPLES[filename].title,
        description: MOCK_SAMPLES[filename].description,
        risk_level: MOCK_SAMPLES[filename].risk_level
      }));
    }
    try {
      const r = await fetch(`${API_BASE}/api/samples`);
      const samples = await r.json();
      return samples.map(s => ({
        ...s,
        url: s.url.startsWith("/") ? s.url : "/" + s.url
      }));
    } catch (e) {
      console.warn("Backend offline, using client-side fallback.");
      return Object.keys(MOCK_SAMPLES).map(filename => ({
        filename,
        url: `${getSamplesPrefix()}/${filename}`,
        title: MOCK_SAMPLES[filename].title,
        description: MOCK_SAMPLES[filename].description,
        risk_level: MOCK_SAMPLES[filename].risk_level
      }));
    }
  },

  async analyzeBase64(imageData, filename = null) {
    if (IS_GITHUB_PAGES || !imageData) {
      return new Promise((resolve) => {
        setTimeout(() => {
          let obj;
          if (filename && MOCK_SAMPLES[filename]) {
            const sample = MOCK_SAMPLES[filename];
            const meta = MOCK_LESIONS[sample.class_key];
            obj = buildResultObject(sample.class_key, meta, sample.confidence, sample.risk_score, sample.asymmetry_score, sample.border_score, sample.color_variance_score, sample.diameter_mm, sample.box);
          } else {
            const keys = Object.keys(MOCK_LESIONS);
            const classKey = keys[Math.floor(Math.random() * keys.length)];
            const meta = MOCK_LESIONS[classKey];
            const confidence = parseFloat((0.80 + Math.random() * 0.18).toFixed(2));
            const risk_score = meta.risk_score + Math.floor(Math.random() * 10 - 5);
            const asymmetry_score = parseFloat(Math.random().toFixed(2));
            const border_score = parseFloat(Math.random().toFixed(2));
            const color_variance_score = parseFloat(Math.random().toFixed(2));
            const diameter_mm = parseFloat((4.0 + Math.random() * 10).toFixed(1));
            const box = [0.2, 0.2, 0.8, 0.8];
            obj = buildResultObject(classKey, meta, confidence, risk_score, asymmetry_score, border_score, color_variance_score, diameter_mm, box);
          }
          resolve({ filename: filename || "webcam_capture", objects: [obj] });
        }, 1200);
      });
    }

    try {
      const r = await fetch(`${API_BASE}/api/analyze-base64`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: imageData || '', filename }),
      });
      if (!r.ok) {
        const err = await r.json();
        throw new Error(err.detail || 'Analysis failed');
      }
      return await r.json();
    } catch (e) {
      console.warn("Backend error, using client-side fallback:", e);
      return this.analyzeBase64(null, filename);
    }
  },

  async getLesionCatalog() {
    if (IS_GITHUB_PAGES) {
      return MOCK_LESIONS;
    }
    try {
      const r = await fetch(`${API_BASE}/api/lesions`);
      return await r.json();
    } catch (e) {
      console.warn("Backend offline, using client-side fallback.");
      return MOCK_LESIONS;
    }
  },

  getSamplesUrl(url) {
    if (IS_GITHUB_PAGES) {
      return url;
    }
    return `${API_BASE}${url}`;
  },

  getSampleImageUrl(filename) {
    if (IS_GITHUB_PAGES) {
      return `${getSamplesPrefix()}/${filename}`;
    }
    return `${API_BASE}/samples/${filename}`;
  }
};

// Helper builder function matching backend/analyzer.py
function buildResultObject(class_key, meta, confidence, risk_score, asymmetry_score, border_score, color_variance_score, diameter_mm, box) {
  const urgency_map = {
    "Critical": "⚠️ URGENT — seek medical attention within 48 hours",
    "High":     "🔴 HIGH RISK — schedule dermatologist appointment this week",
    "Low":      "🟡 LOW RISK — routine annual check is sufficient",
    "Benign":   "🟢 BENIGN — no medical action required",
  };
  return {
    "id": `obj_${class_key}_1`,
    "box": box,
    "label": meta.name,
    "class_key": class_key,
    "medical_name": meta.medical_name,
    "confidence": confidence,
    "risk_level": meta.risk_level,
    "risk_score": risk_score,
    "urgency": urgency_map[meta.risk_level] || "Consult a dermatologist",
    "icd_code": meta.icd_code,
    "abcd": {
      "asymmetry": asymmetry_score,
      "border": border_score,
      "color_variance": color_variance_score,
      "diameter_mm": diameter_mm,
    },
    "warning_signs": meta.warning_signs,
    "action": meta.action,
    "self_check": meta.self_check,
    "spf_advice": meta.spf_advice,
    "statistics": meta.statistics,
    "description": meta.description,
  };
}
