import AppNavbar from "@/components/AppNavbar";

export default function BusinessDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppNavbar />

      <section className="px-8 py-20 md:px-14">
        <div className="mx-auto max-w-[1200px]">
          <a
            href="/dashboard"
            className="text-xs font-black uppercase tracking-[0.22em] text-slate-400 hover:text-blue-600"
          >
            ← Central Dashboard
          </a>

          <p className="mt-12 text-xs font-black uppercase tracking-[0.28em] text-blue-600">
            KiraServe Business
          </p>

          <h1 className="mt-5 text-6xl font-black tracking-[-0.06em]">
            Business Dashboard
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">
            Modul business akan digunakan untuk inventory, invoice, purchase order,
            dan tagihan UMKM.
          </p>
        </div>
      </section>
    </main>
  );
}
