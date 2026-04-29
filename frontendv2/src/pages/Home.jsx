import Header from "../components/Header";
import ItemCard from "../components/ItemCard";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { getItems, getMyItems } from "../services/items";

const categories = [
  "All", "ID Cards", "Wallets", "Keys", "Electronics",
  "Mobile Phones", "Laptops", "Chargers", "Earphones",
  "Bags", "Garments", "Shoes", "Books", "Stationery",
  "Bicycle", "Umbrella"
];

function Home() {
  const [activeTab, setActiveTab] = useState("found"); // found | lost | my
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [locationText, setLocationText] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;
  const isLoggedIn = !!localStorage.getItem("token");
  const tabs = ["found", "lost", "my"];

  const fetchItems = async () => {
    try {
      setLoading(true);

      const res = await getItems({
        type: activeTab === "my" ? undefined : activeTab,
        category: activeCategory,
        search: searchText,
        location: locationText,
        limit,
        skip: page * limit,
      });

      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab, activeCategory]);

  return (
    <div className="bg-gray-100 min-h-screen pb-40">

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
            🔍
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
            const isDisabled = tab === "my" && !isLoggedIn;

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
        <span className="ml-4 px-4 py-2 bg-green-100 text-green-700 text-sm rounded-full">
          {items.length} results
        </span>

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
              <ItemCard key={item._id} item={item} />
            ))
          )}

        </div>

      </div>

      {/* FLOAT BUTTON */}
      <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-found text-white text-2xl shadow-lg hover:scale-105 transition">
        +
      </button>

    </div>
  );
}

export default Home;