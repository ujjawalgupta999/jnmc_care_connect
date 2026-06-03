"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Activity,
  Clock,
  ChevronDown,
  MoreHorizontal,
  Calendar,
  CreditCard,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getSystemStats } from "@/lib/api";
import { toast } from "sonner";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getSystemStats();
        if (response.success) {
          setData(response);
        } else {
          toast.error("Failed to fetch dashboard data");
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        toast.error("Error loading dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) return null;

  const { topMetrics, charts, recentActivity } = data;

  // Transform hourly volume for Recharts
  const barData = data?.charts?.hourlyVolume
    ? Object.entries(data.charts.hourlyVolume).map(([time, volume]) => ({
        time,
        volume,
      }))
    : [];

  // Transform department split for PieChart
  const pieData = data?.charts?.departmentSplit
    ? data.charts.departmentSplit.map((dept) => ({
        name: dept.department,
        value: dept.count,
        percentage: dept.percentage,
      }))
    : [];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Executive Dashboard
          </h2>
          <p className="text-gray-500 mt-1 font-medium">
            Overview of today's laboratory operations.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-700">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Revenue Today"
          value={indianCurrency.format(topMetrics.dailyRevenue || 0)}
          icon={CreditCard}
          sub="Gross Income"
          subColor="text-gray-500"
        />
        <StatCard
          label="Tests Conducted"
          value={topMetrics.testsToday}
          icon={Activity}
          sub={`${topMetrics.completionRate}% Completion`}
          subColor="text-blue-600"
        />
        <StatCard
          label="Pending Results"
          value={topMetrics.pendingResults}
          icon={Clock}
          sub="Requires Attention"
          subColor="text-orange-500"
        />
        <StatCard
          label="Completed"
          value={topMetrics.completedCount}
          icon={FileText}
          sub="Reports Generated"
          subColor="text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 rounded-3xl bg-white border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-gray-900 text-lg">
              Hourly Testing Volume
            </h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-xl border border-gray-800">
                          {payload[0].value} tests
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="volume"
                  radius={[6, 6, 0, 0]}
                  fill="#3b82f6"
                  barSize={40}
                >
                  {barData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.volume > 0 ? "#3b82f6" : "#e5e7eb"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Chart */}
        <div className="rounded-3xl bg-white border border-gray-100 p-8 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-900 mb-8 text-lg">
            Department Split
          </h3>
          <div className="h-[250px] relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-3xl font-black text-gray-900">
                {topMetrics.testsToday}
              </p>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                Total
              </p>
            </div>
          </div>
          <div className="mt-8 space-y-4 overflow-y-auto pr-2 max-h-[200px] custom-scrollbar">
            {pieData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span
                    className="text-sm font-medium text-gray-600 truncate max-w-[120px]"
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {item.value}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
            ))}
            {pieData.length === 0 && (
              <div className="text-center text-gray-400 text-sm py-4">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-3xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-lg">Recent Bookings</h3>
          <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  UHID
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentActivity &&
                recentActivity.map((booking) => (
                  <tr
                    key={booking._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-gray-900">
                        {booking.patientName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {booking.uhid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {indianCurrency.format(booking.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-medium">
                      {new Date(booking.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-400 font-medium"
                  >
                    No recent activity found today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, sub, subColor }) {
  return (
    <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h4 className="text-3xl font-black text-gray-900">{value}</h4>
        {sub && (
          <span className={cn("text-[11px] font-bold", subColor)}>{sub}</span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Pending: "bg-yellow-50 text-yellow-700 border-yellow-100",
    "Sample Collected": "bg-blue-50 text-blue-700 border-blue-100",
    Processing: "bg-purple-50 text-purple-700 border-purple-100",
    Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Cancelled: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-bold border",
        styles[status] || "bg-gray-50 text-gray-600",
      )}
    >
      {status}
    </span>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
