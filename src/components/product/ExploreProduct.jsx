import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import LocationButton from "./LocationButton";
import MessageToast from "../common/MessageToast";
import api from "../../api/api";

// 💤 Lazy import only for heavy main component (Map)
const delayedImport = (factory, delay = 400) =>
  new Promise((resolve) => setTimeout(() => resolve(factory()), delay));

const LocationMap = lazy(() =>
  delayedImport(() => import("../map/LocationMap"), 500)
);

// 💤 Lazy import for image with delay for smooth fade
const LazyImage = lazy(() =>
  delayedImport(() => import("../farmer/LazyImage"), 200)
);

// 🦴 Skeleton Components
const Skeleton = ({ className = "" }) => (
  <div className={`bg-gray-800/50 rounded-lg animate-pulse ${className}`}></div>
);

const SidebarSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-5 w-32" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-5 w-40 mt-4" />
    <Skeleton className="h-9 w-full mt-1" />
    <Skeleton className="h-64 w-full mt-6 rounded-xl" />
  </div>
);

const ProductCardSkeleton = () => (
  <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4 backdrop-blur-md animate-pulse">
    <Skeleton className="h-44 w-full mb-3 rounded-xl" />
    <Skeleton className="h-5 w-2/3 mb-2" />
    <Skeleton className="h-4 w-1/3 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-2" />
    <Skeleton className="h-6 w-1/4 mt-3" />
  </div>
);

const ExploreProduct = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceOrder, setPriceOrder] = useState("All");
  const [nameSearch, setNameSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", status: "info" });

  const [sidebarLoading, setSidebarLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);

  const navigate = useNavigate();
  const name = localStorage.getItem("name");
  
  const showToast = (message, status = "info") => setToast({ show: true, message, status });
  const hideToast = () => setToast({ ...toast, show: false });

  const getAdjustedProducts = (data) => {
    const seen = new Map();
    return data.map((p) => {
      const key = `${p.latitude?.toFixed(6)},${p.longitude?.toFixed(6)}`;
      if (!seen.has(key)) seen.set(key, []);
      const duplicates = seen.get(key);
      const count = duplicates.length;
      duplicates.push(p);
      if (count === 0) return p;

      const R = 6378137;
      const radius = 10;
      const angle = (count * 2 * Math.PI) / 10;
      const dx = (radius * Math.cos(angle)) / R;
      const dy = (radius * Math.sin(angle)) / R;

      const newLat = p.latitude + (dy * 180) / Math.PI;
      const newLng = p.longitude + (dx * 180) / Math.PI / Math.cos((p.latitude * Math.PI) / 180);
      return { ...p, latitude: newLat, longitude: newLng };
    });
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000;
  };

  const RADIUS_KM = 20;
  const getActiveLocation = () => selectedLocation || currentLocation;

  const filterProducts = (category, priceOrder, nameSearch, data, location) => {
    let filtered = data;
    const radiusInMeters = RADIUS_KM * 1000;

    if (category !== "All") filtered = filtered.filter((p) => p.category === category);
    if (nameSearch) {
      const q = nameSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
      );
    }
    if (location) {
      filtered = filtered.filter((p) => {
        const distance = getDistance(location.lat, location.lng, p.latitude, p.longitude);
        return distance <= radiusInMeters;
      });
    }
    if (priceOrder === "LowToHigh") filtered.sort((a, b) => a.price - b.price);
    else if (priceOrder === "HighToLow") filtered.sort((a, b) => b.price - a.price);

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    setSidebarLoading(true);
    setProductLoading(true);

    api
      .get("/api/v1/products")
      .then((res) => {
        setProducts(res.data);
        filterProducts(selectedCategory, priceOrder, nameSearch, res.data, getActiveLocation());
      })
      .catch(() => showToast("Failed to load products. Please try again.", "error"))
      .finally(() => {
        setSidebarLoading(false);
        setProductLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!products.length) return;
    setProductLoading(true);
    filterProducts(selectedCategory, priceOrder, nameSearch, products, getActiveLocation());
    setProductLoading(false);
  }, [selectedCategory, priceOrder, currentLocation, selectedLocation]);

  const handleUseCurrentLocation = () => {
    if (!currentLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setSelectedLocation(null);
          setCurrentLocation(coords);
          filterProducts(selectedCategory, priceOrder, nameSearch, products, coords);
        },
        (err) => {
          console.error(err);
          showToast("Location permission denied or unavailable.", "warning");
        }
      );
    } else {
      setCurrentLocation(null);
      filterProducts(selectedCategory, priceOrder, nameSearch, products, getActiveLocation());
    }
  };

  const showSignInMessage = () => {
    showToast("Sign in required — redirecting...", "warning");
    navigate("/buyer/signin");
  };

  const addProductToCart = (productid) => {
    if (!name) return showSignInMessage();

    api
      .post(`/api/v1/wishlist/add?productId=${productid}`)
      .then((res) => {
        navigate("/buyer/wishlist");
      })
      .catch((err) => {
        if (err.response?.status === 401) navigate("/login");
        else showToast(err.response?.data?.message || "Error adding to cart", "error");
      });
  };

  const handleViewDetails = (productId) => {
    if (!name) return showSignInMessage();
    navigate(`/product/${productId}`);
  };

  return (
    <div className="relative bg-gradient-to-b from-[#070707] via-[#0e0e0f] to-[#141416] text-gray-200 pt-24 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
        {/* 🧩 Sidebar */}
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 w-full lg:w-2/4 bg-gray-900/40 border border-gray-800/60 backdrop-blur-md rounded-2xl p-4 sm:p-6
                     shadow-[0_0_25px_rgba(255,255,255,0.04)] overflow-y-auto custom-scrollbar
                     max-h-[50vh] lg:max-h-full"
        >
          {sidebarLoading ? (
            <SidebarSkeleton />
          ) : (
            <>
              <div className="flex flex-col sm:flex-row flex-wrap items-end gap-4 mb-4">
                <div className="flex-grow w-full sm:w-auto">
                  <label className="block text-gray-400 text-sm mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-gray-800/60 border border-gray-700/60 text-gray-200 rounded-lg p-2 w-full text-sm focus:ring-2 focus:ring-green-500/40"
                  >
                    <option value="All">All</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="dairyProducts">Dairy Products</option>
                    <option value="dryFruits">Dry Fruits</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                  <LocationButton onClick={handleUseCurrentLocation} active={!!currentLocation} />
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      setCurrentLocation(null);
                      filterProducts(selectedCategory, priceOrder, nameSearch, products, null);
                    }}
                    className="bg-gray-800/60 hover:bg-gray-700/70 text-gray-200 px-3 py-2 rounded-md border border-gray-700/60 transition text-sm font-medium"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="border border-gray-800/60 rounded-xl overflow-hidden shadow-inner bg-gray-900/30 h-64 sm:h-80 lg:h-[26rem]">
                <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
                  <LocationMap
                    latitude={getActiveLocation()?.lat}
                    longitude={getActiveLocation()?.lng}
                    onSelect={(coords) => {
                      setCurrentLocation(null);
                      setSelectedLocation(coords);
                    }}
                    objectName="Nearby Products"
                    products={getAdjustedProducts(filteredProducts)}
                  />
                </Suspense>
              </div>
            </>
          )}
        </motion.aside>

        {/* 🛍️ Product Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full lg:w-3/4 h-full overflow-y-auto custom-scrollbar"
        >
          {/* 🔍 Search */}
          <div className="bg-transparent flex flex-col sm:flex-row items-center justify-end mb-4 sticky top-0 z-10 py-2 gap-2">
            <div className="flex items-center gap-2 bg-gray-900/85 border border-gray-800/60 rounded-xl p-2 w-full sm:w-[60%] md:w-[45%]">
              <input
                type="text"
                placeholder="Search by name, category or address..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="bg-transparent flex-grow outline-none text-gray-200 placeholder-gray-500 text-sm"
              />
              <button
                onClick={() =>
                  filterProducts(selectedCategory, priceOrder, nameSearch, products, getActiveLocation())
                }
                className="bg-green-700/60 hover:bg-green-600/70 text-white px-3 py-1 rounded-md text-sm transition"
              >
                Search
              </button>
            </div>
          </div>

          {/* 🧺 Product List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {productLoading
              ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : filteredProducts.length === 0
              ? (
                <div className="col-span-full flex justify-center mt-16">
                  <div className="bg-gray-900/40 border border-gray-800/60 px-6 py-4 rounded-2xl backdrop-blur-md">
                    <h1 className="text-gray-300 text-lg font-medium">No products found</h1>
                  </div>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <motion.div
                    key={product.productId}
                    className="w-full bg-gray-950/40 border border-gray-950/40 rounded-2xl p-4
                               backdrop-blur-md hover:bg-green-800/40 transition-all"
                  >
                    <Suspense fallback={<Skeleton className="w-full h-44 mb-3 rounded-xl" />}>
                      <LazyImage
                        src={
                          product.imageUrls?.length
                            ? product.imageUrls[0]
                            : "https://via.placeholder.com/300x200?text=No+Image"
                        }
                        alt={product.name}
                      />
                    </Suspense>

                    <h2 className="text-lg font-semibold text-gray-100 mb-1 tracking-tight">
                      {product.name}
                    </h2>
                    <p className="text-gray-400 text-xs mb-1">{product.category}</p>
                    <p className="text-gray-500 text-xs mb-1">
                      {product.address?.length > 28
                        ? `${product.address.substring(0, 28)}...`
                        : product.address}
                    </p>
                    <p
                      className={`text-sm font-medium mt-2 ${
                        product.available ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {product.available ? `Available: ${product.quantity}` : "Out of Stock"}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-between mt-4 gap-2 sm:gap-0">
                      <button
                        onClick={() => addProductToCart(product.productId)}
                        disabled={!product.available}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          product.available
                            ? "bg-green-700/60 hover:bg-green-600/70 text-white"
                            : "bg-gray-800 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Add to Wishlist
                      </button>
                      <button
                        onClick={() => handleViewDetails(product.productId)}
                        className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-700 hover:border-green-700 text-gray-300 hover:text-green-400 transition-all"
                      >
                        View
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
          </div>
        </motion.section>
      </div>

      <MessageToast show={toast.show} onClose={hideToast} message={toast.message} status={toast.status} />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {}
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(18, 18, 18, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(34, 197, 94, 0.35), rgba(34, 197, 94, 0.25));
          border-radius: 9999px;
          border: 1px solid rgba(12, 12, 12, 0.6);
          transition: all 0.25s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(34, 197, 94, 0.6), rgba(34, 197, 94, 0.45));
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 197, 94, 0.4) rgba(18, 18, 18, 0.4);
        }
      `}</style>
    </div>
  );
};

export default ExploreProduct;
