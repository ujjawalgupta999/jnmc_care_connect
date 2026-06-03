"use client";

import { useEffect, useState } from "react";
import { getAllStaff, resetStaffPassword } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Key,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AllStaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filtering & Pagination State
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset Password Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const data = await getAllStaff();
      if (data.success) {
        setStaff(data.data.all);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      toast.error("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    setResetting(true);
    try {
      const res = await resetStaffPassword(
        selectedUser._id,
        selectedUser.role,
        newPassword,
      );
      if (res.success) {
        toast.success(`Password reset for ${selectedUser.name}`);
        setIsModalOpen(false);
        setNewPassword("");
      }
    } catch (error) {
      console.error("Reset Error:", error);
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  // Filter Logic
  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.doctorId || s.employeeId || "")
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "doctor" && s.role === "doctor") ||
      (roleFilter === "sub_admin" && s.role === "sub_admin") ||
      (roleFilter === "lab" && s.role === "lab");

    return matchesSearch && matchesRole;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            All Staff Members
          </h2>
          <p className="text-gray-500 mt-1 font-medium">
            Manage and view all registered doctors, sub-admins, and lab
            employees.
          </p>
        </div>

        <div className="flex bg-white shadow-sm border border-gray-100 rounded-none w-full md:w-auto">
          {/* Role Filter */}
          <div className="relative border-r border-gray-100/50">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-10 pr-8 py-2.5 h-full bg-transparent text-sm font-semibold text-gray-700 outline-none appearance-none cursor-pointer hover:bg-gray-50 transition-colors rounded-none border-none focus:ring-0"
            >
              <option value="all">All Roles</option>
              <option value="doctor">Doctors</option>
              <option value="sub_admin">Sub Admins</option>
              <option value="lab">Lab Employees</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full md:w-64 text-sm font-medium focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-none shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {loading ? (
          <div className="flex justify-center items-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                    <TableHead className="h-12 w-[250px] font-bold text-[10px] uppercase tracking-widest text-gray-500">
                      Name
                    </TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-widest text-gray-500">
                      ID
                    </TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-widest text-gray-500">
                      Role
                    </TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-widest text-gray-500">
                      Department
                    </TableHead>
                    <TableHead className="h-12 w-[200px] font-bold text-[10px] uppercase tracking-widest text-gray-500">
                      Email
                    </TableHead>
                    <TableHead className="h-12 font-bold text-[10px] uppercase tracking-widest text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="h-12 text-right font-bold text-[10px] uppercase tracking-widest text-gray-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStaff.length > 0 ? (
                    paginatedStaff.map((member) => (
                      <TableRow
                        key={member._id}
                        className="group hover:bg-blue-50/30 transition-all border-b border-gray-50 last:border-0"
                      >
                        <TableCell className="font-bold text-gray-900 py-4">
                          {member.name}
                        </TableCell>
                        <TableCell className="text-gray-500 font-mono text-xs py-4">
                          {member.doctorId ||
                            member.subAdminId ||
                            member.employeeId ||
                            "-"}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-none border-0 text-[10px] font-bold uppercase tracking-wide px-3 py-1 shadow-sm",
                              member.role === "doctor"
                                ? "bg-blue-100 text-blue-700 ring-1 ring-blue-700/10"
                                : member.role === "sub_admin"
                                  ? "bg-purple-100 text-purple-700 ring-1 ring-purple-700/10"
                                  : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-700/10",
                            )}
                          >
                            {member.role === "sub_admin"
                              ? "Sub Admin"
                              : member.subType || "Staff"}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-gray-600 font-medium text-xs py-4">
                          {member.department}
                        </TableCell>
                        <TableCell className="text-gray-500 text-xs py-4">
                          {member.email}
                        </TableCell>
                        <TableCell className="py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wide border",
                              member.status === "Active"
                                ? "bg-white text-green-700 border-green-200"
                                : "bg-white text-red-700 border-red-200",
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                member.status === "Active"
                                  ? "bg-green-500"
                                  : "bg-red-500",
                              )}
                            />
                            {member.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <button
                            onClick={() => {
                              setSelectedUser(member);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-md transition-all rounded-none border border-transparent hover:border-gray-100"
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-20 text-gray-500"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <User className="h-8 w-8 text-gray-300" />
                          <p className="font-semibold">
                            No staff members found matching your criteria.
                          </p>
                          <button
                            onClick={() => {
                              setSearch("");
                              setRoleFilter("all");
                            }}
                            className="text-xs font-bold text-gray-900 hover:underline mt-2"
                          >
                            Clear Filters
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="border-t border-gray-100 bg-gray-50/50 p-4 flex items-center justify-between">
                <p className="text-xs text-gray-500 font-medium">
                  Showing{" "}
                  <span className="font-bold text-gray-900">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-gray-900">
                    {Math.min(currentPage * itemsPerPage, filteredStaff.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-900">
                    {filteredStaff.length}
                  </span>{" "}
                  staff members
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 rounded-none bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-4 text-xs font-bold text-gray-900">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-none bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:pointer-events-none transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Password Reset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md shadow-2xl border border-gray-100 rounded-none overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">
                  Reset Password
                </h3>
                <p className="text-xs text-gray-500 font-bold tracking-tight">
                  Updating password for {selectedUser?.name}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white hover:text-red-500 transition-all text-gray-400 rounded-none border border-transparent hover:border-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  New Staff Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Enter new strong password..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-none focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm font-bold tracking-tight"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                  Make sure to communicate this password to the staff member.
                </p>
              </div>
            </div>
            <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-200 bg-white text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all rounded-none"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={resetting || !newPassword}
                className="flex-1 px-4 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 rounded-none"
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirm Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
