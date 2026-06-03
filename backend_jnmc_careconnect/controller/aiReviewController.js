const Booking = require("../models/booking");
const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");
const pdf = require("pdf-poppler");
const Tesseract = require("tesseract.js");
const { getPublicPdfUrl } = require("../utils/r2Config");
const fs = require("fs");
const path = require("path");
const os = require("os");

exports.aiReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("patientId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    let reportUrl = null;
    if (booking.reportKey) {
      reportUrl = getPublicPdfUrl(booking.reportKey);
    } else if (booking.reportUrl) {
      reportUrl = booking.reportUrl;
    }

    if (!reportUrl) {
      return res.status(404).json({ success: false, message: "Report not available yet" });
    }

    if (!process.env.GEMINI_API_KEY) {
       return res.status(500).json({ success: false, message: "GEMINI_API_KEY not configured on server" });
    }

    // Initialize Gemini using new SDK
    const ai = new GoogleGenAI({});

    // Download PDF and convert to images
    const response = await axios.get(reportUrl, { responseType: "arraybuffer" });
    
    // Create temporary directory for processing
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-ocr-'));
    const pdfPath = path.join(tempDir, 'report.pdf');
    fs.writeFileSync(pdfPath, response.data);

    let opts = {
        format: 'png',
        out_dir: tempDir,
        out_prefix: 'page',
        page: null
    };

    await pdf.convert(pdfPath, opts);

    // Extract text using Tesseract OCR
    const files = fs.readdirSync(tempDir).filter(f => f.endsWith('.png'));
    // Sort numerically by page number
    files.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });

    let textContent = "";
    for (const file of files) {
      const imgPath = path.join(tempDir, file);
      const { data: { text } } = await Tesseract.recognize(imgPath, 'eng');
      textContent += text + "\n";
    }

    // Clean up temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch(e) {
      console.error("Cleanup error:", e);
    }

    // Call Gemini
    const prompt = `Review the following medical test report. Extract the details and return ONLY a valid JSON string with the following structure:
{
  "patient_name": "string",
  "test": "string",
  "date": "YYYY-MM-DD",
  "summary": {
    "test_parameter_name": {
      "value": number or string,
      "unit": "string",
      "status": "string (e.g., Normal, High, Low)"
    }
  },
  "ai_interpretation": "A detailed interpretation of the results."
}

Do not include any markdown formatting like \`\`\`json. Just output the raw JSON object.

Report Content:
${textContent}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const aiResponse = result.text;
    
    let parsedJson;
    try {
      parsedJson = JSON.parse(aiResponse.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim());
    } catch (e) {
      return res.status(500).json({ success: false, message: "Failed to parse AI response", raw: aiResponse });
    }

    return res.status(200).json({ success: true, ai_review: parsedJson });
  } catch (error) {
    console.error("AI Review Error:", error);
    return res.status(500).json({ success: false, message: "Server error during AI review", error: error.message });
  }
};
