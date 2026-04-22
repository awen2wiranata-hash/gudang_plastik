"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import { Eye, Trash2, X, Plus, List, FileText, CheckCircle } from "lucide-react";

// --- TIPE DATA ---
type Supplier = { id: string; namaPabrik: string };
type Barang = { id: string; namaBarang: string; kodeBarang: string; stokSekarang: number };
type DetailMasuk = { barangId: string; jumlah: number | "" };
type RiwayatMasuk = {
  id: string; nomorNota: string; tanggal: string; supplierId: string;
  supplier: { namaPabrik: string };
  detailBarang: { jumlah: number; barang: { id: string; namaBarang: string; kodeBarang: string } }[];
};
type TabItem = {
  id: string; title: string; type: "RIWAYAT" | "FORM"; dataEdit?: RiwayatMasuk;
};

// ==========================================
// KOMPONEN: FORM TRANSAKSI (Bisa untuk Baru & Edit/Rincian)
// ==========================================
const FormTransaksiTab = ({ 
   dataEdit, daftarSupplier, daftarBarang, onSuccess, onClose, onDelete 
}: { 
  tabId: string, dataEdit?: RiwayatMasuk, daftarSupplier: Supplier[], daftarBarang: Barang[], 
  onSuccess: () => void, onClose: () => void, onDelete?: (id: string, nota: string) => void 
}) => {
  const isEdit = !!dataEdit;
  const [nomorNota, setNomorNota] = useState(dataEdit?.nomorNota || "");
  const [supplierId, setSupplierId] = useState(dataEdit?.supplierId || "");
  const [tanggal, setTanggal] = useState(dataEdit?.tanggal ? new Date(dataEdit.tanggal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  
  const [keranjang, setKeranjang] = useState<DetailMasuk[]>(
    dataEdit 
      ? dataEdit.detailBarang.map(d => ({ barangId: d.barang.id, jumlah: d.jumlah })) 
      : [{ barangId: "", jumlah: 1 }]
  );

  const opsiSupplier = daftarSupplier.map((sup) => ({ value: sup.id, label: sup.namaPabrik }));
  const opsiBarang = daftarBarang.map((brg) => ({
    value: brg.id, label: `[${brg.kodeBarang}] ${brg.namaBarang} (Stok: ${brg.stokSekarang})`
  }));

  const ubahKeranjang = (index: number, field: keyof DetailMasuk, value: string | number) => {
    const isiBaru = [...keranjang];
    isiBaru[index] = { ...isiBaru[index], [field]: value };
    setKeranjang(isiBaru);
  };

  const hapusBaris = (index: number) => {
    const isiBaru = [...keranjang];
    isiBaru.splice(index, 1);
    setKeranjang(isiBaru);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const barangValid = keranjang.filter(k => k.barangId !== "" && Number(k.jumlah) > 0);
    if (barangValid.length === 0) return alert("Pilih minimal 1 barang valid!");
    if (!supplierId) return alert("Pilih pemasok!");

    try {
      const url = "/api/transaksi-masuk";
      const method = isEdit ? "PUT" : "POST";
      const payload = { id: dataEdit?.id, nomorNota, supplierId, tanggal, detailBarang: barangValid };

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(isEdit ? "✅ Perubahan nota berhasil disimpan!" : "✅ Transaksi Berhasil disimpan!");
        onSuccess();
      } else {
        alert("Gagal menyimpan transaksi.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in duration-200">
      
      {/* HEADER TAB FORM */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
          {isEdit ? <Eye size={20} className="text-blue-500"/> : <FileText size={20} className="text-blue-500"/>}
          {isEdit ? `Rincian / Edit Nota: ${dataEdit.nomorNota}` : "Form Penerimaan Baru"}
        </h2>
        
        {/* TOMBOL AKSI DI KANAN ATAS */}
        <div className="flex items-center gap-2">
          {isEdit && onDelete && dataEdit && (
            <button 
              type="button" 
              onClick={() => onDelete(dataEdit.id, dataEdit.nomorNota)} 
              className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200"
            >
              <Trash2 size={16}/> Hapus Nota
            </button>
          )}
          <button 
            type="button" 
            onClick={onClose} 
            className="text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <X size={16}/> Tutup Tab
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-600 mb-1">Tanggal</label>
            <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} 
            className="text-black w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-600 mb-1">No. Nota / Surat Jalan</label>
            <input type="text" required value={nomorNota} onChange={(e) => setNomorNota(e.target.value)} 
            className="text-black w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="INV-001" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-600 mb-1">Pemasok / Pabrik</label>
            <Select 
              options={opsiSupplier} value={opsiSupplier.find(opt => opt.value === supplierId) || null}
              onChange={(p) => setSupplierId(p?.value || "")} placeholder="Ketik nama pabrik..." isSearchable
              styles={{ control: (base) => ({ ...base, borderRadius: '0.5rem', borderColor: '#d1d5db', padding: '1px' }) }}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Rincian Barang Datang</h3>
          {keranjang.map((item, index) => (
            <div key={index} className="flex gap-4 mb-3 items-center">
              <div className="flex-[3]">
                <Select 
                  options={opsiBarang} value={opsiBarang.find(opt => opt.value === item.barangId) || null}
                  onChange={(p) => ubahKeranjang(index, "barangId", p?.value || "")} placeholder="Ketik/Cari nama barang plastik..." isSearchable
                  styles={{ control: (base) => ({ ...base, borderRadius: '0.5rem' }) }}
                />
              </div>
              <div className="flex-1">
                <input type="number" min="1" required value={item.jumlah} 
                onChange={(e) => ubahKeranjang(index, "jumlah", e.target.value ? Number(e.target.value) : "")} 
                className=" text-black w-full border border-gray-300 rounded-lg p-[9px] outline-none focus:border-blue-500" placeholder="Qty" />
              </div>
              <div className="w-10 flex justify-center">
                {index > 0 && (
                  <button type="button" onClick={() => hapusBaris(index)} 
                  className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={20}/></button>
                )}
              </div>
            </div>
          ))}
          <div className="mt-4">
            <button type="button" onClick={() => setKeranjang([...keranjang, { barangId: "", jumlah: 1 }])} 
            className="text-sm font-bold text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <Plus size={16}/> Tambah Baris
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors">
            Tutup
          </button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <CheckCircle size={18}/> {isEdit ? "Simpan Perubahan Nota" : "Simpan Transaksi"}
          </button>
        </div>
      </form>
    </div>
  );
};

// ==========================================
// KOMPONEN UTAMA: PENGELOLA TAB & HALAMAN
// ==========================================
export default function TransaksiMasukPage() {
  const [daftarSupplier, setDaftarSupplier] = useState<Supplier[]>([]);
  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [riwayatMasuk, setRiwayatMasuk] = useState<RiwayatMasuk[]>([]);
  const [loading, setLoading] = useState(true);

  const [tabs, setTabs] = useState<TabItem[]>([{ id: "riwayat", title: "Riwayat Penerimaan", type: "RIWAYAT" }]);
  const [activeTab, setActiveTab] = useState<string>("riwayat");

  const fetchData = async () => {
    try {
      const [resSup, resBar, resRiw] = await Promise.all([
        fetch("/api/supplier"), fetch("/api/barang"), fetch("/api/transaksi-masuk")
      ]);
      setDaftarSupplier(await resSup.json());
      setDaftarBarang(await resBar.json());
      setRiwayatMasuk(await resRiw.json());
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const bukaTabBaru = () => {
    const newId = `form-${Date.now()}`;
    const newTab: TabItem = { id: newId, title: "Penerimaan Baru", type: "FORM" };
    setTabs([...tabs, newTab]);
    setActiveTab(newId);
  };

  // Fungsi saat tombol "Buka" diklik dari tabel
  const bukaTabEdit = (riwayat: RiwayatMasuk) => {
    const existingTab = tabs.find(t => t.dataEdit?.id === riwayat.id);
    if (existingTab) {
      setActiveTab(existingTab.id);
      return;
    }
    const newId = `edit-${riwayat.id}`;
    const newTab: TabItem = { id: newId, title: `Nota: ${riwayat.nomorNota}`, type: "FORM", dataEdit: riwayat };
    setTabs([...tabs, newTab]);
    setActiveTab(newId);
  };

  const tutupTab = (idToClose: string) => {
    const newTabs = tabs.filter(t => t.id !== idToClose);
    setTabs(newTabs);
    if (activeTab === idToClose) setActiveTab("riwayat");
  };

  const handleTransaksiSukses = (tabId: string) => {
    fetchData(); 
    tutupTab(tabId); 
  };

  const klikHapus = async (id: string, nota: string) => {
    if (confirm(`PENGHAPUSAN PERMANEN\n\nApakah Anda yakin ingin menghapus transaksi nota ${nota}?\nStok barang yang terlanjur masuk dari nota ini akan ditarik (dikurangi) kembali secara otomatis.`)) {
      try {
        const res = await fetch(`/api/transaksi-masuk?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("Transaksi berhasil dihapus dan stok telah dikembalikan!");
          fetchData();
          tutupTab(`edit-${id}`); // Otomatis menutup tab edit jika sedang terbuka
        } else {
          alert("Gagal menghapus transaksi.");
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-8 max-w-8xl mx-auto bg-gray-50 min-h-screen">
      
      {/* HEADER & TAB BAR */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-6">Penerimaan Barang</h1>
        <div className="flex border-b border-gray-200 overflow-x-auto gap-1">
          {tabs.map((tab) => (
            <div 
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-5 py-3 cursor-pointer rounded-t-xl transition-all font-medium text-sm border-b-2
                ${activeTab === tab.id ? 'bg-white text-blue-600 border-blue-600 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]' : 'text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-100'}`}
            >
              {tab.type === "RIWAYAT" ? <List size={16} /> : <FileText size={16} />}
              {tab.title}
              {tab.type === "FORM" && (
                <button onClick={(e) => { e.stopPropagation(); tutupTab(tab.id); }} className="ml-2 p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={bukaTabBaru} className="flex items-center gap-1 px-4 py-3 ml-2 text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-t-xl transition-all">
            <Plus size={18} /> Transaksi Baru
          </button>
        </div>
      </div>

      <div className="relative">
        {/* KONTEN TAB RIWAYAT */}
        <div className={activeTab === "riwayat" ? "block animate-in fade-in duration-300" : "hidden"}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Daftar Nota Penerimaan</h2>
              <button onClick={fetchData} className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-blue-200">
                🔄 Segarkan Data
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">No. Nota</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Pemasok</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Item</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {loading ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">Memuat data...</td></tr> : 
                 riwayatMasuk.length === 0 ? <tr><td colSpan={5} 
                 className="text-center py-10 text-gray-400">Belum ada transaksi. Buka Tab "Transaksi Baru" untuk menambah.</td></tr> :
                 riwayatMasuk.map((riwayat) => (
                  <tr key={riwayat.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-black">{new Date(riwayat.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">{riwayat.nomorNota}</td>
                    <td className="px-6 py-4 text-gray-600">{riwayat.supplier?.namaPabrik || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-xs font-bold border border-blue-100">
                        {riwayat.detailBarang.length} Jenis
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* TOMBOL BUKA YANG LANGSUNG MENGARAH KE TAB EDIT/RINCIAN */}
                      <button 
                        onClick={() => bukaTabEdit(riwayat)} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                      >
                        <Eye size={16} /> Buka Nota
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RENDER KONTEN TAB FORM */}
        {tabs.filter(t => t.type === "FORM").map((tab) => (
          <div key={tab.id} className={activeTab === tab.id ? "block" : "hidden"}>
            <FormTransaksiTab 
              tabId={tab.id} dataEdit={tab.dataEdit} daftarSupplier={daftarSupplier} daftarBarang={daftarBarang}
              onSuccess={() => handleTransaksiSukses(tab.id)} onClose={() => tutupTab(tab.id)}
              onDelete={klikHapus} // Mengirimkan fungsi Hapus ke dalam komponen Form
            />
          </div>
        ))}
      </div>
    </div>
  );
}