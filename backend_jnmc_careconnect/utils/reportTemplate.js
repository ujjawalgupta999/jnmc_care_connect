const moment = require("moment");

const generateHematologyHTML = (booking, testResult) => {
  const {
    patientName,
    uhid,
    sampleId,
    referringDoctor,
    collectorName,
    createdAt,
  } = booking;
  const { results, testDate } = testResult;

  const ageCheck = booking.patientId?.age || "N/A";
  const genderCheck = booking.patientId?.gender || "N/A";

  // Group results if needed, or just list them
  // Mindray usually gives CBC parameters. We can group them logically or just list.

  const rows = results
    .map((r) => {
      const isAbnormal = r.flag === "H" || r.flag === "L";
      const flagStyle = isAbnormal ? "color: red; font-weight: bold;" : "";
      return `
      <tr>
        <td>${r.parameter}</td>
        <td style="${flagStyle}">${r.value}</td>
        <td>${r.unit}</td>
        <td>${r.refRange}</td>
        <td>${r.flag || ""}</td>
      </tr>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
    .header h1 { margin: 0; color: #0056b3; }
    .header p { margin: 5px 0; font-size: 14px; }
    
    .meta-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
    .meta-table td { padding: 5px; vertical-align: top; }
    .meta-label { font-weight: bold; width: 120px; }
    
    .results-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    .results-table th, .results-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .results-table th { background-color: #f2f2f2; color: #0056b3; }
    
    .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .sig-block { text-align: center; width: 200px; border-top: 1px solid #333; padding-top: 5px; }
  </style>
</head>
<body>

  <div class="header">
    <h1>JNMC CareConnect Laboratory</h1>
    <p>Nehru Nagar, Belagavi, Karnataka 590010</p>
    <p>Phone: 0831-2471350 | Email: lab@jnmc.edu</p>
  </div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Patient Name:</td> <td>${patientName}</td>
      <td class="meta-label">Sample ID:</td> <td>${sampleId}</td>
    </tr>
    <tr>
      <td class="meta-label">UHID:</td> <td>${uhid}</td>
      <td class="meta-label">Collection Date:</td> <td>${moment(createdAt).format("DD-MMM-YYYY HH:mm")}</td>
    </tr>
    <tr>
      <td class="meta-label">Age / Gender:</td> <td>${ageCheck} / ${genderCheck}</td>
      <td class="meta-label">Report Date:</td> <td>${moment(testDate).format("DD-MMM-YYYY HH:mm")}</td>
    </tr>
    <tr>
      <td class="meta-label">Ref. Doctor:</td> <td>${referringDoctor?.name || "Self"}</td>
      <td class="meta-label">Status:</td> <td>Final Report</td>
    </tr>
  </table>

  <h3 style="color: #0056b3; border-bottom: 1px solid #ddd; padding-bottom: 5px;">COMPLETE BLOOD COUNT (CBC)</h3>

  <table class="results-table">
    <thead>
      <tr>
        <th>Test Parameter</th>
        <th>Result</th>
        <th>Unit</th>
        <th>Biological Ref. Interval</th>
        <th>Flag</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="signatures">
     <div class="sig-block">
       <strong>Lab Technician</strong><br>
       ${collectorName || "Authorized Signatory"}
     </div>
     <div class="sig-block">
       <strong>Pathologist</strong><br>
       Dr. S. K. Patil
     </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated report. No signature required.</p>
    <p>Report ID: ${booking._id} | Generated: ${moment().format("DD-MMM-YYYY HH:mm:ss")}</p>
  </div>

</body>
</html>
  `;
};

module.exports = { generateHematologyHTML };
