
function ProductCard({ product, onAddToCart }) {
  return (
    <div className="product-card">
      <img
        src={product.imageUrl}
        alt={product.name}
      />

      <div className="product-info">
        <span className="category">
          {product.category}
        </span>

        <h3>{product.name}</h3>
        <p>{product.description}</p>

        <div className="product-bottom">
          <strong>
            ₹{Number(product.price).toLocaleString("en-IN")}
          </strong>

          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock <= 0}
          >
            {product.stock > 0
              ? "Add to Cart"
              : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
