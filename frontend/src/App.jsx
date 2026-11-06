
import { useEffect, useState } from "react";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import "./App.css";

function App() {
  const [page, setPage] = useState("products");
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/products"
      );

      if (!response.ok) {
        throw new Error("Unable to load products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "novashop-cart",
      JSON.stringify(cart)
    );
  }, [cart]);

  function addToCart(product) {
    setCart(previous => {
      const existing = previous.find(
        item => item.id === product.id
      );

      if (existing) {
        if (existing.quantity >= product.stock) {
          return previous;
        }

        return previous.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      if (product.stock <= 0) return previous;

      return [...previous, { ...product, quantity: 1 }];
    });
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === "All" || product.category === category)
  );

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className="app">
      <header className="navbar">
        <h2 onClick={() => setPage("products")}>
          NovaShop
        </h2>

        <button onClick={() => setPage("cart")}>
          🛒 Cart ({cartCount})
        </button>
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
              >
                {categories.map(c => (
                  <option key={c}>{c}</option>
                ))}
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
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      {page === "cart" && (
        <Cart
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          onCheckout={() => setPage("checkout")}
          onBack={() => setPage("products")}
        />
      )}

      {page === "checkout" && (
        <Checkout
          cart={cart}
          onSuccess={handleOrderSuccess}
          onBack={() => setPage("cart")}
        />
      )}

      {page === "success" && order && (
        <main className="store success-page">
          <h1>Order Placed Successfully!</h1>
          <p>Order ID: #{order.orderId}</p>
          <p>Status: {order.status}</p>
          <h2>
            Total: ₹{Number(order.totalAmount)
              .toLocaleString("en-IN")}
          </h2>

          <button onClick={() => setPage("products")}>
            Continue Shopping
          </button>
        </main>
      )}

      <footer>© NovaShop — Your Online Store</footer>
    </div>
  );
}

export default App;
