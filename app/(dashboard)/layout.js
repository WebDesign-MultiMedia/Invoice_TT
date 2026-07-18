import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 lg:h-screen lg:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</div>
    </div>
  );
}
