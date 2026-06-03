"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FlaskConical, Clock, Beaker, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Footer from "../../layout/footer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ExploreTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [error, setError] = useState(null);

  // Fetch tests from API
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`${API_URL}/lab/tests`);
        const data = await res.json();
        if (data.success) {
          setTests(data.tests);
        } else {
          setError("Failed to load tests");
        }
      } catch (err) {
        console.error("Error fetching tests:", err);
        setError("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  // Get unique departments
  const departments = useMemo(() => {
    const deptSet = new Set(tests.map((t) => t.department || "General"));
    return ["All", ...Array.from(deptSet).sort()];
  }, [tests]);

  // Filter tests based on search and department
  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesSearch =
        test.testName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.testCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept =
        selectedDepartment === "All" ||
        (test.department || "General") === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [tests, searchQuery, selectedDepartment]);

  // Group tests by department for display
  const groupedTests = useMemo(() => {
    const groups = {};
    filteredTests.forEach((test) => {
      const dept = test.department || "General";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(test);
    });
    return groups;
  }, [filteredTests]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 pt-28">
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#D4F1C5]/20 px-4 py-2 text-sm font-medium text-[#B5E4A3]">
              <FlaskConical className="h-4 w-4" />
              JNMC Diagnostic Services
            </div>
            <h1 className="text-4xl font-bold text-white md:text-5xl">
              Explore All Available{" "}
              <span className="text-[#B5E4A3]">Lab Tests</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-gray-400">
              Browse our comprehensive catalog of diagnostic tests available at
              JNMC Hospital. High-quality testing with quick turnaround times.
            </p>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tests by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-none border-0 bg-white/10 py-4 pl-12 pr-4 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#B5E4A3]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="appearance-none rounded-none border-0 bg-white/10 py-4 pl-12 pr-10 text-white backdrop-blur-sm transition-all focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#B5E4A3]/50"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept} className="bg-gray-800">
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mt-8 flex justify-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="text-center">
              <p className="text-3xl font-bold text-[#B5E4A3]">
                {tests.length}
              </p>
              <p className="text-sm text-gray-400">Total Tests</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#B5E4A3]">
                {departments.length - 1}
              </p>
              <p className="text-sm text-gray-400">Departments</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#B5E4A3]">
                {filteredTests.length}
              </p>
              <p className="text-sm text-gray-400">Matching Results</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tests Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#B5E4A3]" />
            <p className="mt-4 text-gray-500">Loading tests...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-lg text-red-500">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-none bg-gray-900"
            >
              Retry
            </Button>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FlaskConical className="h-16 w-16 text-gray-300" />
            <p className="mt-4 text-lg text-gray-500">No tests found</p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filter
            </p>
          </div>
        ) : selectedDepartment === "All" ? (
          // Show grouped by department
          <div className="space-y-12">
            {Object.entries(groupedTests)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dept, deptTests]) => (
                <motion.div
                  key={dept}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-none bg-[#D4F1C5]">
                      <Beaker className="h-5 w-5 text-gray-800" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {dept}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {deptTests.length} test
                        {deptTests.length !== 1 ? "s" : ""} available
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {deptTests.map((test, idx) => (
                      <TestCard key={test._id || idx} test={test} />
                    ))}
                  </div>
                </motion.div>
              ))}
          </div>
        ) : (
          // Show flat grid
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-none bg-[#D4F1C5]">
                <Beaker className="h-5 w-5 text-gray-800" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedDepartment}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredTests.length} test
                  {filteredTests.length !== 1 ? "s" : ""} available
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTests.map((test, idx) => (
                <TestCard key={test._id || idx} test={test} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Back to Home */}
      <section className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="mb-4 text-gray-600">
            Ready to book a test? Visit our hospital or contact us.
          </p>
          <Link href="/">
            <Button className="rounded-full bg-gray-900 px-8 py-3 font-medium text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function TestCard({ test }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-lg"
    >
      {/* Department Badge */}
      <div className="absolute right-4 top-4">
        <span className="rounded-none bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {test.testCode}
        </span>
      </div>

      {/* Test Name */}
      <h3 className="pr-16 text-lg font-semibold text-gray-900 group-hover:text-[#4a7c59]">
        {test.testName}
      </h3>

      {/* Info Row */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
        {test.sampleType && (
          <div className="flex items-center gap-1.5">
            <Beaker className="h-4 w-4 text-gray-400" />
            <span>{test.sampleType}</span>
          </div>
        )}
        {test.turnaroundTime && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{test.turnaroundTime}</span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="mt-5 flex items-end justify-between border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs text-gray-400">Starting from</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{test.priceINR?.toLocaleString("en-IN") || "N/A"}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4F1C5] text-gray-800 opacity-0 transition-opacity group-hover:opacity-100">
          <FlaskConical className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}
