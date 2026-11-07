
import { useState } from "react";
import { apiRequest } from "../api";

export default function Register({ onRegistered, onLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(event) {
    setForm(previous => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form)
      });

      onRegistered();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create Account</h1>
        <p>Join NovaShop today</p>

        <label>Full Name</label>
        <input
          name="name"
          value={form.name}
          onChange={update}
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={update}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          minLength={8}
          maxLength={72}
          value={form.password}
          onChange={update}
          required
        />

        {error && <p className="error">{error}</p>}

        <button disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p>
          Already registered?{" "}
          <button type="button" onClick={onLogin}>
            Login
          </button>
        </p>
      </form>
    </main>
  );
}
