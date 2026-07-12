"use client";

import { useEffect, useState } from "react";
import { Eye, ShieldAlert, Clock, User, FileText, ArrowRight, RefreshCw } from "lucide-react";

interface AuditLog {
  id: string;
  username: string;
  role: string;
  aksi: string;
  nomorNota: string;
  dataLama: string;
  dataBaru: string;
  tanggal: string;
}

// Definisikan tipe untuk item barang plastik di dalam JSON string
interface LogBarangItem {
  nama: string;
  qty: number;
}

interface LogSnapshot {
  barang?: LogBarangItem[];
  pesan?: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit-log");
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
      }
    } catch (error) {
      console.error("Gagal memuat log", error);
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // 📊 FUNGSI: Mengubah Teks JSON Menjadi Tabel Komparasi Berwarna
  const renderComparisonTable = (dataLamaStr: string, dataBaruStr: string) => {
    try {
      const lama = dataLamaStr ? (JSON.parse(dataLamaStr) as LogSnapshot) : null;
      const baru = dataBaruStr ? (JSON.parse(dataBaruStr) as LogSnapshot) : null;

      const barangLama: LogBarangItem[] = lama?.barang || [];
      const barangBaru: LogBarangItem[] = baru?.barang || [];

      const semuaNamaBarang = Array.from(
        new Set([
          ...barangLama.map((b) => b.nama),
          ...barangBaru.map((b) => b.nama),
        ])
      );

      const isDeleteAction = !baru || baru.pesan || barangBaru.length === 0;

      return (
        <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 font-bold border-b">
              <tr>
                <th className="px-5 py-3.5">Nama Item Plastik / Barang</th>
                <th className="px-5 py-3.5 text-center bg-red-50 text-red-800 font-bold">Qty Lama</th>
                <th className="px-5 py-3.5 text-center bg-emerald-50 text-emerald-800 font-bold">Qty Baru</th>
                <th className="px-5 py-3.5 text-center">Status Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {semuaNamaBarang.map((nama) => {
                const itemLama = barangLama.find((b) => b.nama === nama);
                const itemBaru = barangBaru.find((b) => b.nama === nama);

                const qtyLama = itemLama ? itemLama.qty : 0;
                const qtyBaru = isDeleteAction ? 0 : itemBaru ? itemBaru.qty : 0;
                const isChanged = qtyLama !== qtyBaru;

                return (
                  <tr 
                    key={nama} 
                    className={`transition-colors ${
                      isChanged 
                        ? isDeleteAction 
                          ? "bg-red-50/40 hover:bg-red-50" 
                          : "bg-amber-50/40 hover:bg-amber-50"
                        : "hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Nama Barang */}
                    <td className="px-5 py-4 font-bold text-gray-900 max-w-md truncate">
                      {nama}
                    </td>

                    {/* Qty Lama */}
                    <td className="px-5 py-4 text-center font-black text-red-600 bg-red-50/10 text-base">
                      {itemLama ? `${qtyLama} Pcs` : "-"}
                    </td>

                    {/* Qty Baru */}
                    <td className="px-5 py-4 text-center font-black text-emerald-600 bg-emerald-50/10 text-base">
                      {isDeleteAction ? (
                        <span className="text-red-500 line-through">0 Pcs</span>
                      ) : itemBaru ? (
                        `${qtyBaru} Pcs`
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Status Indikator Visual */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {isDeleteAction ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-700 border border-red-200">
                          DIHAPUS
                        </span>
                      ) : qtyLama > 0 && !itemBaru ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                          ITEM DILEPAS
                        </span>
                      ) : qtyLama === 0 && qtyBaru > 0 ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                          ITEM BARU
                        </span>
                      ) : isChanged ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-700 border border-amber-200 inline-flex items-center justify-center gap-1.5 mx-auto w-max">
                          {qtyLama} <ArrowRight size={12} /> {qtyBaru}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-400">
                          Tidak Berubah
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    } catch {
      // Memperbaiki: Menghapus variabel 'e' yang dideklarasikan tetapi tidak pernah digunakan
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 shadow-sm">
            <p className="font-bold uppercase mb-1.5 text-[10px] tracking-wider">Kondisi Sebelum Perubahan:</p>
            <div className="break-all whitespace-pre-wrap">{dataLamaStr || "Data Kosong"}</div>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 shadow-sm">
            <p className="font-bold uppercase mb-1.5 text-[10px] tracking-wider">Kondisi Sesudah Perubahan:</p>
            <div className="break-all whitespace-pre-wrap">{dataBaruStr || "Data Kosong"}</div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-500 bg-gray-50">
        <Clock className="w-10 h-10 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-bold tracking-wide text-gray-600">Membaca berkas forensik digital audit log...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-none w-full px-4 md:px-12 bg-gray-50 min-h-screen">
      
      {/* Header Halaman */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="text-amber-500 w-8 h-8" /> Kendali Keamanan & Audit Log Forensik
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            Sistem Digital Forensik Penjualan Toko Plastik Jaya — Rekaman jejak mutasi manipulasi data database (Anti-Fraud).
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800 font-bold max-w-xs shadow-sm">
            🛡️ Pengawas Aktif: Seluruh operasi edit dan hapus nota terekam permanen.
          </div>
          <button onClick={fetchLogs} className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-4 rounded-lg transition-all text-sm flex items-center gap-2 shadow-sm">
            <RefreshCw size={16} /> Segarkan Log
          </button>
        </div>
      </div>

      {/* Tabel Log Utama */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="p-5 border-b border-gray-100 bg-white">
          <h2 className="text-lg font-bold text-gray-800">Daftar Rekaman Aktivitas Manipulasi Data</h2>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-left text-gray-500 min-w-full">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 font-bold border-b">
              <tr>
                <th className="px-6 py-4">Waktu Kejadian</th>
                <th className="px-6 py-4">Pelaku (Aktor)</th>
                <th className="px-6 py-4">Aksi Operasi</th>
                <th className="px-6 py-4">No. Nota Terkait</th>
                <th className="px-6 py-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="text-3xl">🛡️</span>
                      <p className="text-base font-bold text-gray-500">Log System Bersih</p>
                      <p className="text-xs text-gray-400 max-w-xs">Belum ada aktivitas modifikasi atau penghapusan data penjualan yang terdeteksi.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900 font-bold">
                      {new Date(log.tanggal).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-900 text-sm max-w-[150px] truncate">{log.username}</div>
                          <div className="text-[10px] text-gray-400 font-bold font-mono tracking-wider uppercase mt-0.5">{log.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wide border ${
                          log.aksi.includes("DELETE")
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {log.aksi}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-black text-gray-800">
                      {log.nomorNota || "DATA_MASTER"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                      >
                        <Eye size={14} /> Lihat Rincian Data
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🖥️ MODAL POP-UP TIMELINE KOMPARASI FORENSIK DIGITAL        */}
      {/* ========================================================= */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col transform transition-all animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">Analisis Komparasi Mutasi Riwayat Barang</h3>
                  <p className="text-xs text-gray-500 font-black font-mono mt-0.5">Nomor Referensi Nota: {selectedLog.nomorNota || "DATA_MASTER"}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-red-600 p-2 hover:bg-gray-100 rounded-lg transition-colors font-bold text-xs border border-transparent hover:border-gray-200"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Metadata Operator */}
            <div className="p-4 bg-amber-50/40 border-b border-gray-100 px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-gray-700">
              <p>🕒 <span className="text-gray-400 font-medium">Waktu Eksekusi:</span> <span className="text-gray-900">{new Date(selectedLog.tanggal).toLocaleString("id-ID")}</span></p>
              <p>👤 <span className="text-gray-400 font-medium">Akun Operator:</span> <span className="text-gray-900">{selectedLog.username} ({selectedLog.role})</span></p>
              <p>⚡ <span className="text-gray-400 font-medium">Jenis Operasi:</span> <span className="text-red-600 font-black">{selectedLog.aksi}</span></p>
            </div>

            {/* Main Content Area */}
            <div className="p-6 overflow-y-auto bg-white flex-1">
              <div className="mb-3 text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                📋 Hasil Audit Diferensial Kuantitas Item:
              </div>
              {renderComparisonTable(selectedLog.dataLama, selectedLog.dataBaru)}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 text-xs font-bold bg-gray-900 hover:bg-gray-900/90 text-white rounded-xl transition-all shadow-md active:scale-95"
              >
                Selesai Memeriksa Berkas
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}