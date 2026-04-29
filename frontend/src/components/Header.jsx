import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

function Header({ theme = "found" }) {
  const { user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  const themeStyles = {
    found: "bg-green-900 text-white",
    lost: "bg-red-800 text-white",
    reports: "bg-gradient-to-r from-purple-700 to-blue-700 text-white",
  };

   return (
    <>
      <header
        className={`flex justify-between items-center px-6 py-3 ${themeStyles[theme]}`}
      >
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full" />
          <h1 className="text-xl font-semibold">LOST n’ FOUND</h1>
        </div>

        {/* RIGHT */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <img
            src={user?.profile_pic || "https://via.placeholder.com/40"}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span>Profile</span>
        </div>
      </header>

      {/* 👇 Sidebar rendered here */}
      <ProfileSidebar open={open} setOpen={setOpen} user={user} />
    </>
  );
}

export default Header;