"use client";

import { useState, useEffect } from "react";
import {
  User,
  IdCard,
  Briefcase,
  Calendar,
  Smartphone,
  Mail,
  MapPin,
  Activity,
  Hash,
  Building,
  GraduationCap,
  Droplet,
  Users,
  Map,
  Pill,
  Download,
  TrendingUp,
  FileText,
  Loader2,
} from "lucide-react";
import { getPatientProfile } from "../../../lib/api";
import Link from "next/link";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      // Get UHID or Aadhaar from localStorage to fetch full profile from DB
      const storedAuth = localStorage.getItem("patientAuth");
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        const identifier = parsed.patient?.uhid || parsed.patient?.aadharNumber;

        if (identifier) {
          // Fetch full profile from database
          const response = await getPatientProfile(identifier);
          if (response.success) {
            setProfile({
              name: response.patient.name,
              patientType: response.patientType || "Patient",
              details: response.patient,
            });
            return;
          }
        }
      }
      setError("No profile data found. Please login again.");
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-bold text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-bold">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-gray-500 font-bold">No profile data found.</p>
      </div>
    );
  }

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Helper to calculate age
  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970) + " years old";
  };

  // Determine User Role and Data
  const userType = profile.patientType || "Patient"; // Default to Patient if undefined
  const details = profile.details || {};
  const name = profile.name || details.name || "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Construct Display Data dynamically based on userType
  let displayData = {
    name: name,
    initials: initials,
    role: userType,
    status: details.status || "Active",
    tagline: "", // Will be set below
    fields: [],
    contact: [],
    stats: [],
    address: null,
  };

  // Common Fields
  const commonFields = [
    { label: "UHID", value: details.uhid || "Not Assigned", icon: IdCard },
    {
      label: "Aadhar Number",
      value: details.aadharNumber || profile.aadhar,
      icon: User,
    },
    {
      label: "Date of Birth",
      value: formatDate(details.dateOfBirth),
      subValue: calculateAge(details.dateOfBirth),
      icon: Calendar,
    },
    { label: "Gender", value: details.gender, icon: Users },
    { label: "Blood Group", value: details.bloodGroup, icon: Droplet },
  ];

  // Address Logic
  let addressString = "";
  let city = details.city || "";
  let state = details.state || "";
  let pin = details.pinCode || "";

  if (details.address) {
    if (typeof details.address === "string") {
      addressString = details.address;
    } else if (typeof details.address === "object") {
      // Handle object address (dist/city/state keys)
      const { dist, city: c, state: s, pinCode: p } = details.address;
      if (dist) addressString = dist;
      if (c) city = c;
      if (s) state = s;
      if (p) pin = p;
    }
  }

  const fullAddress = [addressString, city, state, pin]
    .filter(Boolean)
    .join(", ");

  const contactFields = [
    {
      label: "Phone Number",
      value: details.phone || profile.phone,
      icon: Smartphone,
    },
    {
      label: "Email Address",
      value: details.email || profile.email,
      icon: Mail,
    },
  ];

  if (userType === "Employee") {
    displayData.tagline = `${details.designation || "Employee"} • ${details.department || "Hospital"}`;
    displayData.fields = [
      ...commonFields,
      { label: "Employee ID", value: details.employeeId, icon: Hash },
      { label: "PF Number", value: details.pfNumber, icon: Hash },
      { label: "Department", value: details.department, icon: Building },
      { label: "Designation", value: details.designation, icon: Briefcase },
      {
        label: "Date of Joining",
        value: formatDate(details.dateOfJoining),
        icon: Calendar,
      },
    ];
    displayData.contact = [
      ...contactFields,
      { label: "Address", value: fullAddress, icon: MapPin },
    ];
  } else if (userType === "Student") {
    displayData.tagline = `${details.department || "Student"} • ${details.enrollmentNumber ? "Enr: " + details.enrollmentNumber : ""}`;
    displayData.fields = [
      ...commonFields,
      {
        label: "Enrollment Number",
        value: details.enrollmentNumber,
        icon: GraduationCap,
      },
      { label: "Faculty Number", value: details.facultyNumber, icon: Hash },
      { label: "Department", value: details.department, icon: Building },
    ];
    displayData.contact = [
      ...contactFields,
      { label: "Address", value: fullAddress, icon: MapPin },
    ];
  } else {
    // General Patient or others
    displayData.tagline = `Registered Patient • ${formatDate(details.createdAt || details.registrationDate)}`;
    displayData.fields = [
      ...commonFields,
      {
        label: "Registration Date",
        value: formatDate(details.registrationDate || details.createdAt),
        icon: Calendar,
      },
    ];
    displayData.contact = contactFields; // Address shown separately for patients usually

    // Patient specific address object for the dedicated section
    displayData.address = {
      residential: addressString,
      city: city,
      state: state,
      pin: pin,
    };

    if (details.visitsCount) {
      displayData.stats.push({
        label: "Total Visits",
        value: `${details.visitsCount} visits`,
        icon: Activity,
      });
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
        {/* Profile Header */}
        <div className="p-10 flex flex-col md:flex-row items-center gap-8 border-b border-gray-50 bg-gradient-to-br from-white to-gray-50/50">
          <div className="w-28 h-28 rounded-none bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-black shadow-inner">
            {displayData.initials}
          </div>
          <div className="text-center md:text-left space-y-3">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {displayData.name}
            </h2>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span
                className={cn(
                  "px-4 py-1.5 rounded-none text-[10px] font-black uppercase tracking-widest shadow-sm",
                  userType === "Employee"
                    ? "bg-purple-50 text-purple-600"
                    : userType === "Student"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-emerald-50 text-emerald-600",
                )}
              >
                {displayData.role}
              </span>
              <span className="px-4 py-1.5 rounded-none bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest shadow-sm">
                {displayData.status}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-500">
              {displayData.tagline}
            </p>
          </div>
        </div>

        {/* Details Content */}
        <div className="p-10 space-y-12">
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-10">
            {displayData.fields.map((field, i) => (
              <div key={i} className="space-y-3 group">
                <div className="flex items-center gap-2">
                  <field.icon className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {field.label}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[15px] font-bold text-gray-900">
                    {field.value || "N/A"}
                  </p>
                  {field.subValue && (
                    <p className="text-xs font-bold text-gray-400">
                      {field.subValue}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-50 w-full" />

          {/* Stats Section (Patient Only) */}
          {userType === "Patient" && displayData.stats.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                {displayData.stats.map((stat, i) => (
                  <div key={i} className="space-y-3 group">
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {stat.label}
                      </p>
                    </div>
                    <p className="text-[15px] font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="h-px bg-gray-50 w-full" />
            </>
          )}

          {/* Contact Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {displayData.contact.map((contact, i) => (
              <div
                key={i}
                className={cn(
                  "space-y-3 group",
                  contact.label === "Address" && "md:col-span-2",
                )}
              >
                <div className="flex items-center gap-2">
                  <contact.icon className="w-4 h-4 text-gray-300 group-hover:text-gray-900 transition-colors" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {contact.label}
                  </p>
                </div>
                <p className="text-[15px] font-bold text-gray-900">
                  {contact.value || "N/A"}
                </p>
              </div>
            ))}
          </div>

          {/* Residential Address Details (Patient Only) */}
          {userType === "Patient" && displayData.address && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-1 space-y-3 group">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-300 group-hover:text-gray-900" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Residential Address
                  </p>
                </div>
                <p className="text-[15px] font-bold text-gray-900 leading-relaxed">
                  {displayData.address.residential || "N/A"}
                </p>
              </div>
              <div className="space-y-10">
                <div className="space-y-3 group">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      City
                    </p>
                  </div>
                  <p className="text-[15px] font-bold text-gray-900">
                    {displayData.address.city || "N/A"}
                  </p>
                </div>
                <div className="space-y-3 group">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-gray-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      State
                    </p>
                  </div>
                  <p className="text-[15px] font-bold text-gray-900">
                    {displayData.address.state || "N/A"}
                  </p>
                </div>
                <div className="space-y-3 group">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      PIN Code
                    </p>
                  </div>
                  <p className="text-[15px] font-bold text-gray-900 font-mono tracking-tighter">
                    {displayData.address.pin || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
