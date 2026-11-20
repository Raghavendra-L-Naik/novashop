
import { useState } from "react";
import { apiRequest } from "../api";

let razorpayScriptPromise;

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error("Could not load Razorpay Checkout. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

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
  const [pendingVerification, setPendingVerification] = useState(null);

  const total = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * item.quantity,
    0
  );

  async function verifyPayment(payment, gatewayOrderId) {
    try {
      const order = await apiRequest("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpayOrderId: gatewayOrderId,
          razorpayPaymentId: payment.razorpay_payment_id,
          razorpaySignature: payment.razorpay_signature
        })
      });

      setPendingVerification(null);
      onSuccess(order);
    } catch (err) {
      setLoading(false);
      setPendingVerification({
        payment,
        gatewayOrderId
      });
      setError(
        `Payment may have succeeded, but verification could not be completed: ${err.message}`
      );
    }
  }

  async function reportFailedPayment(gatewayOrderId, reason) {
    try {
      await apiRequest("/api/payments/failed", {
        method: "POST",
        body: JSON.stringify({
          razorpayOrderId: gatewayOrderId,
          reason
        })
      });
      setError(reason || "Payment was not completed. Your cart is unchanged.");
    } catch (err) {
      setError(`${reason || "Payment was not completed."} ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    setError("");
    setPendingVerification(null);

    let paymentOrder;
    try {
      paymentOrder = await apiRequest("/api/payments/create", {
        method: "POST",
        body: JSON.stringify({
          checkout: {
            customerName: name,
            shippingAddress: address,
            items: cart.map(item => ({
              productId: item.id,
              quantity: item.quantity
            }))
          }
        })
      });
      await loadRazorpayCheckout();
    } catch (err) {
      if (paymentOrder?.razorpayOrderId) {
        await reportFailedPayment(
          paymentOrder.razorpayOrderId,
          "Could not open Razorpay Checkout."
        );
      } else {
        setError(err.message);
        setLoading(false);
      }
      return;
    }

    let failureReported = false;
    let checkoutCompleted = false;
    let failureReason = "";
    let razorpay;
    try {
      razorpay = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "NovaShop",
        description: "Order payment",
        order_id: paymentOrder.razorpayOrderId,
        prefill: {
          name,
          email: user.email
        },
        theme: {
          color: "#2563eb"
        },
        handler: async payment => {
          checkoutCompleted = true;
          setLoading(true);
          await verifyPayment(payment, paymentOrder.razorpayOrderId);
        },
        modal: {
          ondismiss: () => {
            if (!checkoutCompleted && !failureReported) {
              failureReported = true;
              void reportFailedPayment(
                paymentOrder.razorpayOrderId,
                failureReason ||
                  "Payment was cancelled. Your cart is unchanged."
              );
            }
          }
        }
      });
    } catch (err) {
      await reportFailedPayment(
        paymentOrder.razorpayOrderId,
        `Could not initialize Razorpay Checkout: ${err.message}`
      );
      return;
    }

    razorpay.on("payment.failed", event => {
      failureReason = event.error?.description ||
        event.error?.reason ||
        "Payment failed. Please try again.";
      setError(`${failureReason} Retry in the payment window or close it to cancel.`);
    });

    try {
      razorpay.open();
      setLoading(false);
    } catch (err) {
      await reportFailedPayment(
        paymentOrder.razorpayOrderId,
        `Could not open Razorpay Checkout: ${err.message}`
      );
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

          <button disabled={loading || cart.length === 0 || pendingVerification}>
            {loading ? "Opening secure checkout..." : "Pay with Razorpay"}
          </button>
          {pendingVerification && (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setLoading(true);
                void verifyPayment(
                  pendingVerification.payment,
                  pendingVerification.gatewayOrderId
                );
              }}
            >
              Retry payment verification
            </button>
          )}
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

          <small>Secure Razorpay test-mode checkout.</small>
        </div>
      </div>
    </main>
  );
}
