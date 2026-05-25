import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
  console.log("LOGIN ERROR:", error);
  setError(error?.message || "Kullanıcı adı veya şifre hatalı.");
  return;
}

    localStorage.setItem("forwo_user", JSON.stringify(data));

    if (data.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/client");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-[400px] border">
        <h1 className="text-3xl font-bold text-[#003527] mb-2 text-center">
          Forwo Enerji
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Müşteri ve Admin Portalı
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-3"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-[#003527] text-white p-3 rounded-lg hover:bg-[#006c49] transition"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    </div>
  );
}