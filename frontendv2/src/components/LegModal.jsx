import { useEffect, useRef } from "react";

function LegendModal({ isOpen, setIsOpen }) {
  const ref = useRef();

  // close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-6 bg-black/50 backdrop-blur-sm">
      
      {/* MODAL */}
      <div
        ref={ref}
        className="mt-20 w-96 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-5 text-white animate-slideUp"
      >
        <h2 className="text-lg font-semibold mb-4">Legend</h2>

        <div className="space-y-3 text-sm">

          {/* LOST */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-yellow-500 text-xs font-semibold">
              LOST
            </span>
            <span>Item reported as lost</span>
          </div>

          {/* FOUND */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-green-600 text-xs font-semibold">
              found:CLAIMED
            </span>
            <span>Item reported as found and claimed by someone</span>
          </div>

          {/* CLAIMED */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-blue-500 text-xs font-semibold">
              Lost -{">"} Found
            </span>
            <span>The lost item has been found</span>
          </div>

          {/* UNCLAIMED */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-red-500 text-xs font-semibold">
              found:UNCLAIMED
            </span>
            <span>No claims yet</span>
          </div>

          {/* APPROVED */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-blue-500 text-xs font-semibold">
              Found -{">"} APPROVED
            </span>
            <span>Claim approved</span>
          </div>

        </div>

        {/* CLOSE BUTTON */}
        <button
          onClick={() => setIsOpen(false)}
          className="mt-5 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default LegendModal;