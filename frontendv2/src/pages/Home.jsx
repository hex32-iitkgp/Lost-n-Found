// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { getItems } from "../services/items";

function Home() {
  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    const res = await getItems({ type: "lost" });
    setItems(res.data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div>
      {items.map((item) => (
        <div key={item._id}>{item.title}</div>
      ))}
    </div>
  );
}

export default Home;