
export default function Cart({
  cart,
  updateQuantity,
  removeFromCart,
  onCheckout,
  onBack
}) {
  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity,
    0
  );

  return (
    <main className="store">
      <button onClick={onBack}>← Continue Shopping</button>
      <h1>Shopping Cart</h1>

      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {cart.map(item => (
            <div className="cart-item" key={item.id}>
              <img src={item.imageUrl} alt={item.name} />

              <div className="cart-details">
                <h3>{item.name}</h3>
                <p>₹{Number(item.price).toLocaleString("en-IN")}</p>

                <div className="quantity-controls">
                  <button onClick={() =>
                    updateQuantity(item.id, -1)
                  }>−</button>

                  <span>{item.quantity}</span>

                  <button
                    disabled={item.quantity >= item.stock}
                    onClick={() => updateQuantity(item.id, 1)}
                  >+</button>
                </div>

                <button
                  className="remove-button"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="cart-summary">
            <h2>
              Total: ₹{total.toLocaleString("en-IN")}
            </h2>

            <button onClick={onCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </main>
  );
}
