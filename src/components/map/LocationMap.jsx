import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";

// ✅ Fix default Leaflet icons (disable built-ins)
delete L.Icon.Default.prototype._getIconUrl;

// 🧭 Modern Custom Markers
const customIcons = {
  selected: L.divIcon({
    className: "custom-marker-selected",
    html: `
      <div style="
        background: red;
        width: 28px; height: 28px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 10px rgba(255,0,0,0.6);
        border: 2px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7z"/>
        </svg>
      </div>
    `,
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  }),

  product: L.divIcon({
    className: "custom-marker-product",
    html: `
      <div style="
        background: green;
        width: 24px; height: 24px;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 8px rgba(59,130,246,0.7);
        border: 2px solid white;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="14" height="14">
          <path d="M12 2L2 7h20L12 2zm0 4.3l6.6 3.7H5.4L12 6.3zM2 9v11h20V9H2zm2 2h16v7H4v-7z"/>
        </svg>
      </div>
    `,
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  }),
};

const LocationMap = ({ latitude, longitude, onSelect, products = [] }) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersLayer = useRef(null);
  const circleRef = useRef(null); // 🔵 Circle reference
  const initialized = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
const navigate = useNavigate();

const name = localStorage.getItem("name");

const showSignInMessage = () => {
  alert("Sign in required — redirecting...");
 navigate("/buyer/signin")
};


const handleViewDetails = (productId) => {
    if (!name) return showSignInMessage();
    navigate(`/product/${productId}`);
  };


  // 🗺️ Initialize map once
  useEffect(() => {
    if (!initialized.current && mapContainerRef.current) {
      initialized.current = true;
      mapRef.current = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      // 🌍 Tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      }).addTo(mapRef.current);

      markersLayer.current = L.layerGroup().addTo(mapRef.current);

      // 🖱️ Click to select location
      mapRef.current.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (onSelect) onSelect({ lat, lng });
        mapRef.current.flyTo([lat, lng], 13, { duration: 0.6 });
      });
    }
  }, [onSelect]);

  // 📍 Update markers and circle when location changes
  useEffect(() => {
    if (!mapRef.current || !markersLayer.current) return;

    markersLayer.current.clearLayers();
    if (circleRef.current) {
      mapRef.current.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    const selectedLat = latitude;
    const selectedLng = longitude;

    if (selectedLat && selectedLng) {
      // ✅ Add main marker
      L.marker([selectedLat, selectedLng], { icon: customIcons.selected })
        .addTo(markersLayer.current)
        .bindPopup("<b>📍 Selected Location</b>");

      // 🔵 Add 10 km circle
      circleRef.current = L.circle([selectedLat, selectedLng], {
  radius: 20000, // 20 km
  color: "rgba(16, 185, 129, 0.6)",        // 🌿 border: emerald-500 tone
  fillColor: "rgba(6, 95, 70, 0.25)",      // 🌱 deep dark green with subtle transparency
  fillOpacity: 1,                        // slightly more visible fill
  weight: 2,
}).addTo(mapRef.current);


      // Smooth focus
      mapRef.current.flyTo([selectedLat, selectedLng], 12, { duration: 0.8 });
    }

    // 🟩 Add product markers
    products?.forEach((p) => {
  if (p.latitude && p.longitude) {

    const marker = L.marker([p.latitude, p.longitude], { icon: customIcons.product })
      .addTo(markersLayer.current)
      .bindPopup(`
        <div id="popup-${p.productId}">
          <img
            src="${p.imageUrls?.length ? p.imageUrls[0] : 'https://via.placeholder.com/300x200?text=No+Image'}"
            style="width: 100%; border-radius: 8px;"
          />
          <b style="cursor:pointer; color:#10b981;">${p.name}</b>
        </div>
      `);

    marker.on("popupopen", () => {
      const elem = document.querySelector(`#popup-${p.productId} b`);
      if (elem) {
        elem.addEventListener("click", () => {
          handleViewDetails(p.productId);
        });
      }
    });

  }
});

  }, [products, latitude, longitude]);
  
  

  // 🔍 Search location by address
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();
      if (data?.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        mapRef.current.flyTo([latNum, lonNum], 14, { duration: 0.8 });
        if (onSelect) onSelect({ lat: latNum, lng: lonNum, address: display_name });
      } else alert("No results found.");
    } catch (err) {
      console.error(err);
      alert("Search failed.");
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div className="relative w-full">
      {/* 🔍 Search Bar */}
      <div
        className="absolute z-[1000] top-3 left-1/2 -translate-x-1/2 flex 
        bg-gray-800/80 backdrop-blur-md rounded-lg overflow-hidden 
        shadow-md border border-gray-700 w-[90%] md:w-[70%]"
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search address or city..."
          className="flex-1 bg-transparent text-gray-100 px-4 py-2 outline-none placeholder-gray-400 w-1"
        />
        <button
          onClick={handleSearch}
          disabled={loadingSearch}
          className="px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-medium transition-all w-10"
        >
          {loadingSearch ? "..." : "🔍︎"}
        </button>
      </div>

      {/* 🗺️ Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-700 shadow-md mt-3"
      />
    </div>
  );
};

export default LocationMap;
