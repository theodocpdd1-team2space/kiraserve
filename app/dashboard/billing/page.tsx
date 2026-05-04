"use client";

import Link from "next/link";
import { useState } from "react";
import AppNavbar from "@/components/AppNavbar";

type Plan = {
  name: string;
  price: string;
  badge?: string;
  desc: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "Rp9.000",
    desc: "Untuk gereja kecil, komunitas, atau ministry yang baru mulai merapikan jadwal pelayanan.",
    features: [
      "1 church workspace",
      "Basic schedule management",
      "Division management",
      "Serving role per division",
      "Share jadwal via WhatsApp",
      "Google Calendar link",
    ],
    cta: "Upgrade Starter",
  },
  {
    name: "Growth",
    price: "Rp19.000",
    badge: "Most Recommended",
    desc: "Untuk gereja yang mulai aktif memakai sistem digital untuk koordinasi pelayanan mingguan.",
    features: [
      "1 church workspace",
      "Unlimited division",
      "Schedule builder",
      "Role coordinator",
      "Conflict warning",
      "Pretty share link",
      "Upcoming attendance confirmation",
    ],
    cta: "Upgrade Growth",
    highlighted: true,
  },
  {
    name: "Pro Ministry",
    price: "Rp49.000",
    desc: "Untuk gereja yang membutuhkan sistem pelayanan lebih lengkap dan siap berkembang.",
    features: [
      "Unlimited division",
      "Advanced schedule management",
      "Export PDF / Excel upcoming",
      "Reminder upcoming",
      "DataMinistry upcoming",
      "Priority support",
      "Future event integration",
    ],
    cta: "Upgrade Pro",
  },
];

export default function BillingPage() {
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleUpgradeClick = (planName: string) => {
    setSelectedPlan(planName);
    setShowPaymentNotice(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <AppNavbar churchRole={null} />

      <section className="relative overflow-hidden px-8 pb-28 pt-16 md:px-14">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950" />
        <div className="absolute -left-[10%] top-[-20%] h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-[-8%] top-[10%] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-[1400px]">
          <Link
            href="/dashboard"
            className="mb-8 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-blue-100 backdrop-blur-md transition hover:bg-white/15"
          >
            ← Back to Dashboard
          </Link>

          <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 backdrop-blur-md">
            Billing & Plan
          </p>

          <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-7xl">
            Manajemen Gerejamu Lebih Better.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/70">
            Kelola status trial dan pilih paket KiraServe yang paling sesuai
            untuk kebutuhan pelayanan gerejamu. Paket mulai dari{" "}
            <b className="text-white">9 ribu/bulan</b>.
          </p>
        </div>
      </section>

      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-16 md:px-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-slate-200/70 md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
                Your Plan Active
              </p>

              <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-5xl font-black tracking-[-0.06em] text-slate-900">
                    Trial Plan
                  </h2>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
                    Akun baru otomatis mendapatkan akses trial untuk mencoba
                    fitur utama KiraServe sebelum memilih paket bulanan.
                  </p>
                </div>

                <div className="rounded-[2rem] bg-blue-50 p-6 text-left md:min-w-[230px]">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                    Status
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-900">
                    Active
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-500">
                    14 hari trial access
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <ActivePlanStat label="Current Plan" value="Trial" />
                <ActivePlanStat label="Billing Cycle" value="Monthly" />
                <ActivePlanStat label="Support" value="Basic" />
              </div>
            </div>

            <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-300/70 md:p-10">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
                Trial Flow
              </p>

              <h2 className="mt-5 text-4xl font-black tracking-[-0.05em]">
                Login → Aktifkan Trial → Dapat 14 Hari Trial.
              </h2>

              <ol className="mt-8 space-y-4">
                <FlowStep number="1" text="Login ke akun KiraServe" />
                <FlowStep number="2" text="Aktifkan trial untuk gereja" />
                <FlowStep number="3" text="Gunakan akses trial 14 hari" />
              </ol>

              <p className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/70">
                Trial cocok untuk testing internal, demo ke tim gereja, dan
                validasi kebutuhan sebelum upgrade ke paket berbayar.
              </p>
            </div>
          </div>

          <div className="mb-10 mt-16">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
              Upgrade Plan
            </p>

            <h2 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.05em] text-slate-900 md:text-5xl">
              Pilih paket sesuai kebutuhan pelayanan gereja.
            </h2>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-500">
              Harga sementara karena masih tahap pengembangan. Harga bisa
              berubah selama masa development mengikuti fitur, server, dan
              kebutuhan operasional.
            </p>
          </div>

          {showPaymentNotice ? (
            <div className="mb-10 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-xl shadow-amber-100/60">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-700">
                Payment Notice
              </p>

              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-900">
                Plan dipilih: {selectedPlan}
              </h3>

              <p className="mt-4 text-base leading-7 text-slate-700">
                Maaf, link proses pembayaran sedang dalam perbaikan. Jika ada
                hal yang ingin ditanyakan, silakan contact support WA{" "}
                <a
                  href="https://wa.me/62895345902896"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-blue-700 underline underline-offset-4"
                >
                  0895345902896
                </a>
                .
              </p>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative overflow-hidden rounded-[2.5rem] p-8 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl ${
                  plan.highlighted
                    ? "bg-slate-950 text-white shadow-slate-300/70"
                    : "bg-white text-slate-900 shadow-slate-200/70"
                }`}
              >
                {plan.badge ? (
                  <div className="mb-6 inline-flex rounded-full bg-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                    {plan.badge}
                  </div>
                ) : null}

                <p
                  className={`text-xs font-black uppercase tracking-[0.28em] ${
                    plan.highlighted ? "text-cyan-200" : "text-blue-600"
                  }`}
                >
                  {plan.name}
                </p>

                <div className="mt-5 flex items-end gap-2">
                  <h3 className="text-5xl font-black tracking-[-0.06em]">
                    {plan.price}
                  </h3>
                  <p
                    className={`pb-2 text-sm font-bold ${
                      plan.highlighted ? "text-white/50" : "text-slate-400"
                    }`}
                  >
                    /bulan
                  </p>
                </div>

                <p
                  className={`mt-5 min-h-[84px] text-base leading-7 ${
                    plan.highlighted ? "text-white/65" : "text-slate-500"
                  }`}
                >
                  {plan.desc}
                </p>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                          plan.highlighted
                            ? "bg-cyan-300 text-slate-950"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={`text-sm font-bold leading-6 ${
                          plan.highlighted ? "text-white/75" : "text-slate-600"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleUpgradeClick(plan.name)}
                  className={`mt-10 w-full rounded-full px-6 py-4 text-xs font-black uppercase tracking-[0.14em] transition hover:-translate-y-1 ${
                    plan.highlighted
                      ? "bg-white text-slate-950 hover:bg-cyan-100"
                      : "bg-slate-900 text-white hover:bg-blue-600"
                  }`}
                >
                  {plan.cta} →
                </button>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
              Development Pricing Notice
            </p>

            <p className="mt-4 text-sm leading-7 text-slate-500">
              Harga sementara karena KiraServe masih dalam tahap pengembangan.
              Paket, limit fitur, dan harga bisa berubah selama masa development.
              Untuk pertanyaan, aktivasi manual, atau bantuan pembayaran, hubungi
              support WA{" "}
              <a
                href="https://wa.me/62895345902896"
                target="_blank"
                rel="noopener noreferrer"
                className="font-black text-blue-700 underline underline-offset-4"
              >
                0895345902896
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function ActivePlanStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-5">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-xl font-black tracking-[-0.04em] text-slate-900">
        {value}
      </p>
    </div>
  );
}

function FlowStep({ number, text }: { number: string; text: string }) {
  return (
    <li className="flex items-center gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-blue-700">
        {number}
      </span>
      <span className="text-sm font-bold text-white/75">{text}</span>
    </li>
  );
}