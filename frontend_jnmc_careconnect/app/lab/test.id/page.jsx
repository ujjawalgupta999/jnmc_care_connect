import React from 'react';
import {
    Search, Bell, Clock, AlertCircle, Calendar, FileText,
    RefreshCw, Filter, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';

const PENDING_TESTS = [
    { id: "8287", name: "Mohd. Rafiq Ahmed", uhid: "UHID-2024-05847", details: "45Y/M", sampleId: "SMP-2024-0847", type: "CBC", typeColor: "text-red-600 bg-red-50", time: "24 Oct, 08:30 AM", timeRelative: "2 hours ago", priority: "Urgent" },
    { id: "7272", name: "Priya Sharma", uhid: "UHID-2024-03291", details: "32Y/F", sampleId: "SMP-2024-0848", type: "LFT", typeColor: "text-purple-600 bg-purple-50", time: "24 Oct, 09:15 AM", timeRelative: "1.5 hours ago", priority: "Normal" },
    { id: "9828", name: "Abdul Wahid Khan", uhid: "UHID-2024-02938", details: "62Y/M", sampleId: "SMP-2024-0841", type: "KFT", typeColor: "text-blue-600 bg-blue-50", time: "23 Oct, 04:30 PM", timeRelative: "Overdue 18 hrs", priority: "Overdue" },
];

export default function PendingTests() {
    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <div>
                        <h1 className="font-bold text-sm leading-tight text-slate-900">JNMC</h1>
                        <p className="text-[10px] text-slate-500 tracking-widest uppercase">Pathology Lab</p>
                    </div>
                </div>

                <nav className="mt-4 px-4 flex-1 space-y-1">
                    <p className="px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">
                        <FileText size={18} /> Upload Reports
                    </button>
                    <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium bg-slate-100 border-r-4 border-slate-900 text-slate-900 rounded-l-lg">
                        <div className="flex items-center gap-3"><Clock size={18} /> Pending Tests</div>
                        <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded font-bold">24</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">
                        <svg size={18} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        Completed
                    </button>
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">AK</div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Dr. Adil Khan</p>
                            <p className="text-[10px] text-slate-400">Lab Technician</p>
                        </div>
                    </div>
                    <LogOut size={16} className="text-slate-400 cursor-pointer hover:text-red-500" />
                </div>
            </aside>

            {/* Main Container */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by Patient Name, Sample ID, UHID..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-slate-400 font-sans bg-white">⌘K</kbd>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative cursor-pointer">
                            <Bell size={20} className="text-slate-600" />
                            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Today</p>
                            <p className="text-xs font-bold">Oct 24, 2024</p>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-8 flex-1 overflow-y-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">Pending Tests</h2>
                        <p className="text-sm text-slate-500">24 samples awaiting results entry</p>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Pending', count: 24, icon: <Clock size={20} />, color: 'bg-yellow-50 text-yellow-600' },
                            { label: 'Urgent / Priority', count: 5, icon: <AlertCircle size={20} />, color: 'bg-red-50 text-red-600' },
                            { label: 'Due Today', count: 12, icon: <Calendar size={20} />, color: 'bg-blue-50 text-blue-600' },
                            { label: 'Overdue', count: 3, icon: <AlertCircle size={20} />, color: 'bg-orange-50 text-orange-600' },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
                                    <p className="text-3xl font-bold">{kpi.count}</p>
                                </div>
                                <div className={`p-2 rounded-lg ${kpi.color}`}>{kpi.icon}</div>
                            </div>
                        ))}
                    </div>

                    {/* Table Area */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        {/* Filters Bar */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex gap-2">
                                <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"><Filter size={16} /> Filter</button>
                                <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
                                <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"><Calendar size={16} /> Date Range</button>
                            </div>
                            <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"><RefreshCw size={16} /> Refresh</button>
                        </div>

                        {/* Table */}
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">id</th>
                                    <th className="px-6 py-4">Patient Details</th>
                                    <th className="px-6 py-4">Sample ID / Barcode</th>
                                    <th className="px-6 py-4">Test Type</th>
                                    <th className="px-6 py-4">Collection Time</th>
                                    <th className="px-6 py-4">Priority</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {PENDING_TESTS.map((test, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-400">{test.id}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900">{test.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase">{test.uhid} | {test.details}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[10px] font-bold text-slate-700 mb-1">{test.sampleId}</p>
                                            <div className="flex gap-[2px]">
                                                {[1, 2, 1, 3, 1, 2, 1].map((w, i) => <div key={i} className={`h-4 bg-slate-900`} style={{ width: `${w}px` }}></div>)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${test.typeColor}`}>{test.type}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-bold text-slate-700">{test.time}</p>
                                            <p className={`text-[10px] font-medium ${test.priority === 'Overdue' ? 'text-orange-600' : 'text-slate-400'}`}>{test.timeRelative}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase text-white ${test.priority === 'Urgent' ? 'bg-red-600' :
                                                    test.priority === 'Overdue' ? 'bg-orange-600' : 'bg-slate-200 text-slate-600'
                                                }`}>
                                                {test.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="bg-[#0F172A] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-black transition-colors active:scale-95">
                                                Enter Result
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Footer */}
                        <div className="p-4 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
                            <p className="text-xs text-slate-400">Showing 1-6 of 24 pending tests</p>
                            <div className="flex items-center gap-1">
                                <button className="p-1.5 rounded hover:bg-slate-200 text-slate-500 flex items-center gap-1 text-xs font-bold"><ChevronLeft size={14} /> Prev</button>
                                <button className="w-8 h-8 rounded bg-slate-900 text-white text-xs font-bold">1</button>
                                <button className="w-8 h-8 rounded hover:bg-slate-200 text-xs font-bold">2</button>
                                <button className="w-8 h-8 rounded hover:bg-slate-200 text-xs font-bold">3</button>
                                <button className="p-1.5 rounded hover:bg-slate-200 text-slate-500 flex items-center gap-1 text-xs font-bold">Next <ChevronRight size={14} /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}