import { useState, useRef, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import noimg from "../assets/ppo.png";
import { updateUser } from "../services/auth";

function SidebarProfile({ isOpen, setIsOpen }) {
  const { user, fetchUser, setUser } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    location: "",
    image: null,
    preview: null,
    oldpassword: "",
    newpassword: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const fileRef = useRef();
  const [passChange, setPassChange] = useState(false);
  useEffect(() => {
    if (user && !isEditing) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        location: user.location || "",
        image: null,
        preview: user.profile_pic || null,
        oldpassword: "",
        newpassword: "",
      });
    }
  }, [user]);

  // 🔄 text input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "newpassword" && e.target.value.length !== 0) {
      setPassChange(true);
    }
  };

  // 📸 open file picker
  const handleImageClick = () => {
    fileRef.current.click();
  };

  // 📸 preview image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm({
      ...form,
      image: file,
      preview: URL.createObjectURL(file),
    });

    // 🔥 auto switch to edit mode
    setIsEditing(true);
  };

  // 💾 save (frontend only for now)
  const handleSave = async () => {
    try {
      setSaving(true);
      setIsEditing(false);
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("location", form.location);
      if (form.image) {
        formData.append("profile_pic", form.image);
      }
      formData.append("oldpassword", form.oldpassword);
      formData.append("newpassword", form.newpassword);

      await updateUser(formData);
      fetchUser();
      if (passChange) {
        localStorage.removeItem("token");
        alert("Password changed. Please log in again.");
        window.location.href = "/login";
      }

    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
       // Refresh user data from server
      setUser((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
        location: user.location,
        image: null,
        preview: user.profile_pic,
      }));
      console.log("Updated user:", {
        name: user.name,
        email: user.email,
        location: user.location,
        preview: user.profile_pic,
      });
    }
  };
  const isFormValid = () => {
    const emailValid = /\S+@\S+\.\S+/.test(form.email);
    const nameValid = form.name.trim().length > 0;

    return emailValid && nameValid;
  };

  // 🚪 logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <>
      {/* 🔥 BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 🔥 SIDEBAR */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-xl transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="p-6 flex flex-col items-center">

          {/* ❌ CLOSE BUTTON */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20"
          >
            ❌
          </button>

          {/* 🖼 PROFILE IMAGE */}
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-2"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={handleImageClick}
          >
            <img
              src={form.preview || noimg}
              alt="profile"
              className={`w-full h-full object-cover transition ${hover ? "blur-sm" : ""
                }`}
            />

            {hover && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium bg-black/40">
                Change
              </div>
            )}

            <input
              type="file"
              ref={fileRef}
              hidden
              onChange={handleFileChange}
            />
          </div>

          {/* 📄 FORM */}
          <div className="w-full mt-6 space-y-4">

            {/* NAME */}
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-3 border rounded-lg outline-none ${isEditing ? "border-blue-500" : "bg-gray-100"
                }`}
            />

            {/* EMAIL */}
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-3 border rounded-lg outline-none ${isEditing ? "border-blue-500" : "bg-gray-100"
                }`}
            />

            {/* LOCATION */}
            <input
              type="text"
              name="location"
              placeholder="Location (e.g., Campus, Building)"
              value={form.location}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full p-3 border rounded-lg outline-none ${isEditing ? "border-blue-500" : "bg-gray-100"
                }`}
            />
            {/* Password Change*/}
            <input
              type="password"
              name="oldpassword"
              placeholder="Current Password"
              hidden={passChange ? false : true}
              value={form.oldpassword || ""}
              disabled={!isEditing}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg outline-none ${isEditing ? "border-blue-500" : "bg-gray-100"
                }`}
            />
            <input
              type="password"
              name="newpassword"
              placeholder="New Password (unchanged)"
              value={form.newpassword || ""}
              disabled={!isEditing}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg outline-none ${isEditing ? "border-blue-500" : "bg-gray-100"
                }`}
            />
            {/* EDIT / SAVE */}
            <div className="flex justify-end">
              <button
                onClick={() =>
                  isEditing ? handleSave() : setIsEditing(true)
                }
                disabled={(isEditing && !isFormValid()) || saving}
                className={`px-4 py-2 text-white rounded-lg transition
    ${isEditing && !isFormValid()
                    ? "bg-gray-400 cursor-not-allowed flex justify-center"
                    : "bg-blue-600 hover:opacity-90 flex justify-center"
                  } disabled:opacity-50 disabled:cursor-not-allowed
  `}
              >
                {isEditing ? "Save" : saving ? "Saving..." : "Edit"}
              </button>
            </div>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="w-full mt-4 py-3 bg-red-500 text-white rounded-lg hover:opacity-90 transition"
            >
              Logout
            </button>

          </div>
        </div>
      </div>
    </>
  );
}

export default SidebarProfile;