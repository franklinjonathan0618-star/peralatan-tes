
import React from 'react';
import { Link } from 'react-router-dom';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-lg font-bold text-primary">Divisi Peralatan<br />Cabang Papua</span>
              </Link>
            </div>
            <Link to="/login" className="btn-primary">
              Masuk
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-radial from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-20 animate-slide-up">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
                Sistem Manajemen Perawatan Alat Berat
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Solusi modern untuk mengelola, memantau, dan menjaga kinerja alat berat Anda secara efisien.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-xl font-semibold mb-3">Inventarisasi Alat</h3>
                <p className="text-muted-foreground mb-4">
                  Kelola semua data alat berat secara terstruktur dan mudah diakses.
                </p>
              </div>

              <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h3 className="text-xl font-semibold mb-3">Pengelolaan Stock</h3>
                <p className="text-muted-foreground mb-4">
                  Pantau BBM, oli, dan sparepart dengan sistem otomatis.
                </p>
              </div>

              <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <h3 className="text-xl font-semibold mb-3">Riwayat Perbaikan</h3>
                <p className="text-muted-foreground mb-4">
                  Rekam semua aktivitas perbaikan untuk analisis dan perencanaan.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link to="/login" className="btn-primary inline-flex items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
                Mulai Sekarang
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
                Fitur Utama
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Aplikasi lengkap untuk mengelola semua aspek perawatan alat berat Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 border rounded-lg hover:shadow-md transition-all">
                <h3 className="text-lg font-medium mb-2">Data Alat Berat</h3>
                <p className="text-muted-foreground text-sm">
                  Catat semua informasi penting tentang alat berat, mulai dari nomor lambung hingga nilai habis pakai.
                </p>
              </div>

              <div className="p-6 border rounded-lg hover:shadow-md transition-all">
                <h3 className="text-lg font-medium mb-2">Stock BBM</h3>
                <p className="text-muted-foreground text-sm">
                  Kelola pembelian dan penggunaan BBM dengan pencatatan detail untuk setiap transaksi.
                </p>
              </div>

              <div className="p-6 border rounded-lg hover:shadow-md transition-all">
                <h3 className="text-lg font-medium mb-2">Stock Oli</h3>
                <p className="text-muted-foreground text-sm">
                  Pantau persediaan oli dan penggunaannya untuk memastikan perawatan optimal.
                </p>
              </div>

              <div className="p-6 border rounded-lg hover:shadow-md transition-all">
                <h3 className="text-lg font-medium mb-2">Stock Sparepart</h3>
                <p className="text-muted-foreground text-sm">
                  Kelola inventaris sparepart dan lacak penggunaannya pada setiap alat.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cabang Papua. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
