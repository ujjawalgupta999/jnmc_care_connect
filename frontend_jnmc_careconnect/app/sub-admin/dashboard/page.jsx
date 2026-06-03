"use client";

import { useState, useEffect } from "react";
import { Users, TestTube2, Plus, Building, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Helper to get auth header
const getAuthHeader = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function SubAdminDashboard() {
  const [staff, setStaff] = useState({ doctors: [], labEmployees: [] });
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState("");
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);

  // Forms
  const [doctorForm, setDoctorForm] = useState({
    name: "",
    doctorId: "",
    email: "",
    password: "",
  });

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    employeeId: "",
    email: "",
    password: "",
    role: "test_registerer",
  });

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API_URL}/sub-admin/my-staff`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        setStaff(response.data.data);
        setDepartment(response.data.department);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/sub-admin/add-doctor`,
        { ...doctorForm, status: "Active" },
        { headers: getAuthHeader() },
      );
      if (response.data.success) {
        toast.success("Doctor added successfully");
        setIsDoctorDialogOpen(false);
        setDoctorForm({ name: "", doctorId: "", email: "", password: "" });
        fetchStaff();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add doctor");
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/sub-admin/add-lab-employee`,
        { ...employeeForm, status: "Active" },
        { headers: getAuthHeader() },
      );
      if (response.data.success) {
        toast.success("Lab Employee added successfully");
        setIsEmployeeDialogOpen(false);
        setEmployeeForm({
          name: "",
          employeeId: "",
          email: "",
          password: "",
          role: "test_registerer",
        });
        fetchStaff();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add employee");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-none h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
            Dashboard
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Department Scope:
            </span>
            <div className="flex items-center text-xs font-black bg-gray-900 text-white px-3 py-1 rounded-none uppercase tracking-wide">
              <Building className="w-3 h-3 mr-2" />
              {department}
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <Button
            onClick={() => (window.location.href = "/sub-admin/staff")}
            className="flex-1 md:flex-none bg-gray-900 text-white hover:bg-black border border-gray-900 rounded-none h-12 text-xs font-black uppercase tracking-widest shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Onboard New Staff
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Doctors List */}
        <div className="bg-white border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Registered Doctors
            </h3>
            <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-none">
              {staff.doctors.length}
            </span>
          </div>
          <div className="p-0">
            {staff.doctors.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {staff.doctors.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 rounded-none group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {doc.name}
                        </h4>
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                          {doc.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-mono font-bold rounded-none">
                        {doc.doctorId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Users className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  No doctors found
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lab Employees List */}
        <div className="bg-white border border-gray-100 shadow-sm flex flex-col h-full">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-widest flex items-center gap-2">
              <TestTube2 className="w-4 h-4 text-gray-400" />
              Lab Employees
            </h3>
            <span className="bg-black text-white text-[10px] font-bold px-2 py-1 rounded-none">
              {staff.labEmployees.length}
            </span>
          </div>
          <div className="p-0">
            {staff.labEmployees.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {staff.labEmployees.map((emp) => (
                  <div
                    key={emp._id}
                    className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 rounded-none group-hover:bg-purple-600 group-hover:text-white transition-all">
                        <TestTube2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {emp.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={cn(
                              "text-[9px] uppercase font-black px-1.5 py-0.5 border",
                              ["processor", "lab_processor"].includes(emp.role)
                                ? "bg-orange-50 text-orange-600 border-orange-200"
                                : "bg-emerald-50 text-emerald-600 border-emerald-200",
                            )}
                          >
                            {emp.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1 text-right">
                        {emp.email}
                      </p>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-mono font-bold rounded-none">
                        {emp.employeeId}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <TestTube2 className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  No lab employees found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
