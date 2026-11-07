
import { useEffect, useState } from "react";
import { apiRequest } from "../../api";
import "./AdminDashboard.css";

const emptyProduct = {
  name: "",
  description: "",
  price: "",
  category: "Electronics",
  imageUrl: "",
  stock: ""
};

const statuses = [
  "PLACED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED"
];

export default function AdminDashboard({ onBack }) {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      const [productData, orderData] = await Promise.all([
        apiRequest("/api/admin/products"),
        apiRequest("/api/admin/orders")
      ]);

      setError("");
      setProducts(productData);
      setOrders(orderData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const [productData, orderData] = await Promise.all([
          apiRequest("/api/admin/products"),
          apiRequest("/api/admin/orders")
        ]);

        if (!cancelled) {
          setError("");
          setProducts(productData);
          setOrders(orderData);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, []);

  function changeForm(event) {
    const { name, value } = event.target;
    setForm(previous => ({
      ...previous,
      [name]: value
    }));
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl || "",
      stock: product.stock
    });
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyProduct);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock)
    };

    try {
      await apiRequest(
        editingId
          ? `/api/admin/products/${editingId}`
          : "/api/admin/products",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload)
        }
      );

      setMessage(
        editingId ? "Product updated." : "Product created."
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm("Delete this product?")) return;

    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/admin/products/${id}`, {
        method: "DELETE"
      });

      setMessage("Product deleted.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateOrderStatus(id, status) {
    setError("");
    setMessage("");

    try {
      await apiRequest(`/api/admin/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      setMessage("Order status updated.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  const revenue = orders
    .filter(order => order.status !== "CANCELLED")
    .reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage your NovaShop store</p>
        </div>
        <button onClick={onBack}>Back to Store</button>
      </div>

      <div className="admin-stats">
        <div>
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Total Orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Order Value (Demo)</span>
          <strong>
            ₹{revenue.toLocaleString("en-IN")}
          </strong>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={tab === "products" ? "active" : ""}
          onClick={() => setTab("products")}
        >
          Products
        </button>
        <button
          className={tab === "orders" ? "active" : ""}
          onClick={() => setTab("orders")}
        >
          Orders
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="admin-message">{message}</p>}
      {loading && <p>Loading dashboard...</p>}

      {tab === "products" && !loading && (
        <>
          <section className="admin-panel">
            <h2>
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>

            <form className="admin-form" onSubmit={saveProduct}>
              <label>
                Product Name
                <input
                  name="name"
                  value={form.name}
                  onChange={changeForm}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  name="description"
                  value={form.description}
                  onChange={changeForm}
                  rows="3"
                />
              </label>

              <label>
                Price (₹)
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={changeForm}
                  required
                />
              </label>

              <label>
                Category
                <input
                  name="category"
                  value={form.category}
                  onChange={changeForm}
                  required
                />
              </label>

              <label>
                Image URL
                <input
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={form.imageUrl}
                  onChange={changeForm}
                />
              </label>

              <label>
                Stock
                <input
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={changeForm}
                  required
                />
              </label>

              <div className="admin-actions">
                <button disabled={saving} type="submit">
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Product"
                      : "Add Product"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={resetForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="admin-panel">
            <h2>Product Inventory</h2>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        ₹{Number(product.price)
                          .toLocaleString("en-IN")}
                      </td>
                      <td>{product.stock}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            onClick={() => editProduct(product)}
                          >
                            Edit
                          </button>

                          <button
                            className="danger"
                            onClick={() => deleteProduct(product.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "orders" && !loading && (
        <section className="admin-panel">
          <h2>Customer Orders</h2>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>
                      {order.customerName}
                      <small>{order.email}</small>
                    </td>
                    <td>
                      ₹{Number(order.totalAmount)
                        .toLocaleString("en-IN")}
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={e =>
                          updateOrderStatus(
                            order.id,
                            e.target.value
                          )
                        }
                      >
                        {statuses.map(status => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
