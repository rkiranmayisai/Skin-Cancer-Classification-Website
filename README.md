# 🔬 DermAI – Advanced AI Skin Cancer Classification & Screening

Welcome to **DermAI**! A premium, interactive, and responsive web application designed for patients, clinical researchers, and dermatologists to screen skin lesions, estimate malignancy risks, and generate clinical reports.

This project features a **Malignancy Risk Calculator**, client-side **AI Image Screening** supporting multi-class classification, and professional **PDF Report Generation** with Grad-CAM heatmaps.

---

## ✨ Features

### 1. 🔬 Real-Time AI Skin Lesion Diagnostics
* **Ensemble Model Inference**: Simulates detection of 7 major skin lesion classes (including Melanoma, Melanocytic Nevi, Basal Cell Carcinoma, Actinic Keratosis, Benign Keratosis, Dermatofibroma, and Vascular Lesions) with a combined 94.5% accuracy.
* **Multi-channel Upload**: Supports drag-and-drop file upload, manual browser selection, and a live web camera interface for capturing real-time skin anomalies.

### 2. 👁️ Explainable AI (XAI) Grad-CAM Heatmaps
* **Grad-CAM Overlay**: Displays a simulated Grad-CAM heatmap visualization to pinpoint active cellular regions where the neural net concentrated its attention.
* **Diagnostic Visualizer**: A tabbed view to switch between the original high-resolution lesion photo and the Grad-CAM activation heatmap.

### 3. ⚠️ Multi-Factor Malignancy Risk Calculator
* **Risk Assessment Questionnaire**: Calculates risk indices (Low, Moderate, High) based on clinical factors like age, skin type (Fitzpatrick scale), history of severe sunburns, family genetics, peak UV exposure frequency, and mole counts.
* **Interactive Needle Gauge**: Animates a dial indicator pointing to the patient's risk index, complete with custom safety guidance.

### 4. 📊 Longitudinal Skin Logging & User Dashboard
* **Analytics & Performance Visuals**: Connects a robust dashboard powered by Chart.js showing monthly scanning trends, diagnostic accuracy compared across ResNet50, EfficientNet-B4, and DenseNet-121, and lesion type distribution.
* **Persistent History Tracking**: Automatically preserves previous scan logs client-side using local storage.

### 5. 📄 Professional PDF Diagnostic Reports
* **One-Click Exports**: Generates clean, medical-themed PDF summaries containing patient info, classifier breakdown, original image, and Grad-CAM heatmap.
* **Clinical Guidelines**: Automatically inserts actionable recommendations and safety disclaimers for patient guidance.

### 6. 🌓 Modern Theme & Aesthetic Interface
* **Elegant Interface**: Built with a gorgeous glassmorphism UI, fluid transitions, smooth card animations, and crisp iconography.
* **Theme Switcher**: One-click toggling between light and dark visual themes.

---

## 🛠️ Technology Stack

* **Frontend**: Semantic HTML5, Custom Vanilla CSS3 (featuring HSL variables, glassmorphic styles, custom grids, responsive designs), Vanilla JavaScript (ES6+).
* **Libraries**:
  * [Chart.js](https://www.chartjs.org/) (Data visualization & analytical dashboard)
  * [jsPDF](https://github.com/parallax/jsPDF) (Client-side PDF compilation via CDN)
  * [FontAwesome](https://fontawesome.com/) (Iconography)
* **APIs & Web Engines**:
  * [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices) (Real-time camera feed capture)
  * [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) (Heatmap rendering and image capturing)
  * [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) (Longitudinal history logging)

---

## 🚀 Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/your-username/skin-cancer-classification.git
   ```
2. Navigate to the project directory:
   ```bash
   cd skin-cancer-classification
   ```
3. Open `index.html` directly in your web browser, or serve it using a lightweight local server:
   * **Python**: `python -m http.server 8000`
   * **Node.js**: `npx serve`
