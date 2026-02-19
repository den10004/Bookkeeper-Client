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
    <div className="login__container">
      <h1>Вход</h1>
      <form onSubmit={handleSubmit} className="login__form">
        <div>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>

        {auth.error && <div className="error">{auth.error}</div>}

        <button type="submit" disabled={auth.isLoading}>
          {auth.isLoading ? "Вход..." : "Войти"}
        </button>
      </form>
    </div>
  );
}
