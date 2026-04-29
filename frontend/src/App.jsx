import Header from "./components/Header";
import { AuthContext } from "./context/AuthContext";
import { useState } from "react";

function App() {
  // 🔥 Fake user for testing (temporary)
  const [user] = useState({
    name: "John Doe",
    place: "Campus Hostel",
    profile_pic: "https://via.placeholder.com/100",
  });

  return (
    <AuthContext.Provider value={{ user }}>
      <div className="min-h-screen bg-gray-100">
        
        {/* HEADER */}
        <Header theme="found" />

        {/* MAIN CONTENT (dummy for now) */}
        <main className="p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Test Content Area
          </h2>

          <p>
            Click on the profile on top right → sidebar should open with blur.
          </p>
        </main>

      </div>
    </AuthContext.Provider>
  );
}

export default App;