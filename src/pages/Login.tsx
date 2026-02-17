import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, auth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate("/profile");
    } catch (err) {}
  };

  if (auth.isLoading) return <div>Загрузка...</div>;

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "20px" }}>
      <h1>Вход</h1>

      {auth.error && (
        <div style={{ color: "crimson", marginBottom: "16px" }}>
          {auth.error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ display: "block", width: "100%", marginTop: "8px" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ display: "block", width: "100%", marginTop: "8px" }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={auth.isLoading}
          style={{ width: "100%", padding: "12px" }}
        >
          {auth.isLoading ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
