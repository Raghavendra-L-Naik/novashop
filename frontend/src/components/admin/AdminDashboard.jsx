
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

const reportRanges = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "all", label: "All time" }
];

function formatCurrency(value) {
  return `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;
}

export default function AdminDashboard({ onBack }) {
  const [tab, setTab] = useState("overview");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reportRange, setReportRange] = useState("30");
  const [inventorySearch, setInventorySearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerEmailFilter, setCustomerEmailFilter] = useState("");

  async function loadData() {
    try {
      const [productData, orderData, customerData] = await Promise.all([
        apiRequest("/api/admin/products"),
        apiRequest("/api/admin/orders"),
        apiRequest("/api/admin/customers")
      ]);

      setError("");
      setProducts(productData);
      setOrders(orderData);
      setCustomers(customerData);
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
        const [productData, orderData, customerData] = await Promise.all([
          apiRequest("/api/admin/products"),
          apiRequest("/api/admin/orders"),
          apiRequest("/api/admin/customers")
        ]);

        if (!cancelled) {
          setError("");
          setProducts(productData);
          setOrders(orderData);
          setCustomers(customerData);
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
    setTab("inventory");
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

  const rangeStart = new Date();
  if (reportRange !== "all") {
    rangeStart.setDate(rangeStart.getDate() - Number(reportRange) + 1);
    rangeStart.setHours(0, 0, 0, 0);
  }

  const reportOrders = orders.filter(order =>
    order.paymentStatus === "PAID" &&
    (reportRange === "all" || new Date(order.createdAt) >= rangeStart)
  );
  const reportRevenue = reportOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );
  const averageOrderValue = reportOrders.length
    ? reportRevenue / reportOrders.length
    : 0;
  const salesByDay = Object.values(reportOrders.reduce((days, order) => {
    const date = order.createdAt.slice(0, 10);
    days[date] ??= { date, revenue: 0, orders: 0 };
    days[date].revenue += Number(order.totalAmount);
    days[date].orders += 1;
    return days;
  }, {})).sort((a, b) => a.date.localeCompare(b.date));
  const maxDailyRevenue = Math.max(
    1,
    ...salesByDay.map(day => day.revenue)
  );
  const topProducts = Object.values(reportOrders
    .flatMap(order => order.items || [])
    .reduce((totals, item) => {
      totals[item.productName] ??= {
        name: item.productName,
        quantity: 0,
        revenue: 0
      };
      totals[item.productName].quantity += item.quantity;
      totals[item.productName].revenue += Number(item.subtotal);
      return totals;
    }, {}))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  const lowStockCount = products.filter(product => product.stock <= 5).length;
  const filteredInventory = products.filter(product =>
    product.name.toLowerCase().includes(inventorySearch.toLowerCase()) &&
    (!lowStockOnly || product.stock <= 5)
  );
  const customerSummaries = customers
    .map(customer => {
      const customerOrders = orders.filter(order =>
        order.email.toLowerCase() === customer.email.toLowerCase()
      );
      const completedOrders = customerOrders.filter(
        order => order.paymentStatus === "PAID"
      );
      return {
        ...customer,
        orderCount: customerOrders.length,
        totalSpent: completedOrders.reduce(
          (sum, order) => sum + Number(order.totalAmount),
          0
        ),
        lastOrder: customerOrders
          .map(order => order.createdAt)
          .sort()
          .at(-1)
      };
    })
    .filter(customer =>
      `${customer.name} ${customer.email}`
        .toLowerCase()
        .includes(customerSearch.toLowerCase())
    )
    .sort((a, b) => b.orderCount - a.orderCount);
  const filteredOrders = orders
    .filter(order =>
      (!customerEmailFilter ||
        order.email.toLowerCase() === customerEmailFilter.toLowerCase()) &&
      `${order.id} ${order.customerName} ${order.email} ${order.status}`
        .toLowerCase()
        .includes(orderSearch.toLowerCase())
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function downloadRevenueReport() {
    const rows = [
      ["Date", "Orders", "Revenue"],
      ...salesByDay.map(day => [
        day.date,
        day.orders,
        day.revenue.toFixed(2)
      ])
    ];
    const csv = rows
      .map(row => row.map(value =>
        `"${String(value).replaceAll('"', '""')}"`
      ).join(","))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `novashop-revenue-${reportRange === "all" ? "all-time" : `${reportRange}-days`}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

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
          <span>Products</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Customers</span>
          <strong>{customers.length}</strong>
        </div>
        <div>
          <span>Orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Revenue ({reportRange === "all" ? "all time" : `${reportRange} days`})</span>
          <strong>{formatCurrency(reportRevenue)}</strong>
        </div>
        <div className={lowStockCount ? "warning" : ""}>
          <span>Low stock (5 or fewer)</span>
          <strong>{lowStockCount}</strong>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          Sales Overview
        </button>
        <button
          className={tab === "inventory" ? "active" : ""}
          onClick={() => setTab("inventory")}
        >
          Inventory
        </button>
        <button
          className={tab === "customers" ? "active" : ""}
          onClick={() => setTab("customers")}
        >
          Customers
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

      {tab === "overview" && !loading && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Sales & Revenue Report</h2>
              <p>Only Razorpay payments verified as captured are counted as revenue.</p>
            </div>
            <div className="admin-actions">
              <select
                value={reportRange}
                onChange={event => setReportRange(event.target.value)}
                aria-label="Revenue report date range"
              >
                {reportRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <button onClick={downloadRevenueReport}>
                Download CSV
              </button>
            </div>
          </div>

          <div className="admin-stats admin-report-stats">
            <div>
              <span>Revenue</span>
              <strong>{formatCurrency(reportRevenue)}</strong>
            </div>
            <div>
              <span>Non-cancelled orders</span>
              <strong>{reportOrders.length}</strong>
            </div>
            <div>
              <span>Average order value</span>
              <strong>{formatCurrency(averageOrderValue)}</strong>
            </div>
          </div>

          <h3>Revenue by day</h3>
          {salesByDay.length === 0 ? (
            <p>No sales in this date range.</p>
          ) : (
            <div className="admin-revenue-chart">
              {salesByDay.map(day => (
                <div className="admin-revenue-row" key={day.date}>
                  <time>{day.date}</time>
                  <div className="admin-revenue-track">
                    <div
                      className="admin-revenue-bar"
                      style={{
                        width: `${(day.revenue / maxDailyRevenue) * 100}%`
                      }}
                    />
                  </div>
                  <strong>{formatCurrency(day.revenue)}</strong>
                  <span>{day.orders} orders</span>
                </div>
              ))}
            </div>
          )}

          <h3>Top-selling products</h3>
          {topProducts.length === 0 ? (
            <p>No product sales recorded yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Product</th><th>Units sold</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {topProducts.map(product => (
                    <tr key={product.name}>
                      <td>{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "inventory" && !loading && (
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
            <div className="admin-panel-heading">
              <div>
                <h2>Product Inventory</h2>
                <p>{lowStockCount} product(s) have five or fewer units.</p>
              </div>
              <div className="admin-actions admin-filters">
                <input
                  type="search"
                  placeholder="Search inventory..."
                  value={inventorySearch}
                  onChange={event => setInventorySearch(event.target.value)}
                  aria-label="Search inventory"
                />
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    checked={lowStockOnly}
                    onChange={event => setLowStockOnly(event.target.checked)}
                  />
                  Low stock only
                </label>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Inventory status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInventory.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>
                        ₹{Number(product.price)
                          .toLocaleString("en-IN")}
                      </td>
                      <td>{product.stock}</td>
                      <td>
                        <span className={`admin-stock-status ${
                          product.stock === 0
                            ? "out"
                            : product.stock <= 5
                              ? "low"
                              : "available"
                        }`}>
                          {product.stock === 0
                            ? "Out of stock"
                            : product.stock <= 5
                              ? "Low stock"
                              : "In stock"}
                        </span>
                      </td>
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
                  {filteredInventory.length === 0 && (
                    <tr><td colSpan="5">No matching products.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {tab === "customers" && !loading && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Customer Management</h2>
              <p>Customer accounts and their order activity.</p>
            </div>
            <input
              type="search"
              placeholder="Search name or email..."
              value={customerSearch}
              onChange={event => setCustomerSearch(event.target.value)}
              aria-label="Search customers"
            />
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Account type</th>
                  <th>Orders</th>
                  <th>Total spent</th>
                  <th>Last order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customerSummaries.map(customer => (
                  <tr key={customer.id}>
                    <td>
                      {customer.name}
                      <small>{customer.email}</small>
                    </td>
                    <td>{customer.role}</td>
                    <td>{customer.orderCount}</td>
                    <td>{formatCurrency(customer.totalSpent)}</td>
                    <td>
                      {customer.lastOrder
                        ? new Date(customer.lastOrder).toLocaleDateString()
                        : "No orders"}
                    </td>
                    <td>
                      <button
                        disabled={customer.orderCount === 0}
                        onClick={() => {
                          setCustomerEmailFilter(customer.email);
                          setOrderSearch("");
                          setTab("orders");
                        }}
                      >
                        View orders
                      </button>
                    </td>
                  </tr>
                ))}
                {customerSummaries.length === 0 && (
                  <tr><td colSpan="6">No matching customers.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "orders" && !loading && (
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <h2>Order Tracking</h2>
              <p>Review order items, shipping details, and update fulfillment status.</p>
            </div>
            <input
              type="search"
              placeholder="Search order, customer, email, status..."
              value={orderSearch}
              onChange={event => setOrderSearch(event.target.value)}
              aria-label="Search orders"
            />
          </div>
          {customerEmailFilter && (
            <p className="admin-filter-chip">
              Orders for {customerEmailFilter}
              <button onClick={() => setCustomerEmailFilter("")}>
                Clear filter
              </button>
            </p>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items & shipping</th>
                  <th>Total</th>
                  <th>Placed</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>
                      {order.customerName}
                      <small>{order.email}</small>
                    </td>
                    <td>
                      {(order.items || []).map(item => (
                        <small key={`${order.id}-${item.productName}`}>
                          {item.quantity} × {item.productName}
                        </small>
                      ))}
                      <small>Ship to: {order.shippingAddress}</small>
                    </td>
                    <td>
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td>
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td>
                      {order.paymentStatus}
                      {order.paymentFailureReason && (
                        <small>{order.paymentFailureReason}</small>
                      )}
                    </td>
                    <td>
                      <select
                        value={order.status}
                        disabled={order.paymentStatus === "PENDING"}
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
                {filteredOrders.length === 0 && (
                  <tr><td colSpan="7">No matching orders.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
