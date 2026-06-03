const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Generic fetch wrapper
 * @param {string} endpoint - The API endpoint (e.g., '/auth/login')
 * @param {object} options - Fetch options (method, body, etc.)
 */
async function fetchAPI(endpoint, options = {}) {
  let token = localStorage.getItem("token");

  if (!token) {
    const patientAuth = localStorage.getItem("patientAuth");
    if (patientAuth) {
      try {
        const parsed = JSON.parse(patientAuth);
        token = parsed.token;
      } catch (e) {
        console.error("Error parsing patientAuth:", e);
      }
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Clear tokens and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("patientAuth");

        // Determine redirect path based on current path
        const isStaff =
          window.location.pathname.includes("/admin") ||
          window.location.pathname.includes("/sub-admin") ||
          window.location.pathname.includes("/doctor") ||
          window.location.pathname.includes("/lab");
        window.location.href = isStaff ? "/staff-login" : "/";

        throw new Error("Session expired. Please login again.");
      }
      throw new Error(data.message || data.error || "Something went wrong");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// --- Auth Endpoints ---

export const loginUser = (email, password) => {
  return fetchAPI("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const doctorLogin = (email, password) => {
  return fetchAPI("/doctor/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const employeeLogin = (email, password) => {
  return fetchAPI("/employee/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const subAdminLogin = (email, password) => {
  return fetchAPI("/sub-admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const getProfile = () => {
  return fetchAPI("/auth/profile", {
    method: "GET",
  });
};

export const logout = () => {
  return fetchAPI("/auth/logout", {
    method: "POST",
  });
};

// --- Lab Employee Endpoints ---

export const checkAadhaar = (aadharNumber) => {
  return fetchAPI("/employee/check-aadhar", {
    method: "POST",
    body: JSON.stringify({ aadharNumber }),
  });
};

export const registerGeneralPatient = (patientData) => {
  return fetchAPI("/employee/patient/general", {
    method: "POST",
    body: JSON.stringify(patientData),
  });
};

export const registerStudentPatient = (patientData) => {
  return fetchAPI("/employee/patient/student", {
    method: "POST",
    body: JSON.stringify(patientData),
  });
};

export const registerEmployeePatient = (patientData) => {
  return fetchAPI("/employee/patient/employee", {
    method: "POST",
    body: JSON.stringify(patientData),
  });
};

// --- Admin Endpoints ---

export const addDoctor = (doctorData) => {
  return fetchAPI("/admin/add-doctor", {
    method: "POST",
    body: JSON.stringify(doctorData),
  });
};

export const addLabEmployee = (employeeData) => {
  return fetchAPI("/admin/add-lab-employee", {
    method: "POST",
    body: JSON.stringify(employeeData),
  });
};

export const addSubAdmin = (subAdminData) => {
  return fetchAPI("/admin/add-sub-admin", {
    method: "POST",
    body: JSON.stringify(subAdminData),
  });
};

export const addSubAdminDoctor = (doctorData) => {
  return fetchAPI("/sub-admin/add-doctor", {
    method: "POST",
    body: JSON.stringify(doctorData),
  });
};

export const addSubAdminLabEmployee = (employeeData) => {
  return fetchAPI("/sub-admin/add-lab-employee", {
    method: "POST",
    body: JSON.stringify(employeeData),
  });
};

export const getSystemStats = () => {
  return fetchAPI("/admin/dashboard/executive-stats", {
    method: "GET",
  });
};

export const getFinancialStats = (range = "week") => {
  return fetchAPI(`/admin/financial-stats?range=${range}`, {
    method: "GET",
  });
};

export const getAllStaff = () => {
  return fetchAPI("/admin/all-staff", {
    method: "GET",
  });
};

export const resetStaffPassword = (userId, role, newPassword) => {
  return fetchAPI("/admin/reset-staff-password", {
    method: "POST",
    body: JSON.stringify({ userId, role, newPassword }),
  });
};

// --- Lab Endpoints ---

export const fetchLabTests = () => {
  return fetchAPI("/lab/tests", {
    method: "GET",
  });
};

export const fetchDoctors = () => {
  return fetchAPI("/lab/doctors", {
    method: "GET",
  });
};

export const previewLabBooking = (patientName) => {
  return fetchAPI("/lab/booking/preview", {
    method: "POST",
    body: JSON.stringify({ patientName }),
  });
};

export const confirmLabBooking = (bookingData) => {
  return fetchAPI("/lab/booking/confirm", {
    method: "POST",
    body: JSON.stringify(bookingData),
  });
};

export const fetchCollectorBookings = (collectorName) => {
  return fetchAPI(
    `/lab/bookings/collector?name=${encodeURIComponent(collectorName)}`,
    {
      method: "GET",
    },
  );
};

// --- Doctor Endpoints ---

export const searchPatientReports = (identifier) => {
  // Determine if input is UHID or Aadhaar
  // Remove spaces
  const cleanId = identifier.replace(/\s+/g, "");

  // Aadhaar is exactly 12 digits
  const isAadhaar = /^\d{12}$/.test(cleanId);

  const payload = isAadhaar ? { aadharNumber: cleanId } : { uhid: cleanId };

  return fetchAPI("/doctor/patient-reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// --- Payment Endpoints ---

export const createRazorpayOrder = (amount, receipt) => {
  return fetchAPI("/payment/create-order", {
    method: "POST",
    body: JSON.stringify({ amount, receipt }),
  });
};

export const verifyRazorpayPayment = (paymentData) => {
  return fetchAPI("/payment/verify", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
};

// --- Medication Endpoints ---

export const addMedication = (bookingId, medications) => {
  return fetchAPI("/doctor/add-medication", {
    method: "POST",
    body: JSON.stringify({ bookingId, medications }),
  });
};

export const getPatientPrescriptions = (uhid) => {
  return fetchAPI(`/lab/prescriptions/${uhid}`, {
    method: "GET",
  });
};

export const getPatientProfile = (identifier) => {
  return fetchAPI(`/lab/patient-profile/${identifier}`, {
    method: "GET",
  });
};
