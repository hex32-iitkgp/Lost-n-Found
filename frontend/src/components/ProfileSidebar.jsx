import React from "react";

function ProfileSidebar({ open, setOpen, user }) {
  if (!open) return null;

  return (
    <>
      {/* 🔥 BACKDROP (blur + dim) */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={() => setOpen(false)}
      />

      {/* 🧱 SIDEBAR */}
      <div className="fixed right-0 top-0 w-80 h-full bg-white shadow-lg p-5 z-50 transform transition-transform duration-300 translate-x-0">
        
        <button 
          onClick={() => setOpen(false)} 
          className="mb-4"
        >
          Close
        </button>

        <div className="mt-4 text-center">
          <img
            src={user?.profile_pic || "https://via.placeholder.com/100"}
            alt="profile"
            className="w-20 h-20 rounded-full mx-auto object-cover"
          />

          <h2 className="mt-3 text-lg font-semibold">{user?.name}</h2>
          <p className="text-sm text-gray-600">{user?.place}</p>
        </div>

        <div className="mt-6 space-y-3">
          <button className="w-full py-2 bg-gray-100 rounded">
            Edit Profile
          </button>

          <button className="w-full py-2 bg-gray-100 rounded">
            Change Password
          </button>

          <button className="w-full py-2 bg-green-600 text-white rounded">
            Upload Item
          </button>
        </div>

      </div>
    </>
  );
}

export default ProfileSidebar;