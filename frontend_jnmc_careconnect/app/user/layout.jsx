import TopBar from "../layout/top-bar";
import Sidebar from "../layout/sidebar";

export default function UserLayout({ children }) {
  // Mock user for the top bar
  const mockUser = {
    name: "Adil Khan",
    uhid: "562465426",
    initials: "AK",
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <TopBar title="My Profile" user={mockUser} />
      <Sidebar role="user" />
      <main className="lg:pl-64 pt-16 min-h-screen transition-all duration-300">
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
