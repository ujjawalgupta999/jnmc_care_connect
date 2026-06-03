"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function TopBar({ title }) {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const [patientData, setPatientData] = React.useState(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("patientAuth");
    if (stored) {
      try {
        setPatientData(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const displayUser = patientData
    ? {
        name: patientData.patient?.name,
        uhid: patientData.patient?.uhid,
        role: "patient",
        initials: patientData.patient?.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
      }
    : user
      ? {
          name: user.name,
          role: user.role || user.type, // Handle different role property names
          department: user.department,
          initials: user.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        }
      : null;

  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white/80 px-8 backdrop-blur-md shadow-sm">
      {/* Dynamic Title or Branding */}
      <div className="flex items-center gap-2.5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-none bg-gray-50 p-1 border border-gray-100 group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/amulogo.png"
              alt="AMU Logo"
              fill
              className="object-contain grayscale brightness-0"
              sizes="32px"
            />
          </div>
          <div>
            <h1 className="text-sm font-black leading-none text-gray-900 tracking-wider">
              JNMC
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
              CareConnect
            </p>
          </div>
        </Link>
        {title && (
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-px bg-gray-200 mx-1" />
            <h2 className="text-sm font-bold text-gray-600 tracking-tight">
              {title}
            </h2>
          </div>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-5">
        <button className="group relative flex h-9 w-9 items-center justify-center rounded-none border border-gray-100 bg-white text-gray-400 transition-all hover:border-gray-200 hover:text-black">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-none bg-[#051C12] ring-1 ring-white" />
        </button>

        <div className="h-8 w-px bg-gray-100" />

        {displayUser ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <p className="text-sm font-bold text-gray-900 leading-none mb-1">
                {displayUser.name}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {displayUser.role === "patient"
                  ? `UHID: ${displayUser.uhid}`
                  : displayUser.department
                    ? `${displayUser.department} Admin`
                    : displayUser.role === "admin"
                      ? "Administrator"
                      : displayUser.role?.replace("_", " ") || "Staff"}
              </p>
            </div>
            <div className="h-10 w-10 rounded-none bg-[#051C12] flex items-center justify-center text-[#B5E4A3] text-xs font-black shadow-sm">
              {displayUser.initials || displayUser.name?.[0]?.toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex flex-col text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Date
            </p>
            <p className="text-xs font-bold text-gray-900">{currentDate}</p>
          </div>
        )}
      </div>
    </header>
  );
}
