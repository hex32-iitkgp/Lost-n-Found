import { useContext, useState, useEffect, use } from "react";
import { AuthContext } from "../context/AuthContext";
import ProfileSidebar from "./ProfileSidebar";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";


function Header({ theme = "found" }) {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");

  const navigate = useNavigate();
  useEffect(() => {
    // Close sidebar on route change
    const handleRouteChange = () => setOpen(false);
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  const themeStyles = {
    found: "bg-foundheader",
    lost: "bg-lostheader",
    reports: "bg-gradient-to-r from-reportsStartheader to-reportsEndheader",
  };

  return (
    <>
      <header
        className={`flex justify-between items-center px-6 py-4 text-white transition-all duration-500 ease ${themeStyles[theme]}`}
      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4">

          {/* Search Icon Circle */}
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <span className="text-lg">🔍</span>
          </div>

          {/* Logo + Text */}
          <div className="flex flex-col leading-tight">
            <h1 className="text-xl font-bold tracking-wide font-serifCustom">
              Lost&Found
            </h1>
            <span className="text-[9px] tracking-[3px] text-white/70">
              CAMPUS NETWORK
            </span>
          </div>
        </div>

        {/* RIGHT SECTION */}
        {isLoggedIn ? (
          <div
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md cursor-pointer hover:bg-white/20 hover:scale-[1.1] transition"
          >
            <img
              src={user?.profile_pic || "https://via.placeholder.com/40"}
              alt="profile"
              className="w-7 h-7 rounded-full object-cover"
            />

            {/* Slightly smaller text */}
            <span className="text-sm font-medium">Profile</span>

            {/* Proper dropdown arrow */}
            <ChevronDown size={16} className="opacity-80" />
          </div>
        ) : (
          /* LOGIN BUTTON */
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20 hover:scale-[1.1] text-sm font-medium"
          >
            Login / Sign Up
          </button>
        )}
      </header>

      {/* Sidebar */}
      <ProfileSidebar open={open} setOpen={setOpen} user={user} />
    </>
  );
}

export default Header;