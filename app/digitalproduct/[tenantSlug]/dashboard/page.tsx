import AppNavbar from "@/components/AppNavbar";

export default function DigitalProductDashboardPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
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
            KiraServe Digital Product
          </p>

          <h1 className="mt-5 text-6xl font-black tracking-[-0.06em]">
            Digital Product Dashboard
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">
            Store slug: <b>{params.tenantSlug}</b>
          </p>

          <div className="mt-10 rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/60">
            <h2 className="text-3xl font-black tracking-[-0.05em]">
              Placeholder Module
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500">
              Modul digital product nanti digunakan untuk landing page, produk
              digital, checkout Midtrans, auto delivery, analytics, dan custom
              HTML page.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
