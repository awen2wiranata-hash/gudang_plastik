"use client";

import { useEffect, useState } from "react";
import Select, { StylesConfig } from "react-select";
import { Eye, Trash2, X, Plus, List, FileText, CheckCircle, Upload, AlertCircle } from "lucide-react";
import * as xlsx from "xlsx";

type Customer = { id: string; nama: string };
type Barang = { id: string; namaBarang: string; kodeBarang: string; stokSekarang: number};
type DetailKeluar = { barangId: string; jumlah: number | "" };
type RiwayatKeluar = {
  id: string; nomorNota: string; tanggal: string; customerId: string;
  customer: { nama: string };
  detailBarang: { jumlah: number; barang: { id: string; namaBarang: string; kodeBarang: string } }[];
};
type TabItem = {
  id: string; title: string; type: "RIWAYAT" | "FORM"; dataEdit?: RiwayatKeluar;
};

// --- TAMBAHAN TIPE UNTUK MENGHILANGKAN ERROR 'ANY' ---
type SelectOption = { value: string; label: string };

interface ExcelRow {
  "Nama Barang"?: string;
  "Jumlah"?: number | string;
  "Qty"?: number | string;
  "QTY"?: number | string;
  "Quantity"?: number | string;
}

// 🎨 GAYA KUSTOM UNTUK DROP-DOWN REACT-SELECT AGAR HITAM PEKAT & KONTRAS TINGGI
const customSelectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#2563eb" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px #2563eb" : "none",
    padding: "2px",
    backgroundColor: "#ffffff",
    "&:hover": {
      borderColor: "#9ca3af"
    }
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? "#2563eb" 
      : state.isFocused 
        ? "#f3f4f6" 
        : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#111827", // Huruf pilihan hitam pekat (#111827)
    fontWeight: state.isSelected ? "700" : "500",
    padding: "10px 12px",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "#3b82f6"
    }
  }),
  singleValue: (base) => ({
    ...base,
    color: "#111827", // Huruf item terpilih hitam pekat
    fontWeight: "600",
    fontSize: "0.875rem"
  }),
  placeholder: (base) => ({
    ...base,
    color: "#9ca3af",
    fontSize: "0.875rem"
  }),
  input: (base) => ({
    ...base,
    color: "#111827"
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    border: "1px solid #e5e7eb"
  })
};

const FormTransaksiTab = ({ 
   dataEdit, daftarCustomer, daftarBarang, onSuccess, onClose, onDelete 
}: { 
  tabId: string, dataEdit?: RiwayatKeluar, daftarCustomer: Customer[], daftarBarang: Barang[], 
  onSuccess: () => void, onClose: () => void, onDelete?: (id: string, nota: string) => void 
}) => {
  const isEdit = !!dataEdit;
  const [nomorNota, setNomorNota] = useState(dataEdit?.nomorNota || "");
  const [customerId, setCustomerId] = useState(dataEdit?.customerId || "");
  const [tanggal, setTanggal] = useState(dataEdit?.tanggal ? new Date(dataEdit.tanggal).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  
  const [keranjang, setKeranjang] = useState<DetailKeluar[]>(
    dataEdit 
      ? dataEdit.detailBarang.map(d => ({ barangId: d.barang.id, jumlah: d.jumlah })) 
      : [{ barangId: "", jumlah: 1 }]
  );

  const [barangTidakKetemu, setBarangTidakKetemu] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const opsiCustomer: SelectOption[] = daftarCustomer.map((sup) => ({ value: sup.id, label: sup.nama }));
  const opsiBarang: SelectOption[] = daftarBarang.map((brg) => ({
    value: brg.id, label: `[${brg.kodeBarang}] ${brg.namaBarang} (Sisa Stok: ${brg.stokSekarang} Pcs)`
  }));

  const ubahKeranjang = (index: number, field: keyof DetailKeluar, value: string | number) => {
    const isiBaru = [...keranjang];
    isiBaru[index] = { ...isiBaru[index], [field]: value } as DetailKeluar;
    setKeranjang(isiBaru);
  };

  const hapusBaris = (index: number) => {
    const isiBaru = [...keranjang];
    isiBaru.splice(index, 1);
    setKeranjang(isiBaru);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setBarangTidakKetemu([]);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        if (!bstr) return;
        
        const workbook = xlsx.read(bstr, { type: "binary" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const dataExcel = xlsx.utils.sheet_to_json<ExcelRow>(worksheet);

        const newKeranjang: DetailKeluar[] = [];
        const notFound: string[] = [];

        dataExcel.forEach((row) => {
          const namaDariExcel = String(row["Nama Barang"] || "").trim();
          const rawQty = row["Jumlah"] ?? row["Qty"] ?? row["QTY"] ?? row["Quantity"] ?? "1";
          const qtyDariExcel = parseInt(String(rawQty).trim(), 10) || 1;

          if (!namaDariExcel) return;

          const matchedBarang = daftarBarang.find(
            (b) => b.namaBarang.toLowerCase() === namaDariExcel.toLowerCase()
          );

          if (matchedBarang) {
            newKeranjang.push({ barangId: matchedBarang.id, jumlah: qtyDariExcel });
          } else {
            notFound.push(namaDariExcel);
          }
        });

        if (newKeranjang.length > 0) {
          if (keranjang.length === 1 && keranjang[0].barangId === "") {
            setKeranjang(newKeranjang);
          } else {
            setKeranjang([...keranjang, ...newKeranjang]);
          }
        }

        if (notFound.length > 0) {
          setBarangTidakKetemu(notFound);
        }

      } catch {
        alert("Gagal membaca file excel. Pastikan format kolom benar.");
      } finally {
        setIsImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const barangValid = keranjang.filter(k => k.barangId !== "" && Number(k.jumlah) > 0);
    if (barangValid.length === 0) return alert("Pilih minimal 1 barang valid!");
    if (!customerId) return alert("Pilih customer!");

    try {
      const url = "/api/transaksi-keluar";
      const method = isEdit ? "PUT" : "POST";
      const payload = { id: dataEdit?.id, nomorNota, customerId, tanggal, detailBarang: barangValid };

      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(isEdit ? "✅ Perubahan nota berhasil disimpan!" : "✅ Transaksi Berhasil disimpan!");
        onSuccess();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Gagal menyimpan transaksi.");
      }
    } catch {
      console.error("Terjadi kesalahan pada sistem.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in duration-200 w-full">
      
      {/* HEADER TAB FORM */}
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
          {isEdit ? <Eye size={20} className="text-blue-500"/> : <FileText size={20} className="text-blue-500"/>}
          {isEdit ? `Rincian / Edit Nota: ${dataEdit.nomorNota}` : "Form Transaksi Keluar Baru"}
        </h2>
        
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
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Tanggal Transaksi</label>
            <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} 
            className="text-gray-900 font-medium w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2.5 outline-none bg-white" />
          </div>
          
          <div className="md:col-span-1">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              No. Nota / Surat Jalan <span className="text-xs font-normal text-gray-400">(Otomatis jika kosong)</span>
            </label>
            <input 
              type="text" 
              value={nomorNota} 
              onChange={(e) => setNomorNota(e.target.value)} 
              className="text-gray-900 font-medium w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2.5 outline-none placeholder:text-gray-400 bg-white" 
              placeholder="Otomatis (Atau isi Kustom...)" 
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Pilih Pelanggan (Customer)</label>
            <Select 
              options={opsiCustomer} value={opsiCustomer.find(opt => opt.value === customerId) || null}
              onChange={(p) => setCustomerId(p?.value || "")} placeholder="Ketik atau cari nama customer..." isSearchable
              styles={customSelectStyles}
            />
          </div>
        </div>
        
        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Rincian Keranjang Barang Keluar</h3>
            
            <label className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
              <Upload size={14} />
              {isImporting ? "Membaca..." : "Import Pesanan (Excel)"}
              <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
            </label>
          </div>

          {barangTidakKetemu.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <div className="flex items-center gap-1.5 font-bold mb-1"><AlertCircle size={16}/> Beberapa barang di Excel tidak ditemukan di Database:</div>
              <ul className="list-disc list-inside text-xs font-mono font-bold">
                {barangTidakKetemu.map((nm, idx) => <li key={idx}>{nm}</li>)}
              </ul>
              <p className="text-xs mt-2 italic">*Barang lainnya yang cocok sudah dimasukkan ke form di bawah.</p>
            </div>
          )}

          <div className="hidden md:flex gap-4 mb-2 items-center px-1">
            <div className="flex-[3]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pilih Produk Plastik</label>
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jumlah Keluar (Qty)</label>
            </div>
            <div className="w-10 text-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</label>
            </div>
          </div>

          {keranjang.map((item, index) => (
            <div key={index} className="flex gap-4 mb-3 items-center w-full">
              <div className="flex-[3]">
                <Select 
                  options={opsiBarang} value={opsiBarang.find(opt => opt.value === item.barangId) || null}
                  onChange={(p) => ubahKeranjang(index, "barangId", p?.value || "")} placeholder="Ketik atau cari nama barang plastik..." isSearchable
                  styles={customSelectStyles}
                />
              </div>
              <div className="flex-1">
                <input type="number" min="1" required value={item.jumlah} 
                onChange={(e) => ubahKeranjang(index, "jumlah", e.target.value ? Number(e.target.value) : "")} 
                className="text-gray-900 font-bold w-full border border-gray-300 rounded-lg p-[9px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white placeholder:text-gray-400" placeholder="Qty" />
              </div>
              <div className="w-10 flex justify-center">
                {index > 0 && (
                  <button type="button" onClick={() => hapusBaris(index)} 
                  className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors border border-transparent hover:border-red-200"><Trash2 size={20}/></button>
                )}
              </div>
            </div>
          ))}
          <div className="mt-4">
            <button type="button" onClick={() => setKeranjang([...keranjang, { barangId: "", jumlah: 1 }])} 
            className="text-sm font-bold text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-blue-200">
              <Plus size={16}/> Tambah Baris Transaksi Manual
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors">
            Tutup Form
          </button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors flex items-center gap-2 shadow-blue-100">
            <CheckCircle size={18}/> {isEdit ? "Simpan Perubahan Nota" : "Simpan Transaksi Keluar"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function TransaksiKeluarPage() {
  const [daftarCustomer, setDaftarCustomer] = useState<Customer[]>([]);
  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [riwayatKeluar, setRiwayatKeluar] = useState<RiwayatKeluar[]>([]);
  const [loading, setLoading] = useState(true);

  const [tabs, setTabs] = useState<TabItem[]>([{ id: "riwayat", title: "Riwayat Keluar", type: "RIWAYAT" }]);
  const [activeTab, setActiveTab] = useState<string>("riwayat");

  const fetchData = async () => {
    try {
      const [resSup, resBar, resRiw] = await Promise.all([
        fetch("/api/customer"), fetch("/api/barang?activeOnly=true"), fetch("/api/transaksi-keluar")
      ]);
      setDaftarCustomer(await resSup.json());
      setDaftarBarang(await resBar.json());
      setRiwayatKeluar(await resRiw.json());
    } catch {
      console.error("Gagal mengambil data dari server");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { fetchData(); }, []);
  
  const bukaTabBaru = () => {
    const newId = `form-${Date.now()}`;
    const newTab: TabItem = { id: newId, title: "Transaksi Baru", type: "FORM" };
    setTabs([...tabs, newTab]);
    setActiveTab(newId);
  };

  const bukaTabEdit = (riwayat: RiwayatKeluar) => {
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
    if (confirm(`PENGHAPUSAN PERMANEN\n\nApakah Anda yakin ingin menghapus transaksi nota ${nota}?\nStok barang yang terlanjur keluar dari nota ini akan ditarik (dikurangi) kembali secara otomatis.`)) {
      try {
        const res = await fetch(`/api/transaksi-keluar?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("Transaksi berhasil dihapus dan stok telah dikembalikan!");
          fetchData();
          tutupTab(`edit-${id}`);
        } else {
          alert("Gagal menghapus transaksi.");
        }
      } catch {
        console.error("Kesalahan jaringan saat menghapus data.");
      }
    }
  };

  return (
    <div className="p-8 max-w-none w-full px-4 md:px-12 bg-gray-50 min-h-screen">
      
      {/* HEADER & TAB BAR */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-6">Transaksi Barang Keluar</h1>
        <div className="flex border-b border-gray-200 overflow-x-auto gap-1">
          {tabs.map((tab) => (
            <div 
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-2 px-5 py-3 cursor-pointer rounded-t-xl transition-all font-semibold text-sm border-b-2
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

      <div className="relative w-full">
        {/* KONTEN TAB RIWAYAT */}
        <div className={activeTab === "riwayat" ? "block animate-in fade-in duration-300 w-full" : "hidden"}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
            <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Daftar Nota Barang Keluar</h2>
              <button onClick={fetchData} className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-blue-200">
                🔄 Refresh
              </button>
            </div>
            
            <div className="overflow-x-auto w-full">
              <table className="min-w-full divide-y divide-gray-100 w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">No. Nota</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total Item</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50 text-sm font-medium text-gray-700">
                  {loading ? <tr><td colSpan={5} className="text-center py-10 text-gray-400 font-bold">Sedang memuat data transaksi...</td></tr> : 
                   riwayatKeluar.length === 0 ? <tr><td colSpan={5} 
                   className="text-center py-10 text-gray-400 font-bold">Belum ada transaksi. Buka Tab Transaksi Baru untuk menambah.</td></tr> :
                   riwayatKeluar.map((riwayat) => (
                    <tr key={riwayat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{new Date(riwayat.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-gray-800">{riwayat.nomorNota}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-bold">{riwayat.customer?.nama || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="bg-blue-50 text-blue-700 py-1.5 px-3 rounded-full text-xs font-black border border-blue-100 shadow-sm">
                          {riwayat.detailBarang.length} Jenis
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => bukaTabEdit(riwayat)} 
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                        >
                          <Eye size={14} /> Buka Nota
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RENDER KONTEN TAB FORM */}
        {tabs.filter(t => t.type === "FORM").map((tab) => (
          <div key={tab.id} className={activeTab === tab.id ? "block w-full" : "hidden"}>
            <FormTransaksiTab 
              tabId={tab.id} dataEdit={tab.dataEdit} daftarCustomer={daftarCustomer} daftarBarang={daftarBarang}
              onSuccess={() => handleTransaksiSukses(tab.id)} onClose={() => tutupTab(tab.id)}
              onDelete={klikHapus} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}