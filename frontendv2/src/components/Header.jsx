import { useContext, useState, useEffect, use } from "react";
import { AuthContext } from "../context/AuthContext";
import ProfileSidebar from "./ProfileSidebar";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ppo from "../assets/ppo.png";


function Header({ theme = "found", shown, about, onCL }) {
  const { user, fetchUser } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [fetchedUser, setFetchedUser] = useState(null);
  const isLoggedIn = !!localStorage.getItem("token");
  const [showDown, setShowDown] = useState(false);

  const navigate = useNavigate();
  useEffect(() => {
    // Close sidebar on route change
    const handleRouteChange = () => setOpen(false);
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  const themeStyles = {
    found: `${shown ? " bg-black/30 backdrop-blur-md rounded-3xl top-2" : "bg-foundheader"}`,
    lost: `${shown ? " bg-black/30 backdrop-blur-md rounded-3xl top-2" : "bg-lostheader"}`,
    reports: `${shown ? "bg-gradient-to-r from-reportsStartheader/30 to-reportsEndheader/30 backdrop-blur-md rounded-3xl top-2" : "bg-gradient-to-r from-reportsStartheader to-reportsEndheader"}`,
  };

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/about");
  }

  window.onload = () => {
    fetchUser();
    setFetchedUser(true);
  }

  useEffect(() => {
    if (!shown) { setShowDown(false); }
  }, [shown]);

  return (
    <>

      <header
        className={` fixed top-0 left-1/2 -translate-x-1/2 z-50 ${shown ? "w-10/12" : about ? "w-full translate-y-[-100%]" : "w-full"} flex justify-between items-center px-6 py-4 text-white transition-all duration-500 ease ${themeStyles[theme]}  `}

      >
        {/* LEFT SECTION */}
        <div className="flex items-center gap-4">

          {/* Search Icon Circle */}
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
            <span className="text-lg"><Search /></span>
          </div>

          {/* Logo + Text */}
          <div className="flex flex-col leading-tight hover:cursor-pointer" onClick={() => navigate("/about")}>
            <h1 className="text-xl font-bold tracking-wide font-serifCustom">
              Lost&Found
            </h1>
            <span className="text-[9px] tracking-[3px] text-white/70">
              CAMPUS NETWORK
            </span>
          </div>
        </div>

        {/* RIGHT SECTION */}
        {(isLoggedIn) ? (
          <div
            onClick={() => setShowDown(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md cursor-pointer hover:bg-white/20 hover:scale-[1.1] transition"
          >
            <div className="relative">
              <img
                src={user?.profile_pic || ppo}
                alt="profile"
                className="w-7 h-7 rounded-full object-cover"
              />
              <span className="status-dot" style={{ position: "absolute", bottom: 0, right: 0, width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "green", border: "2px solid white" }} />
            </div>

            {/* Slightly smaller text */}<div className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{(user?.name) ? "Welcome Back," : "Profile"}</span>
              <span className={`text-xs text-white/70 ${(user?.name) ? "" : " hidden"}`}>{(user?.name) ? user?.name : ""}</span>
              {/* Proper dropdown arrow */}

            </div>
            <ChevronDown size={16} className="opacity-80" />
          </div>
        ) : (
          /* LOGIN BUTTON */
          <button
            onClick={() => window.location.href = "/login"}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-md transition hover:bg-white/20 hover:scale-[1.1] text-sm font-medium"
          >
            Login / Sign Up
          </button>
        )}
      </header>

      {
        showDown && (
          <div onClick={() => setShowDown(false)} className="fixed inset-0 z-50" >
            <div
              className="fixed top-20 right-6 w-40 bg-black/50 backdrop-blur-md border border-white/20 rounded-xl shadow-lg z-50 animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  window.location.href = "/home";
                }}
                className="w-full text-left px-4 py-3 hover:bg-white/50 transition text-white rounded-xl"
              >
                Home
              </button>
              <button
                onClick={() => {
                  {setOpen(true); setShowDown(false);}
                }}
                className="w-full text-left px-4 py-3 hover:bg-white/50 transition text-white rounded-xl"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  {onCL(); setShowDown(false);}
                }}
                hidden={about}
                className="w-full text-left px-4 py-3 hover:bg-white/50 transition text-white rounded-xl"
              >
                My Reports
              </button>
              <button
                onClick={() => {handleLogout(); setShowDown(false);}}
                className="w-full text-left px-4 py-3 hover:bg-red-500/50 transition text-red-300 rounded-xl"
              >
                Logout
              </button>
            </div>
          </div>
        )
      }

      {/* Sidebar */}
      <ProfileSidebar isOpen={open} setIsOpen={setOpen} about={about} user={user} />
    </>
  );
}

export default Header;