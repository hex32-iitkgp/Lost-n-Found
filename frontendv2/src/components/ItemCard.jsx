import noimg from "../assets/noimg.png";
import { MapPin } from "lucide-react";

function ItemCard({ item, probability, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:scale-[1.02] transition duration-200 cursor-pointer"
    >
      {/* IMAGE */}
      <div className="relative">
        <img
          src={item.image_url || noimg}
          alt={item.title}
          className="w-full h-44 object-cover"
        />

        {/* BADGE */}
        <span
          className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full text-white shadow-md
    ${item.status === "resolved"
              ? "bg-blue-600"
              : item.type === "lost"
                ? "bg-yellow-500"
              : item.claims && item.claims.length > 0
                ? "bg-green-600"
                : "bg-red-500"
            }`}
        >
          {
                  item.status === "resolved"
                    ? (item.type === "found" ? "Found -> APPROVED" : "Lost -> Found")
                    : item.type === "lost"
                      ? "LOST"
                      : item.claims && item.claims.length > 0
                        ? "found:CLAIMED"
                        : "found:UNCLAIMED"
                }
        </span>
      </div>

      {/* CONTENT */}
      <div className="p-4">

        {/* CATEGORY */}
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          {item.category || "General"}
        </p>

        {/* TITLE */}
        <h2 className="font-semibold text-md mt-1">
          {item.title}<span className="text-gray-400 text-sm">.{item.category}</span>
        </h2>

        {/* LOCATION */}
        <p className="text-sm text-gray-500 mt-1">
          <MapPin className="inline-block mr-1" />
          {item.location}
        </p>

        {/* TIME */}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(item.date_reported).toLocaleString()}
        </p>
        <p className="bg-radial-to-t from-reportStart to-reportEnd text-sm text-white w-max px-2 py-1 rounded-full mt-2"
            hidden={!probability}>
          {probability ? `Similarity: ${Math.round(probability * 100)}%` : "No Similarity Data"}
        </p>
      </div>
    </div>
  );
}

export default ItemCard;