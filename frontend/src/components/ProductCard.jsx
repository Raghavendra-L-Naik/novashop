
import { getProductImageUrl } from "../productImages";

function ProductCard({ product, cartQuantity, onAddToCart }) {
  const outOfStock = product.stock <= 0;
  const stockLimitReached = cartQuantity >= product.stock;

  return (
    <div className="product-card">
      <img src={getProductImageUrl(product)} alt={product.name} />

      <div className="product-info">
        <span className="category">{product.category}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>

        <div className="product-bottom">
          <strong>
            ₹{Number(product.price).toLocaleString("en-IN")}
          </strong>

          <div className="product-cart-action">
            <button
              disabled={outOfStock || stockLimitReached}
              onClick={() => onAddToCart(product)}
            >
              {outOfStock
                ? "Out of Stock"
                : stockLimitReached
                  ? "Stock Limit Reached"
                  : "Add to Cart"}
            </button>
            <span aria-live="polite">
              In cart: {cartQuantity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
