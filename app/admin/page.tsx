import AppNavbar from "@/components/AppNavbar";

const stats = [
  {
    label: "Church Tenants",
    value: "1",
    desc: "Gereja yang sudah terdaftar di KiraServe.",
  },
  {
    label: "Platform Admin",
    value: "1",
    desc: "Admin utama yang mengatur tenant.",
  },
  {
    label: "Church Admin",
    value: "1",
    desc: "Admin gereja yang sudah diberi akses.",
  },
  {
    label: "Invite Codes",
    value: "Soon",
    desc: "Kode join untuk onboarding member.",
  },
];

const quickActions = [
  {
    title: "Create Church",
    desc: "Buat tenant gereja baru dan assign Church Admin pertama.",
    href: "/admin/churches/new",
    label: "Create",
  },
  {
    title: "Manage Churches",
    desc: "Lihat daftar gereja yang sudah terdaftar di KiraServe.",
    href: "/admin/churches",
    label: "Open",
  },
  {
    title: "Manage Users",
    desc: "Lihat user, profile, dan role yang terhubung ke platform.",
    href: "/admin/users",
    label: "Open",
  },
  {
    title: "Church Dashboard",
    desc: "Masuk ke dashboard gereja untuk cek divisi dan jadwal.",
    href: "/dashboard",
    label: "Open",
  },
];

const roadmap = [
  {
    title: "Tenant Gereja",
    desc: "Super Admin membuat gereja baru di KiraServe.",
  },
  {
    title: "Church Admin",
    desc: "Super Admin memberi akses admin pertama untuk gereja.",
  },
  {
    title: "Divisi",
    desc: "Church Admin membuat divisi pelayanan seperti Production, Worship, Kids, dan lainnya.",
  },
  {
    title: "Koordinator",
    desc: "Church Admin dapat assign koordinator secara manual atau melalui join code.",
  },
  {
    title: "Servant",
    desc: "Pelayan dapat login, join memakai kode, lalu melihat jadwal pelayanan.",
  },
];

const recentTenants = [
  {
    name: "GSJS Pakuwon Mall",
    slug: "gsjs",
    admin: "gsjschurchsites@gmail.com",
    status: "Active",
  },
];

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar isPlatformAdmin />

      <section className="relative overflow-hidden px-8 pb-24 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
        <div className="absolute -left-[10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[8%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
                KiraServe Admin
              </p>

              <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
                Platform control center.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
                Dashboard khusus Super Admin KiraServe untuk membuat tenant
                gereja, memberi akses Church Admin, dan mengatur struktur awal
                platform.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <p className="text-sm font-bold text-blue-100/70">
                Quick Setup
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">
                Tambah gereja baru
              </h2>

              <p className="mt-3 text-sm leading-6 text-blue-100/60">
                Buat tenant gereja, tentukan slug, lalu assign email pertama
                sebagai Church Admin.
              </p>

              <a
                href="/admin/churches/new"
                className="mt-6 inline-flex w-full justify-center rounded-full bg-white px-6 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-blue-100"
              >
                Create Church →
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-14 rounded-t-[3rem] bg-slate-50 px-8 py-14 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                desc={item.desc}
              />
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
              <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                    Quick Actions
                  </p>

                  <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                    Manage Platform
                  </h2>
                </div>

                <a
                  href="/admin/churches"
                  className="w-fit rounded-full border border-slate-200 px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
                >
                  View Churches
                </a>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {quickActions.map((item) => (
                  <QuickActionCard key={item.title} item={item} />
                ))}
              </div>
            </section>

            <section className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
              <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                  Recent Tenants
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                  Gereja Terdaftar
                </h2>
              </div>

              <div className="grid gap-4">
                {recentTenants.map((church) => (
                  <div
                    key={church.slug}
                    className="rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-black tracking-[-0.04em] text-slate-900">
                          {church.name}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          /{church.slug}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-emerald-600">
                        {church.status}
                      </span>
                    </div>

                    <div className="mt-5 rounded-2xl bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                        Church Admin
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-600">
                        {church.admin}
                      </p>
                    </div>

                    <a
                      href="/admin/churches"
                      className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.14em] text-blue-600"
                    >
                      Manage Tenant →
                    </a>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-xl shadow-slate-200/60">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-300">
                Free Platform
              </p>

              <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em]">
                KiraServe dibuat gratis untuk gereja.
              </h2>

              <p className="mt-5 text-base leading-7 text-white/55">
                Untuk versi awal, KiraServe tidak memakai plan atau billing.
                Pengembangan platform dapat didukung melalui donasi developer.
              </p>

              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex rounded-full bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.14em] text-slate-900 transition hover:bg-blue-100"
              >
                Support Developer →
              </a>

              <p className="mt-4 text-xs leading-6 text-white/35">
                Nanti link ini bisa diganti ke Socialbuzz.
              </p>
            </section>

            <section className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/60">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                Product Flow
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-900">
                Alur otorisasi platform
              </h2>

              <div className="mt-8 grid gap-4">
                {roadmap.map((item, index) => (
                  <FlowRow
                    key={item.title}
                    number={String(index + 1).padStart(2, "0")}
                    title={item.title}
                    desc={item.desc}
                  />
                ))}
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-[2.5rem] border border-blue-100 bg-blue-50 p-8">
            <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                  Next Feature
                </p>

                <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-900">
                  Invite Code System
                </h2>
              </div>

              <p className="text-base font-bold leading-8 text-blue-700">
                User bisa login sendiri. Kalau belum tergabung ke gereja mana
                pun, user masuk ke halaman join code. Church Admin atau
                Koordinator bisa generate kode untuk servant/member dalam
                periode tertentu, sehingga tidak perlu assign satu per satu.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  desc,
}: {
  label: string;
  value: string;
  desc: string;
}) {
  return (
    <article className="rounded-[2rem] bg-white p-7 shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
        {label}
      </p>

      <p className="mt-5 text-5xl font-black tracking-[-0.06em] text-slate-900">
        {value}
      </p>

      <p className="mt-4 text-sm leading-6 text-slate-500">{desc}</p>
    </article>
  );
}

function QuickActionCard({
  item,
}: {
  item: {
    title: string;
    desc: string;
    href: string;
    label: string;
  };
}) {
  return (
    <a
      href={item.href}
      className="group rounded-[2rem] border border-slate-100 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-900/10"
    >
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
        →
      </div>

      <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-900">
        {item.title}
      </h3>

      <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">
        {item.desc}
      </p>

      <p className="mt-6 text-xs font-black uppercase tracking-[0.14em] text-blue-600">
        {item.label} →
      </p>
    </a>
  );
}

function FlowRow({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5 md:grid-cols-[80px_1fr] md:items-center">
      <p className="text-3xl font-black tracking-[-0.06em] text-blue-600">
        {number}
      </p>

      <div>
        <h3 className="text-xl font-black tracking-[-0.04em] text-slate-900">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
      </div>
    </div>
  );
}