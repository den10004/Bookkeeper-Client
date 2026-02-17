import { useActionState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [state, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      try {
        await login(
          formData.get("email") as string,
          formData.get("password") as string,
        );
        return { success: true };
      } catch (err: any) {
        return { error: err.message };
      }
    },
    { success: false, error: null },
  );

  useEffect(() => {
    if (state.success) {
      navigate("/profile", { replace: true });
    }
  }, [state.success, navigate]);

  return (
    <form action={formAction} style={{ width: "500px" }}>
      <input name="email" type="email" required disabled={isPending} />
      <input name="password" type="password" required disabled={isPending} />
      {state.error && <div style={{ color: "red" }}>{state.error}</div>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Входим..." : "Войти"}
      </button>
    </form>
  );
}
