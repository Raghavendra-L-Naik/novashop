
import { useEffect, useState } from "react";
import { apiRequest } from "../api";

export default function OrderHistory({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    apiRequest("/api/orders/my")
      .then(data => {
        if (active) setOrders(data);
      })
      .catch(err => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="store">
      <button onClick={onBack}>← Back to Store</button>
      <h1>My Orders</h1>

      {loading && <p>Loading orders...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <p>You haven't placed any orders yet.</p>
      )}

      {orders.map(order => (
        <div className="history-card" key={order.orderId}>
          <h3>Order #{order.orderId}</h3>

          <p>Status: {order.status}</p>
          <p>Payment: {order.paymentStatus}</p>
          {order.paymentFailureReason && (
            <p className="error">{order.paymentFailureReason}</p>
          )}
          <p>
            Date: {new Date(order.createdAt).toLocaleString()}
          </p>

          {order.items.map((item, index) => (
            <p key={index}>
              {item.productName} × {item.quantity}
              {" — "}₹{Number(item.subtotal).toLocaleString("en-IN")}
            </p>
          ))}

          <h3>
            Total: ₹{Number(order.totalAmount)
              .toLocaleString("en-IN")}
          </h3>
        </div>
      ))}
    </main>
  );
}
