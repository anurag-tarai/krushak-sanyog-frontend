import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Send, ShoppingCart, User } from "lucide-react";
import api from "../api/api";

import "leaflet/dist/leaflet.css";
import SingleProductMap from "../components/map/SingleProductMap";
import MessageToast from "../components/common/MessageToast";

// Skeleton shimmer
const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-pulse bg-gray-800/60 rounded-md transition-all duration-300 ease-out ${className}`}
  />
);

const ImageSlider = React.lazy(() => import("../components/common/ImageSlider"));

const SingleProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const name = localStorage.getItem("name");

  const [product, setProduct] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    status: "info",
  });

  const showToast = (message, status = "info") => {
    setToast({ show: true, message, status });
  };


  const showSignInMessage = () => {
    showToast("Sign in required — redirecting...", "warning");
    navigate("/buyer/signin");
  };



 useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    try {
      const productRes = await api.get(`/api/v1/products/${productId}`);
      const fetchedProduct = productRes.data;
      if (!isMounted) return;

      setProduct(fetchedProduct);

      const id = fetchedProduct.farmerId;

      const res = await api.get(`/api/v1/user/`+id);
      setFarmer(res.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
  };

  fetchData();
  return () => {
    isMounted = false;
  };
}, []);


  const fadeUp = {
    hidden: { opacity: 0, y: 14 },
    visible: (i = 0) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.06, duration: 0.4 },
    }),
  };

  const memoizedMap = useMemo(() => {
    if (loading) return null;
    if (!product?.latitude || !product?.longitude)
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Location data not available
        </div>
      );


    return (
      <div className="rounded-lg overflow-visible border border-gray-800 relative z-10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
        <div className="w-full h-64 relative">
          <SingleProductMap
            latitude={product.latitude}
            longitude={product.longitude}
            productName={product.name}
          />
        </div>
      </div>
    );
  }, [loading, product?.latitude, product?.longitude, product?.name]);

 
  const addToCart = (productid) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060606] via-[#0d0d0e] to-[#151516] text-gray-200 relative">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.03),transparent_40%)]" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-0 ">


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10 ">
          {/* LEFT CONTENT */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
              className="lg:col-span-2 h-[85vh] overflow-y-auto custom-scrollbar p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 shadow-[0_0_15px_rgba(255,255,255,0.04)] backdrop-blur-md relative"
            >
              {loading ? (
              <>
                <Skeleton className="h-[360px] w-full mb-6" />
                <Skeleton className="h-6 w-1/3 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </>
            ) : (
              product && (
                <>
                  <div className="relative mb-6">
                    <div className="rounded-xl overflow-hidden">
                      <Suspense
                        fallback={
                          <div className="w-full h-[360px] bg-gray-800 rounded-xl animate-pulse" />
                        }
                      >
                        <ImageSlider images={product.imageUrls || []} />
                      </Suspense>
                    </div>
                  </div>

                  {/* INFO */}
                  <div className="flex flex-col gap-6">
                    <div>
                      <h1 className="text-3xl font-semibold text-gray-100 flex items-center gap-2">
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
                      <p className="text-sm text-gray-400 mt-1">
                        {product.category}
                      </p>
                      <p className="mt-4 text-gray-300 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                       <div className="mt-8">
                      <button
                        onClick={() => addToCart(product.productId)}
                        className="px-6 py-3 rounded-lg bg-green-700/80 hover:bg-green-600 text-gray-100 font-medium border border-green-600/60 transition-all shadow-[0_0_10px_rgba(34,197,94,0.25)] hover:shadow-[0_0_14px_rgba(34,197,94,0.35)]"
                      >
                        Add to Wishlist
                      </button>
                    </div>

                      <div className="flex items-center gap-3 bg-gray-800/40 p-3 rounded-lg">
                        <MapPin className="text-gray-300" />
                        <div>
                          <div className="text-xs text-gray-400">Location</div>
                          <div className="text-gray-100 font-medium">
                            {product.address || "Not provided"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )
            )}
          </motion.div>

          {/* RIGHT CONTENT */}
          <div className="space-y-6 h-[85vh] overflow-y-auto custom-scrollbar pr-2">
            {/* MAP */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="p-6 h-[30rem] rounded-2xl bg-gray-900/40 border border-gray-800/60 shadow relative z-10 backdrop-blur-md"
            >
              <h3 className="text-sm font-semibold text-gray-100 mb-3">
                Product Location
              </h3>
              {loading ? <Skeleton className="w-full h-64 mb-2" /> : memoizedMap}
            </motion.div>

            {/* FARMER INFO */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 shadow backdrop-blur-md"
            >
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <User size={16} /> Farmer Details
              </h3>
              {farmer ? (
                <div className="space-y-2 text-gray-300 text-sm">
                  <p>
                    <span className="text-gray-400">Name:</span>{" "}
                    {farmer.firstName} {farmer.lastName}
                  </p>
                  <p>
                    <span className="text-gray-400">Email:</span> {farmer.email}
                  </p>
                  <p>
                    <span className="text-gray-400">Contact:</span>{" "}
                    {farmer.phoneNumber}
                  </p>
                </div>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
            </motion.div>

            {/* COMMENT SECTION STRUCTURE */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/60 shadow backdrop-blur-md"
            >
              <h3 className="text-sm font-semibold text-gray-100 mb-3">
                CHAT / COMMENTS
              </h3>
              <div className="bg-gray-800/40 border border-gray-800 rounded-lg h-64 flex items-center justify-center text-gray-400">
                💬 Chat feature coming soon...
              </div>

              <div className="mt-4 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  disabled
                  className="flex-1 bg-gray-800 border border-gray-800 rounded-md px-3 py-2 text-gray-400 cursor-not-allowed"
                />
                <button className="px-3 py-2 rounded-md bg-gray-800/30 text-gray-400 cursor-not-allowed">
                  <Send />
                </button>
              </div>
            </motion.div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate("/products")}
                className="text-sm text-gray-300 hover:text-gray-100"
              >
                ← Back to Explore Products
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
        .custom-scrollbar::-webkit-scrollbar {}
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(18, 18, 18, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(34,197,94,0.35), rgba(34,197,94,0.25));
          border-radius: 9999px;
          border: 1px solid rgba(12,12,12,0.6);
          transition: all 0.25s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(34,197,94,0.6), rgba(34,197,94,0.45));
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(34,197,94,0.4) rgba(18,18,18,0.4);
        }
      `}
      </style>
    </div>
  );
};

export default SingleProduct;
