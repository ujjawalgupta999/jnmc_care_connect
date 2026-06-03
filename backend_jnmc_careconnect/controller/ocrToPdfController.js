const Tesseract = require("tesseract.js");
const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.ocrToPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    const { patientName, uhid, age, gender, sampleId, doctor, tests } = req.body;

    // Run Tesseract OCR on the uploaded image
    const imagePath = req.file.path;
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
    
    // Clean up uploaded image
    try {
      fs.unlinkSync(imagePath);
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    // Generate PDF with good format
    const doc = new PDFDocument({ margin: 50 });
    
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="ocr_report.pdf"',
        'Content-Length': pdfData.length
      });
      res.end(pdfData);
    });

    // Add some formatting to PDF
    doc.fontSize(20).font('Helvetica-Bold').text('Lab Test Report', { align: 'center' });
    doc.moveDown(1.5);
    
    // Patient Details Box
    const currentY = doc.y;
    doc.rect(50, currentY, 510, 80).stroke('#ccc');
    
    doc.fontSize(10).font('Helvetica-Bold');
    
    const startY = currentY + 15;
    
    // Left Column
    doc.text(`Patient Name:`, 65, startY);
    doc.font('Helvetica').text(`${patientName || '-'}`, 140, startY);
    
    doc.font('Helvetica-Bold').text(`Age/Gender:`, 65, startY + 18);
    doc.font('Helvetica').text(`${age || '?'} Y / ${gender || '?'}`, 140, startY + 18);
    
    doc.font('Helvetica-Bold').text(`Referring Dr:`, 65, startY + 36);
    doc.font('Helvetica').text(`${doctor || '-'}`, 140, startY + 36);
    
    // Right Column
    doc.font('Helvetica-Bold').text(`UHID:`, 320, startY);
    doc.font('Helvetica').text(`${uhid || '-'}`, 380, startY);
    
    doc.font('Helvetica-Bold').text(`Sample ID:`, 320, startY + 18);
    doc.font('Helvetica').text(`${sampleId || '-'}`, 380, startY + 18);
    
    doc.font('Helvetica-Bold').text(`Date:`, 320, startY + 36);
    doc.font('Helvetica').text(`${new Date().toLocaleDateString()}`, 380, startY + 36);
    
    doc.moveDown(5);
    
    // Test Details Section
    doc.fontSize(12).font('Helvetica-Bold').text('Tests Requested:', 50);
    doc.fontSize(10).font('Helvetica').text(`${tests || '-'}`, 50, doc.y + 5);
    doc.moveDown(2);
    
    // OCR Results Section
    doc.fontSize(12).font('Helvetica-Bold').text('Test Results (Scanned Values):', 50);
    doc.moveDown(1);
    
    doc.fontSize(10).font('Courier').text(text, {
      align: 'left',
      lineGap: 4
    });

    doc.end();

  } catch (error) {
    console.error("OCR to PDF Error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "Failed to process OCR and generate PDF", error: error.message });
    }
  }
};
