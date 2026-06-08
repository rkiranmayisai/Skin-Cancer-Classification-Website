/**
 * SKIN CANCER CLASSIFICATION WEBSITE
 * PDF Report Generation Service (Using jsPDF via CDN)
 */

const PDFReport = {
  generate(predictionRecord, userImageSrc) {
    if (typeof window.jspdf === 'undefined') {
      Toast.show('PDF Library is still loading. Please try again in a moment.', 'warning');
      return;
    }

    const { doc } = window.jspdf;
    const pdf = new window.jspdf.jsPDF();

    // Color Palette
    const primaryColor = [21, 101, 192];
    const secondaryColor = [38, 166, 154];
    const darkColor = [26, 26, 46];
    const lightColor = [245, 249, 252];

    // Page styling
    pdf.setFillColor(245, 249, 252);
    pdf.rect(0, 0, 210, 297, 'F');

    // Header Panel
    pdf.setFillColor(21, 101, 192);
    pdf.rect(0, 0, 210, 40, 'F');

    // Header Text
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.text('DermAI Skin Health Report', 15, 20);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('AI-Powered Dermatological Screening & Analysis', 15, 28);
    pdf.text(`Report Generated: ${Utils.formatDate(predictionRecord.date)} ${Utils.formatTime(predictionRecord.date)}`, 140, 20);
    pdf.text(`Report ID: #${predictionRecord.id}`, 140, 26);

    // Patient info block
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(15, 48, 180, 28, 3, 3, 'FD');
    pdf.setDrawColor(229, 231, 235);

    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(9);
    pdf.text('PATIENT INFO', 20, 56);
    pdf.text('SCREENING DEVICE / MODEL', 110, 56);

    const currentUser = Auth.getUser() || { name: 'Anonymous User', email: 'N/A' };
    pdf.setTextColor(26, 26, 46);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(currentUser.name, 20, 63);
    pdf.text(predictionRecord.model || 'Ensemble Model (DenseNet/ResNet/EfficientNet)', 110, 63);

    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Email: ${currentUser.email}`, 20, 69);
    pdf.text('Algorithm: Multi-class deep learning CNN model', 110, 69);

    // Results Box
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(15, 84, 180, 70, 3, 3, 'FD');

    pdf.setTextColor(21, 101, 192);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('AI Prediction Analysis', 20, 94);

    // Sub-title line
    pdf.setDrawColor(21, 101, 192);
    pdf.setLineWidth(0.5);
    pdf.line(20, 97, 60, 97);

    // Predict & Confidence details
    pdf.setTextColor(26, 26, 46);
    pdf.setFontSize(16);
    pdf.text(`${predictionRecord.class}`, 20, 112);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Classification Type: ${predictionRecord.type}`, 20, 120);

    const riskColor = predictionRecord.risk === 'High' ? 'CRITICAL / HIGH' : predictionRecord.risk === 'Medium' ? 'WARNING / MODERATE' : 'BENIGN / LOW';
    pdf.text(`Risk Severity: ${riskColor}`, 20, 128);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(predictionRecord.risk === 'High' ? 211 : 46, predictionRecord.risk === 'High' ? 47 : 125, predictionRecord.risk === 'High' ? 47 : 50);
    pdf.setFontSize(28);
    pdf.text(`${predictionRecord.confidence}%`, 135, 118);
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Confidence Score', 135, 125);

    // Add Image to report if possible
    try {
      if (userImageSrc && userImageSrc.startsWith('data:image')) {
        pdf.addImage(userImageSrc, 'JPEG', 20, 162, 50, 50);
        pdf.text('Uploaded Lesion', 20, 218);
      }
      if (predictionRecord.heatmap && predictionRecord.heatmap.startsWith('data:image')) {
        pdf.addImage(predictionRecord.heatmap, 'PNG', 80, 162, 50, 50);
        pdf.text('Grad-CAM Heatmap', 80, 218);
      }
    } catch (e) {
      console.error('Error adding image to PDF: ', e);
    }

    // Recommendation Section
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(15, 226, 180, 48, 3, 3, 'FD');

    pdf.setTextColor(26, 26, 46);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Clinical Recommendations & Next Steps', 20, 234);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81);
    let yPos = 242;
    predictionRecord.recommendations.forEach((rec, idx) => {
      pdf.text(`${idx + 1}. ${rec}`, 20, yPos);
      yPos += 6;
    });

    // Disclaimer
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(8);
    pdf.text('DISCLAIMER: DermAI is an investigational screening tool powered by artificial intelligence. It does not constitute', 15, 284);
    pdf.text('medical advice, official diagnosis, or treatment. Always verify results with a qualified dermatologist using histology/biopsy.', 15, 288);

    pdf.save(`DermAI-Report-${predictionRecord.id}.pdf`);
    Toast.show('Your health report PDF has been downloaded successfully.', 'success');
  }
};
