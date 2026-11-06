
import { useState } from "react";

export default function Checkout({
  cart,
  onSuccess,
  onBack
}) {
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    shippingAddress: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity,
    0
  );

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (cart.length === 0) return;

    setLoading(true);
    setError("");

    const requestBody = {
      ...form,
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch(
        "http://localhost:8080/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(
            "Stock changed. Refresh your cart and try again."
          );
        }
        throw new Error(
          "Checkout failed. Check your details and stock."
        );
      }

      const order = await response.json();
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
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Details</h2>

          <label>Full Name</label>
          <input
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Shipping Address</label>
          <textarea
            name="shippingAddress"
            value={form.shippingAddress}
            onChange={handleChange}
            required
            rows="4"
          />

          {error && <p className="error">{error}</p>}

          <button
            type="submit"
            disabled={loading || cart.length === 0}
          >
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
          <small>No payment will be collected.</small>
        </div>
      </div>
    </main>
  );
}
