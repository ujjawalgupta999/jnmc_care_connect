"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ShieldCheck,
  Mail,
  Building,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";

// Helper to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function SubAdminsPage() {
  const [subAdmins, setSubAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    subAdminId: "",
    password: "",
  });

  const fetchSubAdmins = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/sub-admins`, {
        headers: getAuthHeader(),
      });
      if (response.data.success) {
        setSubAdmins(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching sub-admins:", error);
      toast.error("Failed to load sub-admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/admin/add-sub-admin`,
        { ...formData, status: "Active" },
        { headers: getAuthHeader() },
      );

      if (response.data.success) {
        toast.success("Sub Admin added successfully");
        setIsDialogOpen(false);
        setFormData({
          name: "",
          email: "",
          department: "",
          subAdminId: "",
          password: "",
        });
        fetchSubAdmins();
      }
    } catch (error) {
      console.error("Error adding sub-admin:", error);
      toast.error(error.response?.data?.message || "Failed to add sub-admin");
    }
  };

  const filteredSubAdmins = subAdmins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.department.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Sub Admins
          </h2>
          <p className="text-gray-500 mt-1 font-medium">
            Manage departmental administrators.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              Add Sub Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-0">
            <div className="bg-blue-600 p-6 flex flex-col items-center text-center text-white">
              <div className="p-3 bg-white/10 rounded-full mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white text-center">
                  Add Sub Admin
                </DialogTitle>
                <p className="text-blue-100 text-sm mt-1">
                  Create a new administrator for a department
                </p>
              </DialogHeader>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Full Name
                </label>
                <Input
                  name="name"
                  placeholder="e.g. Dr. Sarah Smith"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Department
                  </label>
                  <Input
                    name="department"
                    placeholder="e.g. Cardiology"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Admin ID
                  </label>
                  <Input
                    name="subAdminId"
                    placeholder="e.g. SA-001"
                    value={formData.subAdminId}
                    onChange={handleInputChange}
                    required
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Email Address
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="sarah@hospital.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Password
                </label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-lg font-bold shadow-lg shadow-blue-100 transition-all duration-300"
                >
                  Create Sub Admin
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search sub admins by name or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubAdmins.map((admin) => (
          <div
            key={admin._id}
            className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100">
                Active
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {admin.name}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  ID: {admin.subAdminId}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-50">
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="w-4 h-4 mr-2 text-gray-400" />
                  {admin.department} Department
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {admin.email}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredSubAdmins.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              No sub admins found matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
