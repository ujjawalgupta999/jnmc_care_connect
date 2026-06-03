import TopBar from "../layout/top-bar";
import Sidebar from "../layout/sidebar";

export default function DoctorLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <TopBar />
      <Sidebar role="doctor" />
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
