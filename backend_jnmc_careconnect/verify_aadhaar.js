const http = require("http");

function postRequest(data) {
  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/lab/check-aadhaar",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  const req = http.request(options, (res) => {
    let responseData = "";
    res.on("data", (chunk) => {
      responseData += chunk;
    });
    res.on("end", () => {
      console.log(`Status: ${res.statusCode}`);
      console.log("Response:", JSON.parse(responseData));
    });
  });

  req.on("error", (error) => {
    console.error("Error:", error);
  });

  req.write(data);
  req.end();
}

// Test Case 1: Existing Aadhaar 
console.log("Test 1: Check Valid Aadhaar");
const validData = JSON.stringify({ aadhaar: "2222222222223001" });
postRequest(validData);

// Test Case 2: Invalid Aadhaar
setTimeout(() => {
  console.log("\nTest 2: Check Invalid Aadhaar");
  const invalidData = JSON.stringify({ aadhaar: "000000000000" });
  postRequest(invalidData);
}, 2000);
