"use client";

import React from "react";
import { Phone, AlertCircle, Shield, Truck, Flame, Heart } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const emergencyContacts = [
  {
    category: "JNMC Emergency",
    icon: <AlertCircle className="w-6 h-6 text-red-500" />,
    contacts: [
      { name: "Emergency Desk 1", number: "0571-2721165" },
      { name: "Emergency Desk 2", number: "0571-2721214" },
    ],
    className: "border-red-500/20 bg-red-50/50 dark:bg-red-950/10",
  },
  {
    category: "National Emergency",
    icon: <Shield className="w-6 h-6 text-blue-500" />,
    contacts: [
      { name: "National Help Line", number: "112" },
      { name: "Police", number: "100" },
    ],
  },
  {
    category: "Fire & Rescue",
    icon: <Flame className="w-6 h-6 text-orange-500" />,
    contacts: [{ name: "Fire Department", number: "101" }],
  },
  {
    category: "Medical Services",
    icon: <Truck className="w-6 h-6 text-green-500" />,
    contacts: [
      { name: "Ambulance", number: "102" },
      { name: "Blood Bank", number: "104" },
    ],
  },
];

export default function EmergencyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020817] pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Emergency <span className="text-red-600">Contacts</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
            Immediate assistance and critical response contacts for Aligarh and
            National services. Available 24/7 for patient safety and urgent
            care.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {emergencyContacts.map((group, idx) => (
            <Card
              key={idx}
              className={`shadow-none border-2 transition-all duration-300 hover:shadow-xl ${group.className || "border-slate-100 dark:border-white/5 bg-white dark:bg-white/5"}`}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className="p-3 bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/10">
                  {group.icon}
                </div>
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">
                    {group.category}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {group.contacts.map((contact, cIdx) => (
                  <div
                    key={cIdx}
                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 border border-slate-50 dark:border-white/5"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
                        {contact.name}
                      </span>
                      <span className="text-lg font-black text-slate-900 dark:text-white mt-1 tabular-nums">
                        {contact.number}
                      </span>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      className="rounded-none bg-[#051C12] hover:bg-[#0A261B] text-[#B5E4A3] font-bold"
                    >
                      <a href={`tel:${contact.number.replace(/-/g, "")}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="p-8 border-l-4 border-red-600 bg-red-50 dark:bg-red-950/10 text-red-900 dark:text-red-400">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-black text-lg uppercase tracking-tight">
                Critical Note
              </h3>
              <p className="text-sm font-medium leading-relaxed opacity-90">
                In case of a medical emergency at JNMC, please proceed directly
                to the Casualty / Emergency department. Our trauma center is
                fully equipped to handle specialized urgent cases 24 hours a
                day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
