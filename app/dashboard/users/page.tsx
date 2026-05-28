"use client";

import { useEffect, useState } from "react";
import { UserPlus, Shield, Trash2, Edit2, Check, Eye, EyeOff, Loader2 } from "lucide-react";

type UserAccount = {
  id: string;
  nama: string; 
  username: string;
  role: string;
  createdAt: string;
};

// Buat interface khusus untuk membaca respon dari API secara aman
interface ApiResponse {
  success?: boolean;
  data?: UserAccount[];
  error?: string;
}

export default function KelolaAkunPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState(""); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const json = (await res.json()) as ApiResponse; // 🛡️ Menghapus any secara paksa dengan type casting aman
      if (json.success && json.data) {
        setUsers(json.data);
      }
    } catch (error) {
      console.error("Gagal ambil data", error);
    } finally { 
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const bodyData = editingId 
        ? { id: editingId, nama, username, password, role } 
        : { nama, username, password, role };

      const res = await fetch("/api/users", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const json = (await res.json()) as ApiResponse; // 🛡️ Menghapus any secara paksa dengan type casting aman
      if (res.ok) {
        handleResetForm();
        fetchUsers();
        alert(editingId ? "Akun berhasil diperbarui!" : "Akun berhasil didaftarkan!");
      } else {
        alert(json.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Gagal submit data", error);
    } finally { 
      setSubmitLoading(false);
    }
  };

  const handleEditClick = (user: UserAccount) => {
    setEditingId(user.id);
    setNama(user.nama); 
    setUsername(user.username);
    setRole(user.role);
    setPassword(""); 
  };

  const handleResetForm = () => {
    setEditingId(null);
    setNama("");
    setUsername("");
    setPassword("");
    setRole("ADMIN");
  };

  const handleDelete = async (id: string, targetUsername: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun [${targetUsername}] secara permanen?\nTindakan ini akan dicatat di Audit Log.`)) {
      try {
        const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
        const json = (await res.json()) as ApiResponse; // 🛡️ Menghapus any secara paksa dengan type casting aman

        if (res.ok) {
          fetchUsers();
          alert("Akun berhasil dihapus dari sistem!");
        } else {
          alert(json.error || "Gagal menghapus akun");
        }
      } catch (error) {
        console.error("Gagal menghapus akun", error);
      }
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="text-blue-600" /> Manajemen Akun Pengguna
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM TAMBAH / EDIT */}
        <div className={`p-6 rounded-2xl border shadow-sm h-fit transition-all ${editingId ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            {editingId ? <Edit2 size={18} className="text-amber-600" /> : <UserPlus size={18} />}
            {editingId ? "Edit Akun Staf" : "Daftarkan Staf Baru"}
          </h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Nama Lengkap Petugas</label>
              <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full border rounded-xl p-2.5 mt-1 outline-none focus:border-blue-500 text-gray-800 bg-white" placeholder="Contoh: Ahmad Subari" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Username (Untuk Login)</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded-xl p-2.5 mt-1 outline-none focus:border-blue-500 text-gray-800 bg-white" placeholder="Contoh: ahmad_gudang" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                {editingId ? "Password Baru (Kosongkan jika tidak diganti)" : "Password"}
              </label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required={!editingId} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded-xl p-2.5 mt-1 outline-none focus:border-blue-500 text-gray-800 bg-white" placeholder="Masukkan password kuat" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-4 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Hak Akses / Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border rounded-xl p-2.5 mt-1 font-bold text-gray-800 bg-white">
                <option value="ADMIN">ADMIN (Staf Gudang)</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN (Owner)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <button disabled={submitLoading} type="submit" className={`w-full py-2.5 rounded-xl font-bold text-white shadow-md flex justify-center gap-2 ${editingId ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                {submitLoading ? <Loader2 className="animate-spin" /> : editingId ? <Check size={18}/> : <UserPlus size={18}/>}
                {editingId ? "Simpan Perubahan" : "Daftarkan Akun"}
              </button>
              
              {editingId && (
                <button type="button" onClick={handleResetForm} className="w-full py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors">
                  Batal / Mode Tambah Baru
                </button>
              )}
            </div>
          </form>
        </div>

        {/* TABEL DAFTAR AKUN */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left">Nama Lengkap</th>
                <th className="px-6 py-4 text-left">Username</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 font-medium animate-pulse">Memuat database pengguna...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Belum ada akun staf yang didaftarkan.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{u.nama}</td>
                    <td className="px-6 py-4 font-mono text-xs">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${u.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button onClick={() => handleEditClick(u)} className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors" title="Edit Akun">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.id, u.username)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="Hapus Akun">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}