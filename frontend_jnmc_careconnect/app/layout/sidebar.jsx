"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  LogOut,
  History,
  FileText,
  LayoutDashboard,
  Users,
  IndianRupee,
  Settings,
  FlaskConical,
  ClipboardList,
  Clock,
  CheckCircle2,
  User,
  Pill,
  ShieldCheck,
  ScanBarcode,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const menuConfigs = {
  doctor: [{ label: "Patient Lookup", icon: Search, href: "/doctor" }],
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "All Staff", icon: Users, href: "/admin/all-staff" },
    { label: "Staff Management", icon: Users, href: "/admin/staff" },
    { label: "Financials", icon: IndianRupee, href: "/admin/financials" },
    { label: "Activity Logs", icon: History, href: "/admin/logs" },
    { label: "TAT Analytics", icon: Clock, href: "/admin/tat" },
  ],
  sub_admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/sub-admin/dashboard" },
    { label: "Staff Management", icon: Users, href: "/sub-admin/staff" },
  ],
  lab: [
    {
      label: "Patient Lookup",
      icon: Search,
      href: "/lab/check",
      section: "FRONT DESK",
      allowedRoles: ["collector", "test_registerer"],
    },
    {
      label: "Scan Sample",
      icon: ScanBarcode,
      href: "/lab/scan",
      section: "MAIN MENU",
      allowedRoles: ["processor", "sample_collector", "lab_collector", "lab_processor"],
    },
    {
      label: "Receipts",
      icon: FileText,
      href: "/lab/receipts",
      section: "FRONT DESK",
      allowedRoles: ["collector", "test_registerer"],
    },
    {
      label: "Upload Reports",
      icon: ClipboardList,
      href: "/lab/upload",
      section: "MAIN MENU",
      allowedRoles: ["processor", "lab_processor"],
    },
    {
      label: "Sample Tracking",
      icon: FlaskConical,
      href: "/lab/tracking",
      section: "MAIN MENU",
      allowedRoles: ["collector", "processor", "test_registerer", "sample_collector", "lab_collector", "lab_processor"],
    },
    {
      label: "Pending Reports",
      icon: Clock,
      href: "/lab/pending",
      section: "MAIN MENU",
      allowedRoles: ["processor", "lab_processor"],
    },
    {
      label: "My Uploads",
      icon: History,
      href: "/lab/my-uploads",
      section: "MAIN MENU",
      allowedRoles: ["processor", "lab_processor"],
    },
  ],
  user: [
    {
      label: "My Reports",
      icon: FileText,
      href: "/lab/test",
      section: "PATIENT MENU",
    },
    {
      label: "My Prescriptions",
      icon: Pill,
      href: "/user/prescriptions",
      section: "PATIENT MENU",
    },
    {
      label: "My Profile",
      icon: User,
      href: "/user/profile",
      section: "PATIENT MENU",
    },
  ],
};

export default function Sidebar({ role = "doctor" }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: authLogout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const [patientData, setPatientData] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("patientAuth");
    if (stored) {
      try {
        setPatientData(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Force user role if patientData exists
  const detectedRole =
    (patientData ? "user" : null) ||
    role ||
    (pathname?.startsWith("/admin")
      ? "admin"
      : pathname?.startsWith("/sub-admin")
        ? "sub_admin"
        : pathname?.startsWith("/lab")
          ? "lab"
          : pathname?.startsWith("/user")
            ? "user"
            : "doctor");

  let menuItems = menuConfigs[detectedRole] || menuConfigs.doctor;

  // Filter items for Lab role based on employee sub-role
  if (detectedRole === "lab" && user?.role) {
    menuItems = menuItems.filter(
      (item) => !item.allowedRoles || item.allowedRoles.includes(user.role),
    );
  }

  // Fetch pending reports count for processor roles
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (detectedRole === "lab" && ["processor", "lab_processor"].includes(user?.role)) {
        try {
          // Get department from localStorage
          const userData = localStorage.getItem("user");
          let department = "All";
          if (userData) {
            const parsedUser = JSON.parse(userData);
            department = parsedUser.department || "All";
          }

          const res = await fetch(
            `${API_URL}/lab/pending?department=${department}`,
          );
          const data = await res.json();
          if (data.success) {
            setPendingCount(data.bookings.length);
          }
        } catch (error) {
          console.error("Failed to fetch pending count:", error);
        }
      }
    };

    fetchPendingCount();
    // Poll every 30 seconds for updates
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [detectedRole, user]);

  const handleLogout = async () => {
    await authLogout();
  };

  return (
    <aside className="fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-64 flex-col border-r border-gray-100 bg-white lg:flex z-40">
      <div className="p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-6">
          {detectedRole === "user" ? "PATIENT" : detectedRole.toUpperCase()}{" "}
          Menu
        </p>
        <nav className="space-y-6">
          {Object.entries(
            menuItems.reduce((acc, item) => {
              const section = item.section || "Main Menu";
              if (!acc[section]) acc[section] = [];
              acc[section].push(item);
              return acc;
            }, {}),
          ).map(([section, items]) => (
            <div key={section} className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 px-4">
                {section}
              </p>
              {items.map((item) => {
                // Strict check for root paths to prevent "Dashboard" staying active on sub-pages
                const isActive =
                  item.href === pathname ||
                  (item.href !== "/admin" &&
                    item.href !== "/sub-admin" &&
                    item.href !== "/lab" &&
                    item.href !== "/doctor" &&
                    pathname?.startsWith(item.href));

                // Dynamic badge for pending reports
                const badge =
                  item.label === "Pending Reports"
                    ? pendingCount > 0
                      ? pendingCount.toString()
                      : null
                    : item.badge;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-none px-4 py-3 text-sm transition-all group",
                      isActive
                        ? "bg-gray-900 font-semibold text-white shadow-md shadow-gray-200"
                        : "font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    {badge && (
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-none text-[10px] font-bold",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-none bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-sm">
              {(patientData?.patient?.name || user?.name)
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ||
                (detectedRole === "admin"
                  ? "AD"
                  : detectedRole === "sub_admin"
                    ? "SA"
                    : "ST")}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">
                {patientData?.patient?.name ||
                  user?.name ||
                  (detectedRole === "admin" ? "Admin Portal" : "Staff Member")}
              </p>
              <p className="text-[10px] text-gray-500 font-medium capitalize">
                {patientData
                  ? "Valued Patient"
                  : user?.type ||
                    (detectedRole === "admin"
                      ? "System Administrator"
                      : detectedRole === "user"
                        ? "Valued Patient"
                        : detectedRole === "sub_admin"
                          ? "Department Admin"
                          : "Hospital Personnel")}
              </p>
            </div>
          </div>
          <button
            onClick={
              patientData
                ? () => {
                    localStorage.removeItem("patientAuth");
                    router.push("/");
                  }
                : handleLogout
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-none py-2 text-xs font-bold text-gray-400 hover:bg-white hover:text-red-500 hover:shadow-sm transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
