import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MapPin, Edit, Image as ImageIcon, Package } from "lucide-react";
import SingleProductMap from "../map/SingleProductMap";
import "leaflet/dist/leaflet.css";
import MessageToast from "../common/MessageToast";
import api from "../../api/api";

const UpdateProductForm = React.lazy(() =>
  import("../product/UpdateProductForm")
);
const ImageSlider = React.lazy(() => import("../common/ImageSlider"));
const ImageEditDialog = React.lazy(() => import("../common/ImageEditDialog"));

const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gray-800/60 rounded-md transition-all duration-300 ease-out ${className}`}
  />
);

const ProductDetailsForFarmer = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("jwtToken");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatedQuantity, setUpdatedQuantity] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    status: "info",
  });

  const showToast = (message, status = "info") => {
    setToast({ show: true, message, status });
  };

  useEffect(() => {
    let isMounted = true;
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/api/v1/products/${productId}`);
        if (isMounted) {
          setProduct(res.data);
          setUpdatedQuantity(res.data.availableQuantity ?? "");
        }
      } catch (err) {
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [productId, token]);

  const handleQuantityUpdate = () => {
    showToast("Inventory update feature is under development.", "info");
  };

  const toggleAvailability = async () => {
    
      showToast("Update Availability feature is under development.", "info");
    
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.06, duration: 0.36 },
    }),
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-[#070707] via-[#0e0e0f] to-[#141416] text-gray-200 relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.02),transparent_35%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10 relative z-0">
        {/* 🟢 UPDATE PRODUCT MODAL */}
        <AnimatePresence>
          {showUpdateModal && product && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900/80 border border-gray-800 shadow-2xl"
              >
                <Suspense fallback={<div className="p-6 text-gray-400">Loading...</div>}>
                  <UpdateProductForm
                    product={product}
                    onUpdate={(u) => {
                      setProduct(u);
                      setShowUpdateModal(false);
                    }}
                    onClose={() => setShowUpdateModal(false)}
                  />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🟣 IMAGE EDIT MODAL */}
        <AnimatePresence>
          {showImageDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gray-900/80 border border-gray-800 shadow-2xl"
              >
                <Suspense fallback={<div className="p-6 text-gray-400">Loading...</div>}>
                  <ImageEditDialog
                    productId={productId}
                    token={token}
                    product={product}
                    onUpdate={(u) => setProduct(u)}
                    onClose={() => setShowImageDialog(false)}
                  />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🌾 MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-6 sm:mt-10">
          {/* LEFT PANEL */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 max-h-[85vh] overflow-y-auto custom-scrollbar p-4 sm:p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 shadow-[0_0_15px_rgba(255,255,255,0.04)] backdrop-blur-md"
          >
            {loading ? (
              <>
                <Skeleton className="h-[260px] sm:h-[360px] w-full mb-6" />
                <Skeleton className="h-6 w-1/3 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </>
            ) : (
              product && (
                <>
                  <div className="relative mb-6">
                    <div className="rounded-xl overflow-hidden">
                      <Suspense fallback={<div className="w-full h-[260px] sm:h-[360px] bg-gray-800 rounded-xl animate-pulse" />}>
                        <ImageSlider images={product.imageUrls || []} />
                      </Suspense>
                    </div>
                    <button
                      onClick={() => setShowImageDialog(true)}
                      className="absolute right-3 sm:right-4 bottom-3 sm:bottom-4 bg-gray-800/70 hover:bg-gray-800 text-gray-100 px-3 sm:px-4 py-2 rounded-md border border-gray-700 flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <ImageIcon size={14} /> Edit Images
                    </button>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-100 flex items-center flex-wrap gap-2">
                        {product.name}
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.available
                              ? "bg-green-700/30 text-green-300"
                              : "bg-red-700/30 text-red-300"
                          }`}
                        >
                          {product.available ? "Available" : "Sold Out"}
                        </span>
                      </h1>
                      <p className="text-sm text-gray-400 mt-1">{product.category}</p>
                      <p className="mt-3 sm:mt-4 text-gray-300 leading-relaxed text-sm sm:text-base">
                        {product.description}
                      </p>
                    </div>

                    {/* 📊 STATS */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-lg">
                        <Package className="text-gray-300 shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400">Available</div>
                          <div className="text-gray-100 font-medium">
                            {product.availableQuantity ?? product.quantity ?? 0} kg
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-lg">
                        <MapPin className="text-gray-300 shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400">Location</div>
                          <div className="text-gray-100 font-medium">
                            {product.address || "Not provided"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ⚙️ CONTROL PANEL */}
                    <div className="mt-6 sm:mt-8 w-full bg-gray-900/50 backdrop-blur-md border border-gray-800/60 rounded-2xl p-4 sm:p-5 shadow-[0_0_15px_rgba(255,255,255,0.04)]">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-3 sm:mb-4 uppercase tracking-wide">
                        Manage Product
                      </h3>

                      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 flex-wrap">
                        <div className="flex-1 min-w-[180px] sm:min-w-[220px]">
                          <label className="block text-xs text-gray-400 mb-2">
                            Inventory (kg)
                          </label>
                          <div className="flex gap-2 sm:gap-3">
                            <input
                              type="number"
                              value={updatedQuantity}
                              onChange={(e) => setUpdatedQuantity(e.target.value)}
                              className="flex-1 bg-gray-800/80 border border-gray-700 rounded-md px-2 sm:px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600"
                            />
                            <button
                              onClick={handleQuantityUpdate}
                              className="px-3 sm:px-4 py-2 rounded-md bg-gray-800 text-gray-100 border border-gray-700 hover:bg-gray-700 transition-all text-sm"
                            >
                              Update
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => setShowUpdateModal(true)}
                          className="px-4 sm:px-6 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-100 border border-gray-700 flex items-center gap-2 justify-center transition-all text-sm"
                        >
                          <Edit size={15} /> Edit Product
                        </button>

                        <button
                          onClick={toggleAvailability}
                          className={`px-4 sm:px-6 py-2.5 rounded-lg border transition-all flex items-center justify-center gap-2 text-sm ${
                            product.available
                              ? "bg-green-800/70 hover:bg-green-700/60 border-green-600/60 text-gray-100"
                              : "bg-red-800/70 hover:bg-red-700/60 border-red-600/60 text-gray-100"
                          }`}
                        >
                          {product.available ? "Set as Sold Out" : "Set as Available"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )
            )}
          </motion.div>

          {/* RIGHT PANEL */}
          <div className="space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="p-4 sm:p-6 h-auto sm:h-[30rem] rounded-2xl bg-gray-900/40 border border-gray-800/60 shadow relative z-10 backdrop-blur-md"
            >
              <h3 className="text-sm font-semibold text-gray-100 mb-3">Product Location</h3>
              {loading ? <Skeleton className="w-full h-64 mb-2" /> : (
  <div className="rounded-lg overflow-visible border border-gray-800 relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
    <div className="w-full h-64 sm:h-72 md:h-80 relative">
      {product?.latitude && product?.longitude ? (
        <SingleProductMap
          key={`${product.latitude}-${product.longitude}`}
          latitude={product.latitude}
          longitude={product.longitude}
          productName={product.name}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          Location data not available
        </div>
      )}
    </div>
  </div>
)}

            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="p-4 sm:p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 shadow backdrop-blur-md"
            >
              <h3 className="text-sm font-semibold text-gray-100 mb-3">
                COMMENT SECTION
              </h3>
              <div className="bg-gray-800/40 border border-gray-800 rounded-lg h-48 sm:h-64 flex items-center justify-center text-gray-400 text-sm sm:text-base">
                💬 Comment feature coming soon...
              </div>

              <div className="mt-4 flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  disabled
                  className="flex-1 bg-gray-800 border border-gray-800 rounded-md px-3 py-2 text-gray-400 text-sm cursor-not-allowed"
                />
                <button className="px-2 sm:px-3 py-2 rounded-md bg-gray-800/30 text-gray-400 cursor-not-allowed">
                  <Send size={16} />
                </button>
              </div>
            </motion.div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate("/farmer/dashboard")}
                className="text-sm text-gray-300 hover:text-gray-100"
              >
                ← Back to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <MessageToast
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
        message={toast.message}
        status={toast.status}
      />

      <style>
        {`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
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
  `}
      </style>
    </div>
  );
};

export default ProductDetailsForFarmer;
