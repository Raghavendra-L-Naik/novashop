
import { useState } from "react";
import { apiRequest } from "../api";

export default function Checkout({
  cart,
  user,
  onSuccess,
  onBack
}) {
  const [name, setName] = useState(user.name);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity,
    0
  );

  async function submit(event) {
    event.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const order = await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          customerName: name,
          shippingAddress: address,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      });

      onSuccess(order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="store">
      <button onClick={onBack}>← Back to Cart</button>
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <h2>Shipping Details</h2>

          <label>Full Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <label>Email</label>
          <input value={user.email} readOnly />

          <label>Shipping Address</label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
            rows="4"
          />

          {error && <p className="error">{error}</p>}

          <button disabled={loading || cart.length === 0}>
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>

        <div className="order-summary">
          <h2>Order Summary</h2>

          {cart.map(item => (
            <p key={item.id}>
              {item.name} × {item.quantity}
            </p>
          ))}

          <hr />

          <h2>
            Total: ₹{total.toLocaleString("en-IN")}
          </h2>

          <small>Demo checkout — no payment collected.</small>
        </div>
      </div>
    </main>
  );
}
