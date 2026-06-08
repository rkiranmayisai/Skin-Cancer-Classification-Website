/**
 * SKIN CANCER CLASSIFICATION WEBSITE
 * AI Prediction Simulation & Heatmap Logic
 */

const AIModel = {
  classes: [
    { name: 'Melanoma', code: 'MEL', type: 'Malignant', risk: 'High', description: 'Melanoma is the most serious form of skin cancer, arising from melanocytes. It can spread quickly if not treated early.', color: '--alert' },
    { name: 'Melanocytic Nevus', code: 'NV', type: 'Benign', risk: 'Low', description: 'Common moles. They are benign and extremely common. However, they should be monitored for changes.', color: '--success' },
    { name: 'Basal Cell Carcinoma', code: 'BCC', type: 'Malignant', risk: 'Medium', description: 'The most common type of skin cancer. It grows slowly and rarely spreads, but can damage surrounding tissues.', color: '--warning' },
    { name: 'Actinic Keratosis', code: 'AKIEC', type: 'Pre-malignant', risk: 'Medium', description: 'A rough, scaly patch on the skin caused by years of sun exposure. Can turn into squamous cell carcinoma.', color: '--warning' },
    { name: 'Benign Keratosis-like Lesions', code: 'BKL', type: 'Benign', risk: 'Low', description: 'Includes seborrheic keratoses, solar lentigines, and lichen-planus-like keratoses. Fully benign.', color: '--success' },
    { name: 'Dermatofibroma', code: 'DF', type: 'Benign', risk: 'Low', description: 'A common benign skin growth, typically small, firm, and red-to-brown. Often found on the legs.', color: '--success' },
    { name: 'Vascular Lesions', code: 'VASC', type: 'Benign', risk: 'Low', description: 'Includes cherry angiomas, angiokeratomas, pyogenic granulomas, and hemorrhage. Benign.', color: '--success' }
  ],

  recommendations: {
    Malignant: [
      "Consult a certified dermatologist or oncologist immediately for a physical biopsy.",
      "Avoid picking, scratching, or rubbing the lesion to prevent irritation.",
      "Limit sun exposure and use SPF 50+ broad-spectrum sunscreen on the area.",
      "Prepare a list of changes in the lesion (growth rate, color, bleeding) for your doctor."
    ],
    "Pre-malignant": [
      "Schedule a dermatologist visit within the next few weeks for a thorough screening.",
      "Use high SPF sunscreen daily and wear protective clothing.",
      "Perform monthly self-examinations to monitor if the lesion is growing or evolving.",
      "Avoid tanning beds and direct peak-hour sun exposure."
    ],
    Benign: [
      "No urgent action required. This lesion appears benign.",
      "Keep track of the mole using the ABCDE guidelines (Asymmetry, Border, Color, Diameter, Evolving).",
      "Get a routine skin check by a dermatologist annually.",
      "Maintain proper sun safety and skin hydration."
    ]
  },

  // Simulates AI classification
  predict(imageSrc, modelName = 'EfficientNet-B4') {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Deterministic prediction based on image source or random
        let selectedClass;
        let confidence;

        if (imageSrc.includes('melanoma') || Math.random() < 0.25) {
          selectedClass = this.classes[0]; // Melanoma
          confidence = 88.4 + Math.random() * 8.5;
        } else if (imageSrc.includes('nevus') || Math.random() < 0.5) {
          selectedClass = this.classes[1]; // Nevus
          confidence = 91.2 + Math.random() * 7.5;
        } else {
          const idx = Math.floor(Math.random() * (this.classes.length - 2)) + 2;
          selectedClass = this.classes[idx];
          confidence = 75.0 + Math.random() * 20.0;
        }

        confidence = parseFloat(confidence.toFixed(1));

        // Generate full prediction breakdown
        let remainingPct = 100 - confidence;
        const breakdown = this.classes.map(c => {
          if (c.code === selectedClass.code) {
            return { ...c, confidence };
          }
          const randomPortion = Math.random() * remainingPct;
          remainingPct -= randomPortion;
          return { ...c, confidence: parseFloat(randomPortion.toFixed(1)) };
        });

        // Sort breakdown by confidence descending
        breakdown.sort((a, b) => b.confidence - a.confidence);

        // Simulated Grad-CAM heatmap creation (canvas-based)
        const heatmapSrc = this.generateHeatmapCanvas(imageSrc);

        // Recommendations based on prediction class type
        const recs = this.recommendations[selectedClass.type] || this.recommendations.Benign;

        resolve({
          class: selectedClass.name,
          code: selectedClass.code,
          type: selectedClass.type,
          risk: selectedClass.risk,
          confidence,
          description: selectedClass.description,
          model: modelName,
          breakdown,
          heatmap: heatmapSrc,
          recommendations: recs
        });
      }, 2500); // Simulated delay
    });
  },

  // Generates Grad-CAM Heatmap overlay simulation
  generateHeatmapCanvas(imgSrc) {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');

    // Create a radial gradient for heat spot
    const x = 120 + Math.random() * 60;
    const y = 120 + Math.random() * 60;
    const r1 = 10;
    const r2 = 90 + Math.random() * 40;

    const grad = ctx.createRadialGradient(x, y, r1, x, y, r2);
    grad.addColorStop(0, 'rgba(211, 47, 47, 1.0)');     // Red center
    grad.addColorStop(0.2, 'rgba(245, 124, 0, 0.8)');   // Orange
    grad.addColorStop(0.5, 'rgba(255, 235, 59, 0.6)');   // Yellow
    grad.addColorStop(0.8, 'rgba(76, 175, 80, 0.3)');    // Green
    grad.addColorStop(1.0, 'rgba(33, 150, 243, 0.0)');   // Blue fading to transparent

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 300, 300);

    return canvas.toDataURL();
  }
};
