function ItemCard({ item }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition duration-200">

      {/* IMAGE */}
      <div className="relative">
        <img
          src={item.image_url || "https://via.placeholder.com/300"}
          alt={item.title}
          className="w-full h-44 object-cover"
        />

        {/* BADGE */}
        <span
          className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full text-white ${
            item.type === "lost" ? "bg-red-500" : "bg-green-600"
          }`}
        >
          {item.type?.toUpperCase()}
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
          {item.title}
        </h2>

        {/* LOCATION */}
        <p className="text-sm text-gray-500 mt-1">
          📍 {item.location}
        </p>

        {/* TIME */}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(item.date_reported).toLocaleString()}
        </p>

      </div>
    </div>
  );
}

export default ItemCard;