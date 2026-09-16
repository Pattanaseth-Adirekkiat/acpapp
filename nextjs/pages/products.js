import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ProductsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    setEmail(localStorage.getItem("email") || "User");
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    router.push("/login");
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: parseFloat(form.price),
          stock: parseInt(form.stock, 10),
        }),
      });

      if (!res.ok) throw new Error("Failed to create product");

      setForm({ name: "", description: "", price: "", stock: "" });
      setMessage({ type: "success", text: "Product added successfully!" });
      fetchProducts();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleBuy = async (id) => {
    setMessage({ type: "", text: "" });
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/products/${id}/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || "Purchase failed");
      }

      setMessage({ type: "success", text: "Product purchased successfully!" });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: p.stock - 1 } : p))
      );
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete product");

      setMessage({ type: "success", text: "Product deleted successfully!" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading store...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ACP Simple Store</h1>
          <p className="text-sm text-gray-500">
            Logged in as: <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link href="/">
            <button className="px-4 py-2 text-sm border rounded text-gray-700 hover:bg-gray-50">
              Dashboard
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`p-3 rounded text-sm ${
            message.type === "error"
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-green-100 text-green-700 border border-green-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Product Form */}
      <div className="bg-white p-6 border rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">Add New Product</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter details to add a new item to the store catalog.
        </p>
        <form onSubmit={handleCreateProduct}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              className="border p-2 rounded text-sm"
              placeholder="Product Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="border p-2 rounded text-sm"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              className="border p-2 rounded text-sm"
              type="number"
              step="0.01"
              placeholder="Price ($)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <input
              className="border p-2 rounded text-sm"
              type="number"
              placeholder="Stock"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
          >
            Add Product
          </button>
        </form>
      </div>

      {/* Catalog Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Catalog</h2>
        {products.length === 0 ? (
          <p className="text-gray-500">No products available in the catalog.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="border rounded-lg p-5 bg-white shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {product.description || "No description available."}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-2xl font-bold text-emerald-600">
                    ${typeof product.price === "number" ? product.price.toFixed(2) : parseFloat(product.price).toFixed(2)}
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                        product.stock > 0
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleBuy(product.id)}
                    disabled={product.stock <= 0}
                    className={`w-full py-2 px-3 rounded text-sm font-medium text-white ${
                      product.stock > 0
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {product.stock > 0 ? "Buy" : "Out of Stock"}
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="w-full py-2 px-3 rounded text-sm font-medium bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}