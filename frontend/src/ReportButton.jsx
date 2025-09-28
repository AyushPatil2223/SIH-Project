// frontend/src/components/ReportButton.jsx
import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ReportButton({ lat, lon, maxTemp, minTemp, depths, temps, sals, press }) {

  const handleGenerateReport = async () => {
    const input = document.getElementById("report-section"); // The div to capture
    if (!input) return;

    // Add a temporary title for report
    const title = document.createElement("h2");
    title.innerText = "ARGO Profile Report";
    title.style.textAlign = "center";
    title.style.marginBottom = "20px";
    input.prepend(title);

    // Capture full content with high resolution
    const canvas = await html2canvas(input, {
      scale: window.devicePixelRatio * 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");

    // Create PDF (A4 size in px)
    const pdf = new jsPDF("p", "px", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      position -= pdfHeight;
      if (heightLeft > 0) pdf.addPage();
    }

    pdf.save("ARGO_Report.pdf");

    // Remove temporary title
    input.removeChild(title);
  };

  return (
    <button
      style={{
        marginTop: "20px",
        padding: "10px 20px",
        cursor: "pointer",
        backgroundColor: "#3f8efc",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontWeight: 600,
      }}
      onClick={handleGenerateReport}
    >
      Generate Report
    </button>
  );
}
