"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Calendar,
  CreditCard,
  Wallet,
  Building,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getFinancialStats } from "@/lib/api";
import { toast } from "sonner";

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function FinancialsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("week"); // day, week, month
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getFinancialStats(filter);
        if (response.success) {
          setData(response.data);
          setCurrentPage(1); // Reset to first page on filter change
        } else {
          toast.error("Failed to load financial data");
        }
      } catch (error) {
        console.error("Financials Error:", error);
        toast.error("Error fetching financials");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) return null;

  const { totalRevenue, avgOrderValue, revenueData, transactions } = data;

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Financial Overview
          </h2>
          <p className="text-gray-500 mt-1 font-medium">
            Revenue tracking and transaction analysis.
          </p>
        </div>
        <div className="flex items-center gap-0 border border-gray-200 bg-white shadow-sm">
          {/* Filter Buttons - Sharp Corners */}
          {["day", "week", "month"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 text-sm font-bold uppercase transition-all border-r last:border-r-0 border-gray-200",
                filter === f
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-500 hover:bg-gray-50",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Finance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinanceCard
          label="Total Revenue (Lifetime)"
          value={indianCurrency.format(totalRevenue)}
          trend="Tracked"
          trendUp={true}
          icon={Wallet}
        />
        <FinanceCard
          label="Avg. Order Value"
          value={indianCurrency.format(avgOrderValue)}
          trend="Per Booking"
          trendUp={true}
          icon={CreditCard}
        />
      </div>

      {/* Revenue Chart - Sharp Corners */}
      <div className="bg-white border border-gray-100 p-8 shadow-sm rounded-none">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-bold text-gray-900">
              Revenue Trend ({filter})
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Revenue over selected time range.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <div className="w-3 h-3 rounded-none bg-blue-600" />
              Revenue
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f3f4f6"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => indianCurrency.format(value)}
                  contentStyle={{
                    borderRadius: "0px", // Sharp
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    fontWeight: "bold",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions - Sharp Corners & Pagination */}
      <div className="bg-white border border-gray-100 shadow-sm overflow-hidden rounded-none">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Transactions</h3>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Transaction ID
                </th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Patient / Test
                </th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Amount
                </th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Status
                </th>
                <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {currentTransactions && currentTransactions.length > 0 ? (
                currentTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <span className="text-xs font-black text-gray-600 font-mono tracking-tighter">
                        {txn.id}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {txn.patient}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {txn.test}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black text-gray-900">
                        {indianCurrency.format(txn.amount)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={cn(
                          "px-3 py-1 text-[10px] font-black uppercase tracking-widest", // Sharp badge (removed rounded-full)
                          txn.status === "Paid"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-orange-50 text-orange-600",
                        )}
                      >
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] text-gray-500 font-bold">
                        {txn.date}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-8 py-8 text-center text-gray-400 font-bold text-sm"
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-8 py-4 border-t border-gray-50 bg-gray-50/30">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-3 w-3" /> Previous
          </button>
          <div className="flex gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Simple logic to show first 5 pages or relevant ones
              let p = i + 1;
              if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
              if (p > totalPages) return null;

              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center border text-xs font-bold",
                    currentPage === p
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50",
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ label, value, trend, trendUp, icon: Icon }) {
  return (
    <div className="bg-white border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all group rounded-none">
      <div className="flex items-center justify-between mb-6">
        <div className="p-3 bg-gray-50 text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all rounded-none">
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-none",
              trendUp
                ? "bg-emerald-50 text-emerald-600"
                : "bg-gray-50 text-gray-400",
            )}
          >
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : null}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
          {label}
        </p>
        <h4 className="text-3xl font-black text-gray-900 tracking-tight">
          {value}
        </h4>
      </div>
    </div>
  );
}

function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}
