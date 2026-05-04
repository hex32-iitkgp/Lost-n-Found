import { useState, useRef, useContext, useEffect, use } from "react";
import { AuthContext } from "../context/AuthContext";
import { show_claimed, getManyItems, removeClaim } from "../services/items";
import noimg from "../assets/ppo.png";
import { updateUser } from "../services/auth";
import { MapPin } from "lucide-react";

function SidebarProfile({ isOpen, setIsOpen, about }) {
  const { user, fetchUser, setUser } = useContext(AuthContext);
  const [saving, setSaving] = useState(false);
  const [showClaimed, setShowClaimed] = useState(false);
  const [claimedData, setClaimedData] = useState([]);
  const [claimedItems, setClaimedItems] = useState([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageToShow, setImageToShow] = useState(null);

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

  useEffect(() => {
    const fetchClaimedItems = async () => {
      const response = await show_claimed();
      // setClaimedData(response.data.claims);
      response.data.claims.forEach(async (claim) => {
        console.log("Fetching item for claim:", claim.item_id);
        const itemResponse = await getManyItems(claim.item_id);
        console.log("Fetched item data:", itemResponse.data);
        setClaimedItems((prev) => [...prev, itemResponse.data]);
      });
      setShowClaimModal(true);
    };
    try {
      if (showClaimed) {
        fetchClaimedItems();
      }
    } catch (error) {
      console.error("Error fetching claimed items:", error);
    }
    finally {
      console.log("Final claimed items state:", claimedItems);
    }
  }, [showClaimed]);

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

  const openModal = (item) => {
    setSelectedItem(item);
  }

  const closeModal = () => {
    setSelectedItem(null);
  }

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

  const handleDeleteClaim = async (itemId) => {
    try {
      await removeClaim(itemId);
      setClaimedItems((prev) => prev.filter((item) => item._id !== itemId));
      await fetchUser(); // Refresh user data to update claim status
    } catch (error) {
      console.error("Error deleting claim:", error);
    }
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
            disabled={!saving}
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
            <button
              onClick={() => setShowClaimed(true)}
              className={`w-full py-3 text-white bg-green-400 disabled:bg-gray-300 hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50
                          rounded-lg transition`}
              disabled={showClaimed}
              hidden={about}
            >
              {showClaimed ? "Showing..." : "Show Claimed Items"}
            </button>

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
      {showClaimModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => { setShowClaimModal(false); setClaimedItems([]); setShowClaimed(false); window.location.reload(); }}
        >
          {/* BACKDROP */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* MODAL */}
          <div
            className="relative bg-white rounded-xl w-[90%] max-w-lg p-6 shadow-xl animate-slideUp"
            style={{ maxHeight: "80vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              onClick={() => { setShowClaimModal(false); setClaimedItems([]); setShowClaimed(false); window.location.reload(); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">
              Claims ({claimedItems.length || 0})
            </h2>

            {(!claimedItems || claimedItems.length === 0) ? (
              <p className="text-sm text-gray-500">No claims yet</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {claimedItems.map((claim, idx) => {
                  const isClaimAccepted = claim.claims.some(c => c.status === "approved" && c.message === user.email);
                  const isPending = (claim.status === "open");
                  return (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          <a href="#" className="text-black hover:underline" onClick={() => openModal(claim)}>{claim.title}</a>
                        </p>

                        <p
                          className={"text-gray-500"}
                        >
                          {claim.email} - {claim.location}
                        </p>
                      </div>

                      {/* ACTIONS */}

                      <div className="flex gap-2">

                        <button
                          onClick={() => handleDeleteClaim(claim._id)}
                          disabled={!isPending}
                          className={`px-3 py-1 ${isPending ? "bg-red-500" : isClaimAccepted ? "bg-green-500" : "bg-gray-500"} text-white rounded disabled:opacity-50`}
                        >
                          {isPending ? "Remove" : isClaimAccepted ? "Accepted" : "Rejected"}
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => closeModal()} // 👈 click outside closes
        >
          {/* BACKDROP */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* MODAL */}
          <div
            className="relative bg-white rounded-xl w-[90%] max-w-2xl p-6 shadow-xl animate-slideUp"
            onClick={(e) => e.stopPropagation()} // 👈 prevents closing when clicking inside
          >
            {/* CLOSE BUTTON */}


            {/* IMAGE */}
            <div className="relative hover:cursor-pointer"
              onClick={() => { setImageToShow(selectedItem.image_url || noimg); setShowImageModal(true); }}
            >
              <img
                src={selectedItem.image_url || noimg}
                alt={selectedItem.title}
                className="w-full h-60 object-cover rounded-lg"
              />

              {/* BADGE */}
              <span
                className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full text-white shadow-md
    ${selectedItem.status === "resolved"
                    ? "bg-blue-600"

                    : selectedItem.claims && selectedItem.claims.length > 0
                      ? "bg-green-600"
                      : "bg-red-500"
                  }`}
              >
                {
                  selectedItem.status === "resolved"
                    ? (selectedItem.type === "found" ? "APPROVED" : "Lost -> Found")
                    : selectedItem.type === "lost"
                      ? "LOST"
                      : selectedItem.claims && selectedItem.claims.length > 0
                        ? "CLAIMED"
                        : "UNCLAIMED"
                }
              </span>
            </div>
            <button
              onClick={() => closeModal()}
              className="absolute top-4 right-4 
             w-8 h-8 flex items-center justify-center 
             rounded-full 
             bg-black backdrop-blur-md 
             hover:scale-125 text-white
             transition"
            >
              ✕
            </button>
            {/* CONTENT */}
            <div className="mt-4">
              <h2 className="text-2xl font-semibold">
                {selectedItem.title}<span className="ml-2 text-sm font-normal text-gray-500">.{selectedItem.category}</span>
              </h2>

              <p className="text-gray-500 mt-2">
                <MapPin className="inline-block mr-1" />
                {selectedItem.location}
              </p>

              <p className="text-sm mt-2">
                {selectedItem.description || "No description"}
              </p>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Contact:</span>{" "}
              <a
                href={`mailto:${selectedItem.email}`}
                className="text-blue-600 hover:underline"
              >
                {selectedItem.email}
              </a>
            </div>
          </div>
        </div>
      )}
      {showImageModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setShowImageModal(false)}
        >
          {/* BACKDROP */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* MODAL */}
          <div
            className="relative inline bg-white rounded-xl p-6 shadow-xl animate-slideUp"
            style={{ maxWidth: "90vw", maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">Image Preview</h2>

            <img
              src={imageToShow || noimg}
              alt="Preview"
              className="w-full h-auto rounded-lg"
              style={{ maxHeight: "80vh", objectFit: "contain" }}
            />
          </div>
        </div>
      )}

    </>
  );
}

export default SidebarProfile;