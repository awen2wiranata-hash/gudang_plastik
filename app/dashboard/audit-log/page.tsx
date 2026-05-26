"use client";

import { useEffect, useState } from "react";
import { Eye, ShieldAlert, Clock, User, FileText, ArrowRight } from "lucide-react";

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

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/audit-log");
        const json = await res.json();
        if (json.success) {
          setLogs(json.data);
        }
      } catch (error) {
        console.error("Gagal memuat log", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  // 📊 FUNGSI BARU: Mengubah Teks JSON Menjadi Tabel Komparasi Berwarna
  const renderComparisonTable = (dataLamaStr: string, dataBaruStr: string) => {
    try {
      const lama = dataLamaStr ? JSON.parse(dataLamaStr) : null;
      const baru = dataBaruStr ? JSON.parse(dataBaruStr) : null;

      // Ambil daftar barang dari kondisi lama dan baru
      const barangLama: any[] = lama?.barang || [];
      const barangBaru: any[] = baru?.barang || [];

      // Kumpulkan semua nama unik barang yang terlibat agar tidak ada yang terlewat
      const semuaNamaBarang = Array.from(
        new Set([
          ...barangLama.map((b) => b.nama),
          ...barangBaru.map((b) => b.nama),
        ])
      );

      // Jika ini adalah aksi DELETE permanen, tandai semua barang sebagai terhapus
      const isDeleteAction = !baru || baru.pesan || barangBaru.length === 0;

      return (
        <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 font-bold border-b">
              <tr>
                <th className="px-4 py-3">Nama Item Plastik / Barang</th>
                <th className="px-4 py-3 text-center bg-red-50 text-red-700">Qty Lama</th>
                <th className="px-4 py-3 text-center bg-emerald-50 text-emerald-700">Qty Baru</th>
                <th className="px-4 py-3 text-center">Status Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {semuaNamaBarang.map((nama) => {
                const itemLama = barangLama.find((b) => b.nama === nama);
                const itemBaru = barangBaru.find((b) => b.nama === nama);

                const qtyLama = itemLama ? itemLama.qty : 0;
                // Jika aksi delete, qty baru dianggap menjadi 0
                const qtyBaru = isDeleteAction ? 0 : itemBaru ? itemBaru.qty : 0;

                // Cek apakah terjadi perubahan kuantitas stok barang
                const isChanged = qtyLama !== qtyBaru;

                return (
                  <tr 
                    key={nama} 
                    className={`transition-colors ${
                      isChanged 
                        ? isDeleteAction 
                          ? "bg-red-50/50 hover:bg-red-50" 
                          : "bg-amber-50/40 hover:bg-amber-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Nama Barang */}
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {nama}
                    </td>

                    {/* Qty Lama */}
                    <td className="px-4 py-3 text-center font-bold text-red-600 bg-red-50/30">
                      {itemLama ? qtyLama : "-"}
                    </td>

                    {/* Qty Baru */}
                    <td className="px-4 py-3 text-center font-bold text-emerald-600 bg-emerald-50/30">
                      {isDeleteAction ? (
                        <span className="text-red-500 line-through">0</span>
                      ) : itemBaru ? (
                        qtyBaru
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* Status Indikator Visual */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isDeleteAction ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                          DIHAPUS
                        </span>
                      ) : qtyLama > 0 && !itemBaru ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                          ITEM DILEPAS
                        </span>
                      ) : qtyLama === 0 && qtyBaru > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                          ITEM BARU
                        </span>
                      ) : isChanged ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center gap-1 mx-auto w-max">
                          {qtyLama} <ArrowRight size={12} /> {qtyBaru}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-400">
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
    } catch (e) {
      // Jalur cadangan jika data bukan format transaksi (misal log master data string biasa)
      return (
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700">
            <p className="font-bold uppercase mb-1 text-[10px]">Sebelum:</p>
            {dataLamaStr || "-"}
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700">
            <p className="font-bold uppercase mb-1 text-[10px]">Sesudah:</p>
            {dataBaruStr || "-"}
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 animate-pulse">
        <Clock className="w-8 h-8 text-amber-500 animate-spin mb-2" />
        <p className="text-sm font-medium">Memuat rekaman digital forensik...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-amber-600" /> Sistem Kendali Audit Log (Anti-Fraud)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Menampilkan ringkasan riwayat manipulasi data secara permanen untuk keperluan forensik digital.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-800 font-medium max-w-xs">
          ⚠️ Mode Monitor Aktif: Seluruh tindakan edit & hapus terekam otomatis oleh sistem.
        </div>
      </div>

      {/* Tabel Log Utama */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Waktu Kejadian</th>
                <th className="px-6 py-4">Pelaku (Aktor)</th>
                <th className="px-6 py-4">Aksi Sistem</th>
                <th className="px-6 py-4">No. Nota</th>
                <th className="px-6 py-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-2xl">🛡️</span>
                      <p className="text-sm font-medium">Sistem Aman: Belum ada jejak manipulasi data terdeteksi.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-medium">
                      {new Date(log.tanggal).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                          <User size={14} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-800 text-xs max-w-[120px] truncate">{log.username}</div>
                          <div className="text-[10px] text-gray-400 font-mono tracking-wider">{log.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                          log.aksi.includes("DELETE")
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {log.aksi}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-gray-700">
                      {log.nomorNota || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all shadow-sm"
                      >
                        <Eye size={14} />
                        Lihat Rincian Data
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* 🖥️ MODAL POP-UP TABEL KOMPARASI VISUAL       */}
      {/* ========================================== */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Hasil Analisis Komparasi Data Barang</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">Nomor Nota Transaksi: {selectedLog.nomorNota || "-"}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-200 rounded-lg transition-colors font-bold text-xs"
              >
                ✕ TUTUP
              </button>
            </div>

            {/* Metadata Ringkas Pelaku */}
            <div className="p-4 bg-amber-50/50 border-b border-gray-100 px-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-medium text-gray-700">
              <p>🕒 <span className="text-gray-400">Waktu:</span> {new Date(selectedLog.tanggal).toLocaleString("id-ID")}</p>
              <p>👤 <span className="text-gray-400">Aktor:</span> {selectedLog.username} ({selectedLog.role})</p>
              <p>⚡ <span className="text-gray-400">Operasi:</span> <span className="font-bold text-amber-700">{selectedLog.aksi}</span></p>
            </div>

            {/* Main Body: Tempat Tabel Perbandingan Baru Menggantikan JSON Teks */}
            <div className="p-6 overflow-y-auto bg-white flex-1">
              <div className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                📋 Laporan Perubahan Item Transaksi:
              </div>
              {renderComparisonTable(selectedLog.dataLama, selectedLog.dataBaru)}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 text-xs font-bold bg-gray-800 hover:bg-gray-900 text-white rounded-xl transition-all shadow-md"
              >
                Selesai Memeriksa
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}