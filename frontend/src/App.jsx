
import { useEffect, useState } from "react";
import ProductCard from "./components/ProductCard";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const url = "http://localhost:8080/api/products";

      try {
        console.info("[NovaShop] Loading products:", url);
        const response = await fetch(url);
        console.info("[NovaShop] Products response:", response.status);

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data = await response.json();
        console.info("[NovaShop] Products loaded:", data.length);
        setProducts(data);
      } catch (err) {
        console.error("[NovaShop] Failed to load products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = [
    "All",
    ...new Set(products.map(p => p.category))
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" ||
      product.category === category;

    return matchesSearch && matchesCategory;
  });

  function addToCart(product) {
    console.info("[NovaShop] Adding product to cart:", product.name);
    setCart(previousCart => {
      const quantity = previousCart.filter(
        item => item.id === product.id
      ).length;

      if (quantity >= product.stock) {
        return previousCart;
      }

      return [...previousCart, product];
    });
  }

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price),
    0
  );

  return (
    <div className="app">
      <header className="navbar">
        <h2>NovaShop</h2>
        <div className="cart-info">
          Cart ({cart.length}) · ₹{total.toLocaleString("en-IN")}
        </div>
      </header>

      <section className="hero">
        <h1>Discover Amazing Products</h1>
        <p>Shop your favorites at great prices.</p>
      </section>

      <main className="store">
        <div className="store-heading">
          <h2>Our Products</h2>
          <p>Find something you'll love</p>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            {categories.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
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

        {!loading && !error &&
          filteredProducts.length === 0 && (
            <p>No products found.</p>
          )}
      </main>

      <footer>
        © NovaShop — Your Online Store
      </footer>
    </div>
  );
}

export default App;
