"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Stethoscope,
  FlaskConical,
  Mail,
  Phone,
  Hash,
  Award,
  Lock,
  CheckCircle2,
  Loader2,
  Upload,
  TestTube,
  ShieldCheck,
  ClipboardList,
  Droplet,
  Microscope,
} from "lucide-react";
import { addDoctor, addLabEmployee, addSubAdmin } from "@/lib/api";

const roles = [
  {
    id: "doctor",
    title: "Doctor",
    description: "Authorized for medical checking & digital signatures.",
    icon: Stethoscope,
    color: "blue",
  },
  {
    id: "lab",
    title: "Lab Employee",
    description: "Authorized for data entry & sample processing.",
    icon: FlaskConical,
    color: "emerald",
    subTypes: [
      {
        id: "test_registerer",
        title: "Test Registerer",
        description: "Registers patients & books tests",
        icon: ClipboardList,
      },
      {
        id: "sample_collector",
        title: "Sample Blood Collection",
        description: "Collects blood samples from patients",
        icon: Droplet,
      },
      {
        id: "lab_collector",
        title: "Sample Lab Collector",
        description: "Receives & manages samples in the lab",
        icon: TestTube,
      },
      {
        id: "lab_processor",
        title: "Sample Lab Processor",
        description: "Processes samples & uploads reports",
        icon: Microscope,
      },
    ],
  },
  {
    id: "sub_admin",
    title: "Sub Admin",
    description: "Manage departmental staff & operations.",
    icon: ShieldCheck,
    color: "purple",
  },
];

export default function StaffManagement() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("doctor");
  const [selectedSubType, setSelectedSubType] = useState("test_registerer");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Auto-dismiss message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    licenseNo: "",
    email: "",
    phone: "",
    department: "",
    password: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/staff-login");
        return;
      }

      let response;

      if (selectedRole === "doctor") {
        const doctorData = {
          name: formData.name,
          doctorId: formData.employeeId,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          status: "Active",
        };
        response = await addDoctor(doctorData);
      } else if (selectedRole === "lab") {
        const employeeData = {
          name: formData.name,
          employeeId: formData.employeeId,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          role: selectedSubType,
          status: "Active",
        };
        response = await addLabEmployee(employeeData);
      } else if (selectedRole === "sub_admin") {
        const subAdminData = {
          name: formData.name,
          subAdminId: formData.employeeId,
          email: formData.email,
          password: formData.password,
          department: formData.department,
          status: "Active",
        };
        response = await addSubAdmin(subAdminData);
      }

      setMessage({
        type: "success",
        text: response.message || "Staff added successfully!",
      });
      // Reset form
      setFormData({
        name: "",
        employeeId: "",
        licenseNo: "",
        email: "",
        phone: "",
        department: "",
        password: "",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      employeeId: "",
      licenseNo: "",
      email: "",
      phone: "",
      department: "",
      password: "",
    });
    setMessage({ type: "", text: "" });
  };

  const currentRole = roles.find((r) => r.id === selectedRole);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Onboard New Staff
        </h2>
        <p className="text-gray-500 font-medium">
          Select a role and enter details to grant system access.
        </p>
      </div>

      {/* Role Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => {
                setSelectedRole(role.id);
                if (role.subTypes) {
                  setSelectedSubType(role.subTypes[0].id);
                }
              }}
              className={cn(
                "relative group flex flex-col items-center text-center p-8 rounded-none border-2 transition-all duration-300",
                isSelected
                  ? "bg-white border-gray-900 shadow-xl shadow-gray-200/50 scale-[1.02]"
                  : "bg-white border-transparent hover:border-gray-100 hover:shadow-lg",
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-none flex items-center justify-center mb-6 transition-all duration-300",
                  isSelected
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-900",
                )}
              >
                <role.icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{role.title}</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed px-4">
                {role.description}
              </p>
              {isSelected && (
                <div className="absolute top-4 right-4 text-gray-900">
                  <CheckCircle2 className="w-5 h-5 fill-current text-white bg-gray-900 rounded-none" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-type Selection for Lab Employee */}
      {currentRole?.subTypes && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
            Select Employee Type
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentRole.subTypes.map((subType) => {
              const isSelected = selectedSubType === subType.id;
              return (
                <button
                  key={subType.id}
                  onClick={() => setSelectedSubType(subType.id)}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-none border-2 transition-all",
                    isSelected
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-100 bg-white hover:border-gray-200",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-none flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400",
                    )}
                  >
                    <subType.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-gray-900">{subType.title}</h4>
                    <p className="text-xs text-gray-400">
                      {subType.description}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-gray-900 ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Display */}
      {message.text && (
        <div
          className={cn(
            "p-4 rounded-none text-sm font-medium",
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200",
          )}
        >
          {message.text}
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-none border border-gray-100 p-10 shadow-sm">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={
                    selectedRole === "doctor"
                      ? "e.g. Dr. Sameer Khan"
                      : "e.g. Adil Khan"
                  }
                  className="block w-full pl-11 pr-4 py-4 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-semibold transition-all placeholder:text-gray-300 placeholder:font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                {selectedRole === "doctor"
                  ? "Doctor ID"
                  : selectedRole === "sub_admin"
                    ? "Admin ID"
                    : "Employee ID"}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                </div>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder={
                    selectedRole === "doctor"
                      ? "DOC-2026-XXXX"
                      : selectedRole === "sub_admin"
                        ? "SA-XXXX"
                        : "EMP-2026-XXXX"
                  }
                  className="block w-full pl-11 pr-4 py-4 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-semibold transition-all placeholder:text-gray-300 placeholder:font-medium"
                  required
                />
              </div>
            </div>

            {selectedRole === "doctor" && (
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                  License / Registration No.
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Award className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="licenseNo"
                    value={formData.licenseNo}
                    onChange={handleInputChange}
                    placeholder="MCI-XXXXXX"
                    className="block w-full pl-11 pr-4 py-4 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-semibold transition-all placeholder:text-gray-300 placeholder:font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Official Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="staff@jnmc.edu"
                  className="block w-full pl-11 pr-4 py-4 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-semibold transition-all placeholder:text-gray-300 placeholder:font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Contact Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="block w-full pl-11 pr-4 py-4 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-semibold transition-all placeholder:text-gray-300 placeholder:font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Primary Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="block w-full px-4 py-4 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-semibold transition-all appearance-none"
                required
              >
                <option value="">Select Department</option>
                <option value="hematology">Hematology</option>
                <option value="biochemistry">Biochemistry</option>
                <option value="pathology">Pathology</option>
                <option value="microbiology">Microbiology</option>
                <option value="radiology">Radiology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-4 py-4 rounded-none bg-gray-50/50 border border-transparent focus:border-gray-200 focus:bg-white focus:ring-0 text-sm font-semibold transition-all placeholder:text-gray-300"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-50">
            <p className="text-[11px] font-bold text-gray-400 flex items-center gap-2">
              <Lock className="h-3 w-3" />
              Staff can change password after first login.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-3 px-10 py-4 rounded-none bg-gray-900 text-white font-bold shadow-xl shadow-gray-200 hover:bg-black transition-all group active:scale-95 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    Register Staff
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
