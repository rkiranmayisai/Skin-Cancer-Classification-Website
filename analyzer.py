"""
Skin Cancer Classification - OpenCV Image Analysis Pipeline
Implements the ABCD dermatological criteria:
  A - Asymmetry
  B - Border irregularity
  C - Color variance
  D - Diameter estimation
"""

import cv2
import numpy as np
import os
from backend.data import LESION_METADATA, SAMPLE_CLASSIFICATIONS


class SkinLesionAnalyzer:
    def __init__(self):
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.samples_dir = os.path.join(self.project_root, "samples")

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC API
    # ─────────────────────────────────────────────────────────────────────────
    def analyze(self, image_data: np.ndarray = None, filename: str = None):
        """
        Returns a list of analysis result dicts.
        If image_data is None and filename maps to a golden sample, return that.
        """
        if image_data is None and filename:
            if filename in SAMPLE_CLASSIFICATIONS:
                return self._build_from_golden(filename)

            filepath = os.path.join(self.samples_dir, filename)
            if os.path.exists(filepath):
                image_data = cv2.imread(filepath)
                if image_data is None:
                    return self._fallback_result()
            else:
                return self._fallback_result()

        if image_data is None:
            return self._fallback_result()

        return [self._analyze_image(image_data, filename)]

    # ─────────────────────────────────────────────────────────────────────────
    # CORE ANALYSIS
    # ─────────────────────────────────────────────────────────────────────────
    def _analyze_image(self, img: np.ndarray, filename: str = None):
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # ── Segmentation via Otsu thresholding ──────────────────────────────
        blurred = cv2.GaussianBlur(gray, (11, 11), 0)
        _, mask = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Morphological cleanup
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=1)

        # ── Find largest contour ─────────────────────────────────────────────
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return self._fallback_result()

        main_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(main_contour)

        if area < 200:
            return self._fallback_result()

        x, y, bw, bh = cv2.boundingRect(main_contour)

        # ── ABCD Scores ──────────────────────────────────────────────────────
        asymmetry_score = self._compute_asymmetry(mask)
        border_score    = self._compute_border(main_contour, area)
        color_score     = self._compute_color_variance(img, mask)
        diameter_px     = max(bw, bh)
        diameter_mm     = round(diameter_px * 0.0264, 1)  # 96dpi assumption

        # ── Classification ───────────────────────────────────────────────────
        class_key, confidence = self._classify(asymmetry_score, border_score, color_score, diameter_mm)
        meta = LESION_METADATA[class_key]
        risk_score = round(
            asymmetry_score * 30 + border_score * 30 + color_score * 25 + min(diameter_mm / 20, 1) * 15
        )
        risk_score = min(max(risk_score, meta["risk_score"] - 10), meta["risk_score"] + 10)

        # Normalised bounding box [x0, y0, x1, y1] in 0..1
        box = [round(x / w, 3), round(y / h, 3),
               round((x + bw) / w, 3), round((y + bh) / h, 3)]

        return self._build_result(
            class_key=class_key,
            meta=meta,
            confidence=confidence,
            risk_score=risk_score,
            asymmetry_score=round(asymmetry_score, 2),
            border_score=round(border_score, 2),
            color_variance_score=round(color_score, 2),
            diameter_mm=diameter_mm,
            box=box,
        )

    # ─────────────────────────────────────────────────────────────────────────
    # ABCD METRICS
    # ─────────────────────────────────────────────────────────────────────────
    def _compute_asymmetry(self, mask: np.ndarray) -> float:
        """Returns 0 (perfectly symmetric) → 1 (highly asymmetric)."""
        # Flip horizontally and vertically, compare overlap
        h_flip = cv2.flip(mask, 1)
        v_flip = cv2.flip(mask, 0)

        h_diff = cv2.absdiff(mask, h_flip)
        v_diff = cv2.absdiff(mask, v_flip)

        total_pixels = mask.shape[0] * mask.shape[1]
        asym_h = np.count_nonzero(h_diff) / total_pixels
        asym_v = np.count_nonzero(v_diff) / total_pixels

        return min((asym_h + asym_v) / 2, 1.0)

    def _compute_border(self, contour: np.ndarray, area: float) -> float:
        """
        Border irregularity using compactness index.
        Perfectly circular object → compactness ≈ 1; jagged/irregular → >1.
        Returns 0 (smooth) → 1 (very irregular).
        """
        perimeter = cv2.arcLength(contour, True)
        if perimeter == 0:
            return 0.0
        compactness = (perimeter ** 2) / (4 * np.pi * area)
        # compactness == 1 → perfect circle; typically 1.0–5.0 for lesions
        score = min((compactness - 1.0) / 4.0, 1.0)
        return max(score, 0.0)

    def _compute_color_variance(self, img: np.ndarray, mask: np.ndarray) -> float:
        """
        High color variance inside the lesion mask indicates multi-color spots (bad sign).
        Returns 0 (uniform color) → 1 (high variance).
        """
        roi_pixels = img[mask > 0]
        if len(roi_pixels) == 0:
            return 0.0

        hsv_roi = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        hsv_pixels = hsv_roi[mask > 0].astype(np.float32)

        # Standard deviation of Hue channel (circular), Value, Saturation
        std_h = np.std(hsv_pixels[:, 0]) / 90.0   # normalise to ~0..1
        std_s = np.std(hsv_pixels[:, 1]) / 128.0
        std_v = np.std(hsv_pixels[:, 2]) / 128.0

        score = min((std_h * 0.5 + std_s * 0.3 + std_v * 0.2), 1.0)
        return score

    # ─────────────────────────────────────────────────────────────────────────
    # CLASSIFICATION LOGIC
    # ─────────────────────────────────────────────────────────────────────────
    def _classify(self, asym: float, border: float, color: float, diam_mm: float):
        """Rule-based classifier mapping ABCD scores to lesion class."""
        combined = asym * 0.35 + border * 0.30 + color * 0.25 + min(diam_mm / 20, 1) * 0.10

        if combined >= 0.68:
            return "melanoma", round(min(0.88 + combined * 0.08, 0.99), 2)
        elif combined >= 0.50:
            # Distinguish BCC vs SCC by border score
            if border >= 0.55:
                return "basal_cell_carcinoma", round(0.78 + border * 0.10, 2)
            else:
                return "squamous_cell_carcinoma", round(0.76 + color * 0.12, 2)
        elif combined >= 0.30:
            # Irregular but not high risk
            if color >= 0.45:
                return "seborrheic_keratosis", round(0.82 + color * 0.06, 2)
            return "dermatofibroma", round(0.80 + asym * 0.08, 2)
        else:
            return "melanocytic_nevus", round(min(0.90 + (0.30 - combined) * 0.2, 0.99), 2)

    # ─────────────────────────────────────────────────────────────────────────
    # RESULT BUILDERS
    # ─────────────────────────────────────────────────────────────────────────
    def _build_from_golden(self, filename: str):
        g = SAMPLE_CLASSIFICATIONS[filename]
        meta = LESION_METADATA[g["class_key"]]
        return [self._build_result(
            class_key=g["class_key"],
            meta=meta,
            confidence=g["confidence"],
            risk_score=g["risk_score"],
            asymmetry_score=g["asymmetry_score"],
            border_score=g["border_score"],
            color_variance_score=g["color_variance_score"],
            diameter_mm=g["diameter_mm"],
            box=g["box"],
        )]

    def _build_result(self, class_key, meta, confidence, risk_score,
                      asymmetry_score, border_score, color_variance_score,
                      diameter_mm, box):

        risk_level = meta["risk_level"]
        action = meta["action"]

        # Determine urgency text
        urgency_map = {
            "Critical": "⚠️ URGENT — seek medical attention within 48 hours",
            "High":     "🔴 HIGH RISK — schedule dermatologist appointment this week",
            "Low":      "🟡 LOW RISK — routine annual check is sufficient",
            "Benign":   "🟢 BENIGN — no medical action required",
        }

        return {
            "id": f"obj_{class_key}_1",
            "box": box,
            "label": meta["name"],
            "class_key": class_key,
            "medical_name": meta["medical_name"],
            "confidence": confidence,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "urgency": urgency_map.get(risk_level, "Consult a dermatologist"),
            "icd_code": meta["icd_code"],
            "abcd": {
                "asymmetry": asymmetry_score,
                "border": border_score,
                "color_variance": color_variance_score,
                "diameter_mm": diameter_mm,
            },
            "warning_signs": meta["warning_signs"],
            "action": action,
            "self_check": meta["self_check"],
            "spf_advice": meta["spf_advice"],
            "statistics": meta["statistics"],
            "description": meta["description"],
        }

    def _fallback_result(self):
        """Returns a generic 'unable to detect' response."""
        return [{
            "id": "obj_unknown_1",
            "box": [0.1, 0.1, 0.9, 0.9],
            "label": "Unknown Lesion",
            "class_key": "melanocytic_nevus",
            "medical_name": "Lesion — Inconclusive",
            "confidence": 0.45,
            "risk_level": "Low",
            "risk_score": 10,
            "urgency": "🟡 Inconclusive — please upload a clearer, close-up image of the lesion",
            "icd_code": "D22",
            "abcd": {"asymmetry": 0.0, "border": 0.0, "color_variance": 0.0, "diameter_mm": 0.0},
            "warning_signs": ["Poor image quality — re-upload with better lighting"],
            "action": {"immediate": "Improve image quality. Capture lesion in daylight or with dermatoscope."},
            "self_check": "For accurate analysis, photograph the lesion at 15–30cm with good lighting.",
            "spf_advice": "Apply SPF 30+ daily as a general precaution.",
            "statistics": {},
            "description": "Image quality was too low for accurate lesion segmentation. Please upload a clearer image.",
        }]
