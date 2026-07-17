# 🔬 DermAI – Skin Cancer Classification Platform

Welcome to **DermAI**! A premium, responsive web application designed to screen skin lesions, extract clinical ABCD criteria (Asymmetry, Border, Color, and Diameter), estimate malignancy risks, and generate clinical text reports. 

This version features a fully functional **Flask (Python) backend** that manages predictions and sample image catalogs, coupled with an interactive **glassmorphic frontend**.

---

## ✨ Features

### 1. 🔍 Live Lesion Scanner
* **Multi-channel Input**: Upload lesion photos, capture real-time frames using a webcam, or select from pre-loaded clinical sample images.
* **Canvas Visualization**: Renders the image on a canvas with animated scanning indicator lines, automatically drawing bounding box overlays around detected lesions with confidence levels.

### 2. 📏 Clinical ABCD Criteria Extraction
* **Quantitative Analysis**: Extracts and displays normalized scores for Asymmetry, Border irregularity, Color variance, and Diameter (in millimeters).
* **Progress Meter Bars**: Visually maps ABCD indicators on color-coded progress bars to highlight areas of concern.

### 3. ⚠️ Malignancy Risk Score & Clinical Assessment
* **Gauge Indicator**: Animates a radial dial pointing to the overall risk score (out of 100).
* **Clinical Info Grid**: Displays medical name, urgency, ICD-10 medical code classification, and customized SPF and sunscreen recommendations.

### 4. 📊 Analytical Dashboard
* **Scans Summary**: Counts total scans, critical findings, high-risk cases, and benign moles.
* **Dermatological Guidelines**: Showcases education blocks explaining self-checks, ABCD rules, sun protection, and the "Ugly Duckling" sign.

### 5. 📋 Lesion Catalog
* **Prevalence & Info Cards**: Explains common lesions (e.g. Melanoma, Basal Cell Carcinoma) with detailed descriptions, ICD codes, and prevalence statistics.

### 6. 🗂️ Persistent Scan History & CSV Exports
* **Scan Logging**: Saves scan details (ID, label, risk score, confidence, and timestamp) to a table.
* **Data Management**: Supports CSV data sheet exports and history clearance.

### 7. 📄 One-Click Report Exports
* **Diagnostic Report**: Generates a clean text file summary containing patient info, classifier breakdown, ABCD metrics, and actionable clinical advice.

---

## 🛠️ Technology Stack

* **Backend**: Python 3, Flask, Custom analyzer and data helpers.
* **Frontend**: HTML5, Custom CSS3 (featuring HSL design tokens, glassmorphism, responsive grids), Vanilla JavaScript (ES6+).
* **APIs**: Custom Local REST API connecting the frontend with the Flask python server.

---

## 🚀 Getting Started

### 1. Start the Flask Backend
Navigate to the directory and run the python app:
```bash
python run.py
# or
python backend/app.py
```
This launches the server at `http://127.0.0.1:5000`.

### 2. Launch the Frontend
Simply open the `frontend/index.html` file in your preferred web browser, or serve it using a lightweight local server:
* **Python**: `python -m http.server 8000` (from inside the `frontend` folder)
* **VS Code**: Use the Live Server extension.
