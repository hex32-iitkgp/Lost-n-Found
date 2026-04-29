import { useState, useRef, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import noimg from "../assets/ppo.png";

function SidebarProfile({ isOpen, setIsOpen }) {
  const { user, setUser } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    location: user?.location || "",
    image: null,
    preview: user?.profile_image || null,
  });

  // 🔄 text input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

      setUser((prev) => ({
        ...prev,
        name: form.name,
        email: form.email,
        location: form.location,
        profile_image: form.preview,
      }));

      setIsEditing(false);
    } catch {
      alert("Failed to save");
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

            {/* EDIT / SAVE */}
            <div className="flex justify-end">
              <button
                onClick={() =>
                  isEditing ? handleSave() : setIsEditing(true)
                }
                disabled={isEditing && !isFormValid()}
                className={`px-4 py-2 text-white rounded-lg transition
    ${isEditing && !isFormValid()
                    ? "bg-gray-400 cursor-not-allowed flex justify-center"
                    : "bg-blue-600 hover:opacity-90 flex justify-center"
                  }
  `}
              >
                {isEditing ? "Save" : "Edit"}
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