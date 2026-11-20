
import AdminDashboard from "./components/admin/AdminDashboard";

import { useEffect, useState } from "react";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import Login from "./components/Login";
import Register from "./components/Register";
import OrderHistory from "./components/OrderHistory";
import { apiRequest } from "./api";
import "./App.css";

function App() {
  const [page, setPage] = useState("products");
  const [user, setUser] = useState(() => {
    const token = sessionStorage.getItem("novashop-token");
    const savedUser = sessionStorage.getItem("novashop-user");

    if (!token || !savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      sessionStorage.removeItem("novashop-token");
      sessionStorage.removeItem("novashop-user");
      return null;
    }
  });
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("novashop-cart") || "[]"
      );
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [priceSort, setPriceSort] = useState("default");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [addedProduct, setAddedProduct] = useState(null);

  async function loadProducts() {
    try {
      const data = await apiRequest("/api/products");
      setError("");
      setProducts(data);
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
        const data = await apiRequest("/api/products");
        if (!cancelled) {
          setError("");
          setProducts(data);
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

  useEffect(() => {
    localStorage.setItem(
      "novashop-cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  function handleLogin(loggedInUser) {
    sessionStorage.setItem(
      "novashop-user",
      JSON.stringify(loggedInUser)
    );
    setUser(loggedInUser);
    setPage("products");
  }

  function logout() {
    sessionStorage.removeItem("novashop-token");
    sessionStorage.removeItem("novashop-user");
    setUser(null);
    setCart([]);
    setPage("products");
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);

    if (
      product.stock <= 0 ||
      (existing?.quantity ?? 0) >= product.stock
    ) {
      return;
    }

    setCart(previous => {
      const currentItem = previous.find(
        item => item.id === product.id
      );

      if (currentItem) {
        return previous.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      if (product.stock <= 0) return previous;

      return [...previous, { ...product, quantity: 1 }];
    });
    setAddedProduct(product);
  }

  function updateQuantity(id, change) {
    setCart(previous =>
      previous
        .map(item =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(
                  item.stock,
                  item.quantity + change
                )
              }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart(previous =>
      previous.filter(item => item.id !== id)
    );
  }

  async function handleOrderSuccess(newOrder) {
    setOrder(newOrder);
    setCart([]);
    setPage("success");
    await loadProducts();
  }

  const categories = [
    "All",
    ...new Set(products.map(p => p.category))
  ];

  const filteredProducts = products
    .filter(product =>
      product.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "All" || product.category === category)
    )
    .sort((a, b) => {
      if (priceSort === "low-to-high") {
        return Number(a.price) - Number(b.price);
      }

      if (priceSort === "high-to-low") {
        return Number(b.price) - Number(a.price);
      }

      return 0;
    });

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  function goToCheckout() {
    setPage(user ? "checkout" : "login");
  }

  return (
    <div className="app">
      <header className="navbar">
        <h2
          onClick={() => setPage("products")}
          style={{ cursor: "pointer" }}
        >
          NovaShop
        </h2>

        <nav className="nav-actions">
          
{user ? (
  <>
    <span>Hi, {user.name}</span>

    {user.role === "ADMIN" && (
      <button onClick={() => setPage("admin")}>
        Admin Dashboard
      </button>
    )}

    <button onClick={() => setPage("orders")}>
      My Orders
    </button>

    <button onClick={logout}>
      Logout
    </button>
  </>
) : (

            <>
              <button onClick={() => setPage("login")}>
                Login
              </button>
              <button onClick={() => setPage("register")}>
                Register
              </button>
            </>
          )}

          <button onClick={() => setPage("cart")}>
            Cart ({cartCount})
          </button>
        </nav>
      </header>

      {page === "products" && (
        <>
          <section className="hero">
            <h1>Discover Amazing Products</h1>
            <p>Shop your favorites at great prices.</p>
          </section>

          <main className="store">
            <h2>Our Products</h2>

            <div className="filters">
              <input
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                aria-label="Filter by category"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={priceSort}
                onChange={e => setPriceSort(e.target.value)}
                aria-label="Sort products by price"
              >
                <option value="default">Sort by price</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
              </select>
            </div>

            {loading && <p>Loading products...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && (
              <div className="product-grid">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    cartQuantity={
                      cart.find(item => item.id === product.id)?.quantity ?? 0
                    }
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {page === "login" && (
        <Login
          onLogin={handleLogin}
          onRegister={() => setPage("register")}
        />
      )}

      {page === "register" && (
        <Register
          onRegistered={() => setPage("login")}
          onLogin={() => setPage("login")}
        />
      )}

      {page === "cart" && (
        <Cart
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          onCheckout={goToCheckout}
          onBack={() => setPage("products")}
        />
      )}

      {page === "checkout" && user && (
        <Checkout
          cart={cart}
          user={user}
          onSuccess={handleOrderSuccess}
          onBack={() => setPage("cart")}
        />
      )}

      {page === "orders" && user && (
        <OrderHistory
          onBack={() => setPage("products")}
        />
      )}

      {page === "success" && order && (
        <main className="store success-page">
          <h1>Payment Successful — Order Placed!</h1>
          <p>Order ID: #{order.orderId}</p>
          <p>Status: {order.status}</p>
          <p>Payment: {order.paymentStatus}</p>
          <h2>
            ₹{Number(order.totalAmount)
              .toLocaleString("en-IN")}
          </h2>
          <button onClick={() => setPage("orders")}>
            View My Orders
          </button>
        </main>
      )}

{page === "admin" && user?.role === "ADMIN" && (
  <AdminDashboard
    onBack={() => setPage("products")}
  />
)}

{addedProduct && (
  <div className="dialog-backdrop">
    <dialog
      open
      className="added-dialog"
      aria-labelledby="added-dialog-title"
    >
      <h2 id="added-dialog-title">Added successfully</h2>
      <p>{addedProduct.name} was added to your cart.</p>
      <button onClick={() => setAddedProduct(null)}>
        Continue Shopping
      </button>
    </dialog>
  </div>
)}

<footer>© NovaShop — Your Online Store</footer>
    </div>
  );
}

export default App;
