import React from "react";

function ProfileSidebar({ open, setOpen, user }) {
  return (
    <>
      {/* BACKDROP */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300
        ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* SIDEBAR */}
      <div
        className={`fixed right-0 top-0 w-80 h-full bg-white shadow-lg p-5 z-50
        transform transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <button onClick={() => setOpen(false)}>Close</button>

        <h2 className="mt-4 text-lg font-semibold">
          Profile Sidebar
        </h2>
      </div>
    </>
  );
}

export default ProfileSidebar;