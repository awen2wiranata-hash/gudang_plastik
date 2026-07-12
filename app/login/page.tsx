"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Logika tangguh: dorong ke root lalu refresh untuk memicu perubahan di proxy.ts
        router.push("/");
        router.refresh();
      } else {
        setError(data.message || "Username atau Password salah!");
      }
    } catch {
      // 🔥 Perbaikan: Menghapus (err) yang tidak digunakan
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Mempertahankan trik CSS fixed inset-0 z-[100] aslimu agar menutup layout luar dengan sempurna
    <div className="fixed inset-0 z-[100] bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* 🔵 Bagian Atas / Header Login Khas Kamu */}
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Package size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Family Jaya</h1>
          <p className="text-blue-100 text-sm mt-1 font-medium">Sistem Manajemen Gudang Terpadu</p>
        </div>

        {/* 📄 Bagian Form & Input */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Login Administrator</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold mb-6 text-center border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  required 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900" 
                  placeholder="Masukkan username" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-gray-900" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 mt-2 disabled:bg-gray-400"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
          
          <div className="mt-8 text-center text-xs text-gray-400">
            &copy; 2026 Wendy Wiranata - Skripsi Sistem Informasi
          </div>
        </div>

      </div>
    </div>
  );
}