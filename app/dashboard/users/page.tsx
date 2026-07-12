"use client";

import { useEffect, useState } from "react";
import { UserPlus, Shield, Edit2, Check, Eye, EyeOff, Loader2 } from "lucide-react";

type UserAccount = {
  id: string;
  nama: string; 
  username: string;
  role: string;
  createdAt: string;
};

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
      const json = (await res.json()) as ApiResponse; 
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

      const json = (await res.json()) as ApiResponse; 
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
        const json = (await res.json()) as ApiResponse; 

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
    /* MODIFIKASI: Menggunakan max-w-none w-full agar layout meregang penuh memenuhi layar laptop */
    <div className="p-8 max-w-none w-full px-4 md:px-12 bg-gray-50 min-h-screen">
      
      {/* HEADER UTAMA */}
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          <Shield className="text-blue-600 w-8 h-8" /> Manajemen Kredensial Akun Pengguna
        </h1>
        <p className="text-sm text-gray-500 mt-1.5 font-medium">
          Kelola hak akses sistem, tambah staf operasional baru, atau perbarui kata sandi keamanan secara terpusat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
        
        {/* FORM TAMBAH / EDIT DATA */}
        <div className={`p-6 rounded-xl border shadow-sm transition-all ${editingId ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200"}`}>
          <h2 className={`text-lg font-bold mb-5 flex items-center gap-2 ${editingId ? "text-amber-800" : "text-gray-800"}`}>
            {editingId ? <Edit2 size={18} /> : <UserPlus size={18} />}
            {editingId ? "Mode Perubahan Kredensial Staf" : "Daftarkan Akun Staf Baru"}
          </h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* MODIFIKASI: Penambahan text-gray-900 font-medium pada input agar tulisan hitam tajam saat mengetik */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nama Lengkap Petugas</label>
              <input 
                type="text" 
                required 
                value={nama} 
                onChange={(e) => setNama(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1.5 outline-none text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-all text-sm" 
                placeholder="Contoh: Ahmad Subari" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Username (Untuk Akses Login)</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg p-2.5 mt-1.5 outline-none text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-all text-sm" 
                placeholder="Contoh: ahmad_gudang" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {editingId ? "Kata Sandi Baru (Kosongkan jika tidak diganti)" : "Kata Sandi (Password)"}
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required={!editingId} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg p-2.5 mt-1.5 outline-none text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400 bg-white transition-all text-sm pr-10" 
                  placeholder="Masukkan password kuat..." 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-4.5 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Tingkatan Hak Akses (Role)</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 mt-1.5 font-bold text-gray-800 bg-white outline-none focus:border-blue-500 text-sm cursor-pointer shadow-sm">
                <option value="ADMIN">ADMIN </option>
                <option value="SUPER_ADMIN">SUPER ADMIN</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button disabled={submitLoading} type="submit" className={`w-full py-2.5 rounded-lg font-bold text-white shadow-sm flex justify-center items-center gap-2 transition-all active:scale-95 text-sm ${editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}>
                {submitLoading ? <Loader2 className="animate-spin" size={18} /> : editingId ? <Check size={18}/> : <UserPlus size={18}/>}
                {editingId ? "Simpan Perubahan Akun" : "Daftarkan Akun Baru"}
              </button>
              
              {editingId && (
                <button type="button" onClick={handleResetForm} className="w-full py-2 text-xs font-bold text-gray-500 hover:text-red-500 bg-transparent hover:bg-gray-100 rounded-lg border border-transparent transition-all mt-1">
                  ✕ Batalkan Perubahan / Tambah Baru
                </button>
              )}
            </div>
          </form>
        </div>

        {/* TABEL STRIP DAFTAR AKUN - Stretch Memenuhi Kanan Kiri */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm w-full">
          <div className="p-5 border-b border-gray-100 bg-white">
            <h2 className="text-lg font-bold text-gray-800">Daftar Otorisasi Akun Staf Gudang</h2>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 font-bold text-xs text-gray-500 uppercase tracking-wider border-b">
                <tr>
                  <th className="px-6 py-4 text-left">Nama Lengkap Petugas</th>
                  <th className="px-6 py-4 text-left">Username</th>
                  <th className="px-6 py-4 text-left">Hak Akses (Role)</th>
                  <th className="px-6 py-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-12 font-bold text-gray-400 animate-pulse">🔄 Sedang menyelaraskan database akun pengguna...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 font-medium text-gray-400">Belum ada kredensial akun staf yang terdaftar di sistem.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{u.nama}</td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600 bg-blue-50/10 whitespace-nowrap">{u.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide border shadow-sm ${u.role === 'SUPER_ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => handleEditClick(u)} className="text-amber-600 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg border border-amber-200 transition-colors text-xs" title="Edit Akun">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(u.id, u.username)} className="text-red-600 hover:text-red-900 font-bold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg border border-red-200 transition-colors text-xs" title="Hapus Akun">
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}