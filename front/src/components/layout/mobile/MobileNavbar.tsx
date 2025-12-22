import { Menu, Bell } from "lucide-react";

interface MobileNavbarProps {
  onToggleSidebar: () => void;
}

export const MobileNavbar = ({ onToggleSidebar }: MobileNavbarProps) => {
  return (
    <nav className="h-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 sticky top-0 z-40 shadow-lg">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left */}
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Center - Logo */}
        <h1 className="text-white font-bold text-lg">Carnicería</h1>

        {/* Right */}
        <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      </div>
    </nav>
  );
};
