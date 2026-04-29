import Header from "../components/Header";
import ItemCard from "../components/ItemCard";
import { Plus, Search, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import hero from "../assets/navbar.svg";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import noimg from "../assets/noimg.png";
import { getItems, getMyItems, claimItem, createItem, deleteItem, approveClaim, rejectClaim } from "../services/items";

const categories = [
  "All", "ID Cards", "Wallets", "Keys", "Electronics",
  "Mobile Phones", "Laptops", "Chargers", "Earphones",
  "Bags", "Garments", "Shoes", "Books", "Stationery",
  "Bicycle", "Umbrella"
];

function Home() {
  const [activeTab, setActiveTab] = useState("found"); // found | lost | my
  const [activeCategory, setActiveCategory] = useState("All");
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [locationText, setLocationText] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;
  const isLoggedIn = !!localStorage.getItem("token");
  const tabs = ["found", "lost", "my"];
  const isLastPage = items.length < (limit); // if we received less than limit items, it's the last page
  const [selectedItem, setSelectedItem] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showClaimsModal, setShowClaimsModal] = useState(false);
  const [processingClaim, setProcessingClaim] = useState(null);

  const isOwner = (
    selectedItem &&
    user &&
    (String(selectedItem.owner_id) === String(user._id))
  );


  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    type: "lost",
    image: null,
  });

  const handleEdit = () => {
    window.alert("To edit this item, please delete and re-create it with the correct information. This is a temporary limitation. We apologize for the inconvenience and are working on adding edit functionality soon!");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const hasClaimed =
    selectedItem?.claims?.some(
      (c) => String(c.user_id) === String(user?._id)
    );

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setSelectedItem(null);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      let res;
      if (activeTab === "my") {
        res = await getMyItems({
          category: activeCategory,
          search: searchText,
          location: locationText,
          limit,
          skip: page * limit,
        });
      } else {
        res = await getItems({
          type: activeTab,
          category: activeCategory,
          search: searchText,
          location: locationText,
          limit,
          skip: page * limit,
        });
      }

      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (claiming) return;

    try {
      setClaiming(true);

      await claimItem(selectedItem._id, {
        message: "This belongs to me",
      });
      setSelectedItem(prev => ({
        ...prev,
        claims: [...(prev.claims || []), {
          user_id: user._id,
          message: user.email,
          status: "pending",
        }]
      }));
      alert("Claim sent");

    } catch {
      alert("Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setCreating(true);

      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      await createItem(formData);

      alert("Item submitted!");

      setShowCreateModal(false);
      setForm({
        title: "",
        description: "",
        category: "",
        location: "",
        type: "lost",
        image: null,
      });

      fetchItems(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Failed to submit item");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this item?")) return;

    try {
      await deleteItem(selectedItem._id);
      alert("Deleted successfully");
      setSelectedItem(null);
      fetchItems();
    } catch {
      alert("Delete failed");
    }
  };

  const handleApprove = async (email) => {
    try {
      setProcessingClaim(email);
      await approveClaim(selectedItem._id, email);

      // optimistic update
      setSelectedItem((prev) => ({
        ...prev,
        status: "resolved",
        claims: prev.claims.map((c) =>
          c.message === email
            ? { ...c, status: "approved" }
            : { ...c, status: "rejected" }
        ),
      }));
    } catch {
      alert("Error approving claim");
    } finally {
      setProcessingClaim(null);
    }
  };

  const handleReject = async (email) => {
    try {
      setProcessingClaim(email);
      await rejectClaim(selectedItem._id, email);

      setSelectedItem((prev) => ({
        ...prev,
        claims: prev.claims.map((c) =>
          c.message === email ? { ...c, status: "rejected" } : c
        ),
      }));
    } catch {
      alert("Error rejecting claim");
    } finally {
      setProcessingClaim(null);
    }
  };


  useEffect(() => {
    setPage(0);
  }, [activeTab, activeCategory]);

  useEffect(() => {
    fetchItems();
  }, [activeTab, activeCategory, page]);

  return (
    <div className="bg-gray-100 min-h-screen pb-20">

      {/* HEADER */}
      <Header theme={activeTab === "my" ? "reports" : activeTab} />

      {/* HERO */}
      <div
        className={`px-10 py-16 flex justify-between items-center text-white transition-colors duration-300
    ${activeTab === "found"
            ? "bg-found"
            : activeTab === "lost"
              ? "bg-lost"
              : "bg-gradient-to-r from-reportsStart to-reportsEnd"
          }`}
      >

        <div>
          <p className="text-sm tracking-widest text-yellow-400 mb-4">
            COMMUNITY BOARD
          </p>

          <h1 className="text-5xl font-serifCustom font-bold leading-tight">
            Find what's yours.
            <br />
            Return what's theirs.
          </h1>

          <p className="mt-4 text-white/70">
            Browse lost & found items reported across campus.
          </p>
        </div>

        <div className="hidden md:block">
          <div className="w-64 h-64 bg-white/10 rounded-xl flex items-center justify-center">
            <img src={hero} alt="Hero" className="w-48 h-48 object-contain" />
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}

      <div className="flex justify-center mt-6">

        <div className="relative flex bg-gray-200 rounded-full p-1 w-[420px]">

          {/* SLIDING INDICATOR */}
          <div
            className={`absolute top-1 left-1 h-[calc(100%-8px)] w-1/3 rounded-full transition-all duration-300
      ${activeTab === "found"
                ? "translate-x-0 bg-found"
                : activeTab === "lost"
                  ? "translate-x-full bg-gray-800"
                  : "translate-x-[200%] bg-gradient-to-r from-reportsStart to-reportsEnd"
              }`}
          />

          {/* BUTTONS */}
          {tabs.map((tab) => {
            const isDisabled = (tab === "my" && !isLoggedIn);

            return (
              <button
                key={tab}
                onClick={() => !isDisabled && setActiveTab(tab)}
                disabled={isDisabled}
                className={`flex-1 py-2 text-sm font-medium z-10 transition
            ${activeTab === tab ? "text-white" : "text-gray-700"}
            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
              >
                {tab === "found"
                  ? "Found"
                  : tab === "lost"
                    ? "Lost"
                    : "My Reports"}
              </button>
            );
          })}
        </div>

        {/* RESULT COUNT */}
        <span className={`ml-4 px-4 py-2 text-sm rounded-full
                ${activeTab === "found"
            ? "bg-green-100 text-green-700"
            : activeTab === "lost"
              ? "bg-red-100 text-red-700"
              : "bg-gradient-to-br from-reportsStart to-reportsEnd text-white"
          }`}>
          {items.length} results
        </span>

      </div>
      <div className="px-10 mt-4 flex justify-center">
        <div className="bg-white rounded-full shadow-md flex items-center px-4 py-2 gap-2 max-w-4xl w-full">

          {/* DESCRIPTION SEARCH */}
          <input
            type="text"
            placeholder="Search items..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 px-3 py-2 outline-none "
          />

          {/* "IN" TEXT */}
          <span className="text-gray-400 text-xl font-bold">{"<"}in{" >"}</span>

          {/* LOCATION SEARCH */}
          <input
            type="text"
            placeholder="Location..."
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            className="flex-1 px-3 py-2 outline-none text-sm"
          />

          {/* SEARCH BUTTON */}
          <button
            onClick={() => { setPage(0); fetchItems(); }}
            className="bg-found text-white p-2 scale-125 rounded-full hover:scale-100 transition"
          >
            <Search size={20} />
          </button>

        </div>
      </div>
      {/* CATEGORY CHIPS */}
      <div className="px-10 mt-6 flex flex-wrap gap-3">

        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm transition
              ${activeCategory === cat
                ? "bg-gray-800 text-white"
                : "bg-white shadow text-gray-600"
              }`}
          >
            {cat}
          </button>
        ))}

      </div>

      {/* ITEMS */}
      <div className="px-10 mt-8">

        {/* <h2 className="text-xl font-semibold mb-4">Items</h2> */}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">

          {loading ? (
            <p>Loading...</p>
          ) : items.length === 0 ? (
            <p>No items found</p>
          ) : (
            items.map((item) => (
              <ItemCard key={item._id} item={item} onClick={() => setSelectedItem(item)} />
            ))
          )}

        </div>
        <div className="flex justify-center items-center gap-4 mt-8">

          {/* PREVIOUS */}
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            className="px-4 py-2 rounded-full bg-gray-300 transition duration-200 hover:bg-gray-400 disabled:opacity-50 disabled:hover:bg-gray-300 disabled:hover:cursor-not-allowed"
          >
            <ArrowLeft size={20} />
          </button>

          {/* PAGE NUMBER */}
          <span className="text-sm text-gray-600">
            Page {page + 1}
          </span>

          {/* NEXT */}
          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={isLastPage || loading}
            className={`transition-colors duration-300
                ${activeTab === "found"
                ? "bg-foundheader"
                : activeTab === "lost"
                  ? "bg-lostheader"
                  : "bg-gradient-to-br from-reportsStart to-reportsEnd"
              }
             px-4 py-2 rounded-full hover:opacity-80 transition duration-200 disabled:opacity-60 disabled:hover:cursor-not-allowed`}

          >
            <ArrowRight size={20} style={{ color: 'white' }} />
          </button>

        </div>
      </div>

      {/* FLOAT BUTTON */}
      <button onClick={() => setShowCreateModal(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-found text-white shadow-lg hover:scale-105 transition">
        <Plus size={28} className=" translate-y-0 translate-x-3.5" />
      </button>
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setSelectedItem(null)} // 👈 click outside closes
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
            <div className="relative">
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
                    ? "APPROVED"
                    : selectedItem.claims && selectedItem.claims.length > 0
                      ? "CLAIMED"
                      : "UNCLAIMED"
                }
              </span>
            </div>
            <button
              onClick={() => setSelectedItem(null)}
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
              <h2 className="text-xl font-semibold">
                {selectedItem.title}
              </h2>

              <p className="text-gray-500 mt-2">
                📍 {selectedItem.location}
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
            <div className="mt-6 flex gap-3">
              {/* OWNER BUTTONS */}
              {isOwner && (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex-1 py-2 rounded-lg bg-yellow-500 text-white hover:opacity-90 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2 rounded-lg bg-red-600 text-white hover:opacity-90 transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowClaimsModal(true)}
                    className="flex-1 py-2 rounded-lg bg-blue-600 text-white hover:opacity-90 transition"
                  >
                    Show Claims
                  </button>
                </>
              )}

              {/* NON-OWNER BUTTON */}
              {!isOwner && selectedItem.type === "found" && selectedItem.status !== "resolved" && (
                <button
                  onClick={handleClaim}
                  disabled={claiming || hasClaimed}
                  className="w-full py-3 rounded-lg text-white font-medium
             bg-found hover:opacity-90 transition
             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hasClaimed ?
                    "Claim Requested"
                    : claiming
                      ? "Claiming..."
                      : "Claim Item"}
                </button>
              )}

            </div>
          </div>
        </div>
      )}
      {showClaimsModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={() => setShowClaimsModal(false)}
        >
          {/* BACKDROP */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* MODAL */}
          <div
            className="relative bg-white rounded-xl w-[90%] max-w-lg p-6 shadow-xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              onClick={() => setShowClaimsModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">
              Claims ({selectedItem?.claims?.length || 0})
            </h2>

            {(!selectedItem?.claims || selectedItem.claims.length === 0) ? (
              <p className="text-sm text-gray-500">No claims yet</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedItem.claims.map((claim, idx) => {
                  const isPending = claim.status === "pending";
                  const isProcessing = processingClaim === claim.message;
                  const hasApprovedClaim = selectedItem?.claims?.some(
                    (c) => c.status === "approved"
                  );
                  return (
                    <div
                      key={idx}
                      className="p-3 border rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {claim.message} {/* email */}
                        </p>

                        <p
                          className={`text-xs mt-1 ${claim.status === "approved"
                            ? "text-green-600"
                            : claim.status === "rejected"
                              ? "text-red-500"
                              : "text-gray-500"
                            }`}
                        >
                          {claim.status}
                        </p>
                      </div>

                      {/* ACTIONS */}
                      {isPending && !hasApprovedClaim && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(claim.message)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
                          >
                            {isProcessing ? "..." : "Accept"}
                          </button>

                          <button
                            onClick={() => handleReject(claim.message)}
                            disabled={isProcessing}
                            className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowCreateModal(false)}
        >
          {/* BACKDROP */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* MODAL */}
          <div
            className="relative bg-white rounded-xl w-[90%] max-w-lg p-6 shadow-xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4">
              Submit Lost / Found Report
            </h2>

            <div className="space-y-3">

              <input
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />

              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />

              <input
                name="location"
                placeholder="Location"
                value={form.location}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />

              {/* CATEGORY */}
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              >
                {categories
                  .filter((c) => c !== "All")
                  .map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
              </select>
              {/* TYPE */}
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>

              {/* IMAGE */}
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full"
              />

              {/* SUBMIT */}
              <button
                onClick={handleSubmit}
                disabled={creating}
                className="w-full bg-found text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {creating ? "Submitting..." : "Submit Report"}
              </button>

            </div>
          </div>
        </div>
      )
      }
    </div >
  );
}

export default Home;