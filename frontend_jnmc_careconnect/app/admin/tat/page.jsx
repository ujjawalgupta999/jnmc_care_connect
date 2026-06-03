"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Clock, AlertTriangle, TrendingUp, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function TatDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Token is stored in localStorage or needs to be passed via context
        // In AuthContext, 'user' state might just be user data, not token
        const token = localStorage.getItem("token") || user?.token;

        if (!token) {
          console.error("No token found for TAT stats fetch");
          return;
        }
        // but verify middleware usually needs it.
        // Assuming cookie-based or handle it if needed.

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        console.log(
          "Fetching TAT stats with token:",
          token ? "Token present" : "No token",
        );

        const [statsRes, overdueRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/tat/stats", { headers }),
          fetch("http://localhost:5000/api/admin/tat/overdue", { headers }),
        ]);

        const statsData = await statsRes.json();
        const overdueData = await overdueRes.json();

        if (statsData.success) setStats(statsData);
        if (overdueData.success) setOverdue(overdueData.overdue);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load TAT analytics");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  if (!stats) return null;

  const tatData = [
    { name: "Pre-Lab", minutes: stats.averages.preLab, target: 60 },
    { name: "Intra-Lab", minutes: stats.averages.intraLab, target: 60 },
    { name: "Clinical", minutes: stats.averages.clinical, target: 120 }, // Example target
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Turnaround Time Analytics
          </h2>
          <p className="text-gray-500 mt-1 font-medium">
            Performance metrics and bottleneck detection
          </p>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
            Total Analyzed
          </span>
          <p className="text-2xl font-black text-gray-900">
            {stats.counts.total}
          </p>
        </div>
      </div>

      {/* TAT Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TatCard
          label="Pre-Lab TAT"
          value={`${stats.averages.preLab}m`}
          target="< 60m"
          status={stats.averages.preLab > 60 ? "danger" : "success"}
        />
        <TatCard
          label="Intra-Lab TAT"
          value={`${stats.averages.intraLab}m`}
          target="< 60m"
          status={stats.averages.intraLab > 60 ? "danger" : "success"}
        />
        <TatCard
          label="Clinical TAT"
          value={`${stats.averages.clinical}m`}
          target="< 120m"
          status="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-gray-100 p-8 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-6">
            Phase Performance vs Targets
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tatData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type="number" unit="m" />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fontWeight: "bold" }}
                />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar
                  dataKey="minutes"
                  fill="#3b82f6"
                  radius={[0, 6, 6, 0]}
                  barSize={32}
                  name="Avg Time"
                />
                <Bar
                  dataKey="target"
                  fill="#e5e7eb"
                  radius={[0, 6, 6, 0]}
                  barSize={10}
                  name="Target SLA"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="rounded-3xl bg-white border border-gray-100 p-8 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Bottlenecks Detected
          </h3>
          <div className="space-y-4">
            <BottleneckItem
              label="Transport Delays"
              count={stats.bottlenecks.transport}
              total={stats.counts.preLab}
            />
            <BottleneckItem
              label="Processing Delays"
              count={stats.bottlenecks.processing}
              total={stats.counts.intraLab}
            />
            {/* Add more if tracked */}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="font-bold text-gray-900 text-sm mb-4">
              Overdue Bookings ({overdue.length})
            </h4>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {overdue.map((item) => (
                <div
                  key={item._id}
                  className="flex justify-between items-start bg-red-50 p-3 rounded-lg border border-red-100"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {item.patientName}
                    </p>
                    <p className="text-[10px] text-red-600 font-semibold">
                      {item.reason}
                    </p>
                  </div>
                  <span className="text-xs font-black text-red-700">
                    {item.elapsedMinutes}m
                  </span>
                </div>
              ))}
              {overdue.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">
                  No overdue items
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TatCard({ label, value, target, status }) {
  const colors = {
    success: "text-emerald-600 bg-emerald-50",
    danger: "text-red-600 bg-red-50",
    neutral: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
        {label}
      </p>
      <div className="flex items-baseline gap-3">
        <h4
          className={`text-4xl font-black ${status === "danger" ? "text-red-600" : "text-gray-900"}`}
        >
          {value}
        </h4>
        <span className="text-xs font-bold text-gray-400">
          Target: {target}
        </span>
      </div>
    </div>
  );
}

function BottleneckItem({ label, count, total }) {
  const percentage = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="font-bold text-gray-900">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${percentage > 20 ? "bg-red-500" : "bg-amber-400"}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
