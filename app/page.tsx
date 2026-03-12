import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Users,
  Receipt,
  PieChart,
  FileText,
  ArrowRight,
  Wallet,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { VantaBackground } from '@/components/VantaBackground'
import { ScrollHint } from '@/components/ScrollHint'
import { HighlightHeading } from '@/components/HighlightHeading'
import { AnimatedFeatureCard } from '@/components/AnimatedFeatureCard'
import { AnimatedCTA } from '@/components/AnimatedCTA'

export default async function LandingPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <ScrollHint />
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/saku.webp"
                alt="SAKU"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-lg font-bold tracking-tight text-foreground">
                SAKU
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">
                  Daftar Gratis
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Vanta.js Clouds Background */}
      <VantaBackground>
        <section className="h-screen max-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold tracking-wide uppercase">
                <Wallet className="h-3.5 w-3.5" />
                Keuangan UMKM Jadi Mudah
              </div>

              <HighlightHeading />

              <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl mx-auto">
                SAKU membantu UMKM mencatat transaksi, membagi laba secara
                transparan, dan mengelola keuangan multi-mitra dalam satu
                platform yang simpel.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:scale-[1.02] transition-all duration-200" asChild>
                  <Link href="/signup">
                    Mulai Sekarang — Gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" className="w-full sm:w-auto text-base px-8 h-12 border border-white/30 bg-transparent text-white backdrop-blur-sm hover:bg-white/15 hover:text-white" asChild>
                  <Link href="/login">Sudah Punya Akun?</Link>
                </Button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="mt-20 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { value: 'Multi-Mitra', label: 'Kelola bersama' },
                { value: 'Real-time', label: 'Laporan keuangan' },
                { value: 'Transparan', label: 'Bagi hasil adil' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-sm font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/60 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div className="hidden lg:flex absolute bottom-[2vh] left-1/2 -translate-x-1/2 flex-col items-center gap-1 animate-bounce">
            <span className="text-[10px] text-white/60 tracking-widest uppercase">Scroll</span>
            <div className="w-4 h-6 rounded-full border border-white/40 flex items-start justify-center p-0.5">
              <div className="w-0.5 h-1.5 rounded-full bg-white/60 animate-scroll-dot" />
            </div>
          </div>
        </section>
      </VantaBackground>

      {/* Features Section */}
      <section className="py-20 sm:py-28 bg-card/50 border-y">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary/70 mb-3">
              Fitur Utama
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Semua yang Anda butuhkan
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                title: 'Manajemen Mitra',
                desc: 'Undang mitra, atur ekuitas, dan kelola peran dalam satu bisnis bersama.',
                accent: 'bg-primary/10 text-primary',
              },
              {
                icon: Receipt,
                title: 'Catat Transaksi',
                desc: 'Pemasukan & pengeluaran tercatat rapi. Dukung pembayaran dari kas pribadi mitra.',
                accent: 'bg-secondary/80 text-secondary-foreground',
              },
              {
                icon: PieChart,
                title: 'Distribusi Laba',
                desc: 'Hitung laba otomatis dan bagikan sesuai persentase ekuitas masing-masing mitra.',
                accent: 'bg-primary/10 text-primary',
              },
              {
                icon: FileText,
                title: 'Laporan Keuangan',
                desc: 'Laba rugi, arus kas, dan modal mitra — semua tersedia dan bisa diekspor ke PDF.',
                accent: 'bg-secondary/80 text-secondary-foreground',
              },
            ].map((feature, i) => (
              <AnimatedFeatureCard
                key={feature.title}
                direction={i < 2 ? 'left' : 'right'}
                delay={i * 100}
              >
                <div className="group relative p-6 rounded-xl bg-card border hover:border-primary/20 hover:shadow-lg transition-all duration-300 h-full">
                  <div
                    className={`inline-flex items-center justify-center w-11 h-11 rounded-lg mb-4 ${feature.accent}`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </AnimatedFeatureCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary/70 mb-3">
              Cara Kerja
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              3 langkah mudah
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: '01',
                title: 'Buat Bisnis',
                desc: 'Daftar dan buat profil bisnis Anda. Undang mitra untuk bergabung dengan kode unik.',
              },
              {
                step: '02',
                title: 'Catat Keuangan',
                desc: 'Catat semua pemasukan dan pengeluaran harian. Otomatis terhitung per kategori.',
              },
              {
                step: '03',
                title: 'Lihat Hasilnya',
                desc: 'Pantau laporan keuangan, distribusikan laba, dan tarik keuntungan Anda.',
              },
            ].map((item, i) => (
              <AnimatedFeatureCard key={item.step} direction="left" delay={i * 150}>
                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground text-lg font-bold mb-5">
                    {item.step}
                  </div>
                  {i < 2 && (
                    <ChevronRight className="hidden md:block absolute top-7 -right-4 translate-x-1/2 h-5 w-5 text-muted-foreground/40" />
                  )}
                  <h3 className="font-semibold text-foreground mb-2 text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {item.desc}
                  </p>
                </div>
              </AnimatedFeatureCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedCTA>
            <div className="relative rounded-2xl overflow-hidden bg-primary px-8 py-14 sm:px-16 sm:py-20 text-center">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border-[40px] border-primary-foreground/20" />
                <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full border-[30px] border-primary-foreground/10" />
              </div>

              <div className="relative z-10">
                <Shield className="h-10 w-10 text-primary-foreground/80 mx-auto mb-6" />
                <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground mb-4">
                  Siap kelola keuangan usaha Anda?
                </h2>
                <p className="text-primary-foreground/70 max-w-md mx-auto mb-8 text-sm sm:text-base">
                  Bergabunglah sekarang dan rasakan kemudahan mengelola keuangan
                  UMKM bersama mitra bisnis Anda.
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base px-8 h-12 shadow-lg"
                  asChild
                >
                  <Link href="/signup">
                    Daftar Gratis Sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </AnimatedCTA>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <Image
                  src="/saku.webp"
                  alt="SAKU"
                  width={28}
                  height={28}
                  className="rounded-md"
                />
                <span className="font-bold text-foreground">SAKU</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Sistem Aplikasi Keuangan UMKM — platform pencatatan keuangan
                dan manajemen mitra untuk usaha kecil menengah Indonesia.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Produk</h4>
              <ul className="space-y-2">
                {['Manajemen Mitra', 'Catat Transaksi', 'Laporan Keuangan', 'Distribusi Laba'].map(
                  (item) => (
                    <li key={item}>
                      <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">
                        {item}
                      </span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Akun</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Masuk
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Daftar
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Informasi</h4>
              <ul className="space-y-2">
                {['Kebijakan Privasi', 'Syarat & Ketentuan'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} SAKU. Hak cipta dilindungi.
            </p>
            <p className="text-xs text-muted-foreground">
              Dibuat untuk UMKM Indonesia
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
