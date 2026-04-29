import React from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden px-8 pb-40 pt-32 md:px-14 lg:pt-44 lg:pb-52">
        {/* Magical Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900" />
        
        {/* Glowing Orbs (Magical Effect) */}
        <div className="absolute -left-[10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px] mix-blend-screen" />
        <div className="absolute right-[-5%] top-[20%] h-[600px] w-[600px] rounded-full bg-cyan-400/10 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[20%] h-[400px] w-[600px] rounded-full bg-indigo-500/20 blur-[100px] mix-blend-screen" />

        <div className="relative z-10 mx-auto max-w-[1300px]">
          <div className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:items-center">
            
            {/* Left Content (Text) */}
            <div className="relative z-20">
              <p className="mb-6 inline-block rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-blue-200 backdrop-blur-md">
                KiraServe
              </p>

              <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-7xl lg:text-[5rem]">
                Church Ministry <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">
                  Scheduling.
                </span>
              </h1>

              <p className="mt-8 max-w-xl text-lg leading-relaxed text-blue-100/80 md:text-xl">
                Sistem penjadwalan pelayanan untuk gereja. Kelola divisi,
                koordinator, pelayan, jadwal mingguan, jadwal bulanan, upload
                foto jadwal, share WhatsApp, dan add to Google Calendar.
              </p>

              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/login"
                  className="group relative flex items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.7)]"
                >
                  <span className="relative z-10">Login →</span>
                </a>

                <a
                  href="/dashboard"
                  className="rounded-full border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
                >
                  Dashboard Demo
                </a>
              </div>
            </div>

            {/* Right Content (App Mockup Placeholder) */}
            <div className="relative hidden lg:block perspective-1000">
              {/* Decorative glow behind the phone */}
              <div className="absolute left-1/2 top-1/2 h-[110%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-t from-blue-500/30 to-cyan-300/10 blur-[80px]" />
              
              {/* Phone Mockup Frame */}
              <div className="relative mx-auto h-[650px] w-[320px] rotate-[2deg] rounded-[3rem] border-[8px] border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl transition-transform duration-700 hover:rotate-0">
                {/* Replace the div below with your actual image */}
                <div className="flex h-full w-full flex-col items-center justify-center rounded-[2.5rem] bg-slate-900 text-slate-500 overflow-hidden relative">
                   <span className="text-sm">Put your App Image Here</span>
                   {/* Example format for your image: */}
                   {/* <img src="your-app-image.jpg" className="w-full h-full object-cover" alt="App Preview" /> */}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FEATURES SECTION (Curved transition) */}
      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-slate-50 px-8 py-24 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] md:px-14">
        <div className="mx-auto max-w-[1300px]">
          
          <div className="grid gap-8 md:grid-cols-3">
            <Feature
              number="01"
              title="Multiple Divisi"
              desc="Satu gereja bisa punya banyak divisi seperti Production, Worship, Kids, Youth, Usher, dan lainnya."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />

            <Feature
              number="02"
              title="Role Koordinator"
              desc="Setiap divisi bisa punya beberapa koordinator yang dapat mengelola jadwal pelayanan."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
            />

            <Feature
              number="03"
              title="Share Jadwal"
              desc="Jadwal bisa dibagikan ke WhatsApp, di-download, dan ditambahkan ke Google Calendar."
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>
    </main>
  );
}

// Komponen Feature Card
function Feature({
  number,
  title,
  desc,
  icon
}: {
  number: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="group relative overflow-hidden rounded-[2.5rem] bg-white p-10 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/10">
      {/* Background glow on hover */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-50 transition-all duration-500 group-hover:bg-blue-100/50" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>
        <p className="text-3xl font-black text-slate-100 transition-colors group-hover:text-blue-100">
          {number}
        </p>
      </div>

      <h2 className="relative z-10 mt-8 text-2xl font-bold tracking-tight text-slate-800">
        {title}
      </h2>

      <p className="relative z-10 mt-4 text-base leading-relaxed text-slate-600">
        {desc}
      </p>
    </article>
  );
}