import React from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-cyan-500/30">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden px-6 py-24 md:px-14 lg:pt-32">
        {/* Background Sophistication */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)]" />
          <div className="absolute top-[10%] left-[15%] h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[150px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1300px] w-full">
          <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-8 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-200/80">
                  Introducing KiraServe v1.0
                </p>
              </div>

              <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
                Elevate Your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40">
                  Ministry Flow.
                </span>
              </h1>

              <p className="mt-8 max-w-xl mx-auto lg:mx-0 text-lg leading-relaxed text-slate-400 md:text-xl">
                Sistem manajemen pelayanan gereja yang dirancang untuk presisi. 
                Kelola divisi, koordinasi volunteer, dan jadwal dalam satu balutan antarmuka premium.
              </p>

              <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6">
                <a
                  href="/login"
                  className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white transition-all duration-500 bg-blue-600 rounded-full hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.4)]"
                >
                  Mulai 14 Hari Trial
                </a>
                <a
                  href="/dashboard"
                  className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white hover:text-cyan-400 transition-colors"
                >
                  Live Demo <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>

              <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-8 border-t border-white/5 pt-10">
                <div>
                  <p className="text-2xl font-bold text-white">9k<span className="text-sm text-cyan-400">/mo</span></p>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">Starting Price</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Unlimited</p>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">Divisi & Anggota</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <p className="text-2xl font-bold text-white">Instant</p>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mt-1">WhatsApp Sync</p>
                </div>
              </div>
            </div>

            {/* Right Content - The Device Mockup */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto w-[320px] rounded-[3rem] border-[12px] border-[#1e293b] bg-[#020617] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] ring-1 ring-white/10">
                <div className="h-[600px] w-full overflow-hidden rounded-[2.2rem] bg-slate-900/50">
                   {/* App UI Mockup */}
                   <div className="p-6 space-y-6">
                      <div className="h-2 w-12 bg-white/10 rounded-full mb-8" />
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 bg-white/20 rounded-md" />
                        <div className="h-3 w-1/2 bg-white/10 rounded-md" />
                      </div>
                      <div className="space-y-4 pt-4">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                            <div className="space-y-2">
                              <div className="h-3 w-20 bg-white/20 rounded-md" />
                              <div className="h-2 w-12 bg-white/10 rounded-md" />
                            </div>
                            <div className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/50" />
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRATEGIC FEATURES */}
      <section className="relative z-20 bg-white py-32 px-6 md:px-14 rounded-t-[4rem]">
        <div className="mx-auto max-w-[1300px]">
          <div className="grid lg:grid-cols-2 gap-16 items-end mb-20">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-600 mb-4">Core Capabilities</p>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                Dibuat untuk Efisiensi, <br/>Didesain untuk Kemudahan.
              </h2>
            </div>
            <p className="text-lg text-slate-600">
              Kami menghilangkan kerumitan manajemen manual. Fokus pada pelayanan Anda, biarkan KiraServe menangani logistiknya.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard 
              title="Multi-Tenant Architecture" 
              desc="Ruang kerja eksklusif untuk setiap gereja. Data Anda terisolasi, aman, dan privat." 
              index="01"
            />
            <FeatureCard 
              title="Smart Coordinator Role" 
              desc="Delegasikan pengaturan jadwal ke koordinator divisi dengan kontrol akses yang presisi." 
              index="02"
            />
            <FeatureCard 
              title="Omni-Channel Share" 
              desc="Satu klik untuk sebar jadwal ke WhatsApp atau sinkronisasi ke Google Calendar." 
              index="03"
            />
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest mb-6">
            Limited Time Beta Price
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8">Siap Memulai Digitalisasi?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <a href="/login" className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white rounded-full font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20">
               Daftar Sekarang
             </a>
             <p className="text-slate-500 text-sm">Mulai trial 14 hari, batalkan kapan saja.</p>
          </div>
        </div>
      </section>

      {/* PREMIUM FOOTER */}
      <footer className="bg-white border-t border-slate-100 px-6 py-16">
        <div className="mx-auto max-w-[1300px] flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="text-2xl font-black tracking-tighter text-slate-900">KiraServe</p>
            <p className="text-sm text-slate-400 mt-1">Modernizing Church Excellence.</p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 mb-2">Powered by</p>
            <div className="px-6 py-3 bg-slate-50 rounded-xl border border-slate-100">
               <span className="text-xl font-black tracking-[0.2em] text-slate-900 italic">C VISUAL</span>
            </div>
          </div>
        </div>
        <div className="mt-16 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">© 2026 KiraServe. All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ title, desc, index }: { title: string, desc: string, index: string }) {
  return (
    <div className="group p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 transition-all duration-500 hover:bg-slate-900 hover:border-slate-800">
      <p className="text-blue-600 font-bold mb-8 group-hover:text-cyan-400 transition-colors">{index}</p>
      <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-slate-600 group-hover:text-slate-400 transition-colors leading-relaxed">{desc}</p>
    </div>
  );
}