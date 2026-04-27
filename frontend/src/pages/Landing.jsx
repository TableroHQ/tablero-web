import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, MapPin, ChefHat, Sparkles, QrCode } from 'lucide-react';
import { IMG, MENU, REVIEWS } from '@/lib/mock';

export default function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-12 pb-16 md:pt-20 md:pb-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="label-eyebrow mb-5">A restaurant operating system · est. 2026</div>
            <h1 className="font-display text-5xl md:text-7xl font-semibold text-ink leading-[0.95]">
              Every seat, every plate,<br/>
              <span className="italic text-primary">one beautiful flow.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-body max-w-xl leading-relaxed">
              Reserve a table, order from your phone, watch your dish move through the kitchen in real time, and earn a hotdog while you're at it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/reservations" className="btn-primary inline-flex items-center gap-2" data-testid="hero-reserve">Reserve a table <ArrowRight size={16}/></Link>
              <Link to="/menu" className="btn-outline inline-flex items-center gap-2" data-testid="hero-menu">Explore menu</Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-8">
              {[
                ['7', 'Microservices'],
                ['4.8★', 'Guest rating'],
                ['28 min', 'Avg. service'],
                ['12k+', 'Loyalty members'],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-3xl text-ink">{n}</div>
                  <div className="label-eyebrow mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-2xl">
              <img src={IMG.interior} alt="Bite interior" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-white/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <QrCode size={22} />
                </div>
                <div className="flex-1">
                  <div className="text-xs label-eyebrow">Scan & order</div>
                  <div className="font-fn text-sm text-ink">QR codes per table — no app install</div>
                </div>
                <ArrowRight size={18} className="text-ink-muted"/>
              </div>
            </div>
            <div className="absolute -top-6 -left-6 hidden md:block bg-white rounded-2xl shadow-xl p-4 w-56">
              <div className="flex items-center gap-1 text-warn mb-1">{Array.from({length:5}).map((_,i)=><Star key={i} size={14} fill="currentColor"/>)}</div>
              <p className="text-xs text-ink-body italic">"Best truffle pasta in town."</p>
              <div className="text-[10px] font-mono text-ink-muted mt-2">— SOFIA M.</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="bg-cream-sub/50 py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="label-eyebrow">Why Bite</div>
          <h2 className="font-display text-4xl md:text-5xl mt-2 max-w-2xl">One platform tying together everyone in the room.</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: ChefHat, title: 'Live Kitchen Display', text: 'Chefs see every order on a real-time KDS with audio cues. Items flow QUEUED → PREPARING → READY.' },
              { icon: Clock, title: 'Reservations & Pre-Orders', text: 'Book a table, pick your dish ahead, and the kitchen starts the moment you sit down.' },
              { icon: Sparkles, title: 'Food-Item Loyalty', text: 'Earn points and redeem real food — a free hotdog feels better than a coupon.' },
            ].map(c => (
              <div key={c.title} className="bg-white rounded-3xl p-7 hover:-translate-y-1 transition-transform shadow-sm hover:shadow-md">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5"><c.icon size={22}/></div>
                <h3 className="font-fn font-semibold text-xl text-ink">{c.title}</h3>
                <p className="mt-2 text-sm text-ink-body leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MENU PEEK — Tetris */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex items-end justify-between gap-6 mb-10">
            <div>
              <div className="label-eyebrow">Tonight's highlights</div>
              <h2 className="font-display text-4xl md:text-5xl mt-2">Made with care, served fast.</h2>
            </div>
            <Link to="/menu" className="btn-outline inline-flex items-center gap-2" data-testid="see-menu">Full menu <ArrowRight size={14}/></Link>
          </div>
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <FoodCard item={MENU[0]} className="col-span-12 md:col-span-7 aspect-[16/10]" big />
            <FoodCard item={MENU[3]} className="col-span-6 md:col-span-5 aspect-[4/5]" />
            <FoodCard item={MENU[2]} className="col-span-6 md:col-span-4 aspect-[4/5]" />
            <FoodCard item={MENU[1]} className="col-span-12 md:col-span-8 aspect-[16/9]" big />
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-16 md:py-24 bg-ink text-cream">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="label-eyebrow !text-cream/60">Word of mouth</div>
          <h2 className="font-display text-4xl md:text-5xl mt-2 max-w-3xl">"You taste the room, not just the plate."</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {REVIEWS.map(r => (
              <div key={r.id} className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-1 text-secondary mb-3">{Array.from({length:r.rating}).map((_,i)=><Star key={i} size={14} fill="currentColor"/>)}</div>
                <p className="leading-relaxed text-cream/90">"{r.comment}"</p>
                <div className="mt-4 text-xs font-mono text-cream/50">— {r.author.toUpperCase()} · {r.date}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FIND US */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-10 items-center">
          <div className="aspect-[4/3] rounded-[2rem] overflow-hidden">
            <img src={IMG.interior2} alt="dining room" className="w-full h-full object-cover"/>
          </div>
          <div>
            <div className="label-eyebrow">Visit us</div>
            <h2 className="font-display text-4xl md:text-5xl mt-2">Downtown · Riverside · Old Quarter</h2>
            <p className="mt-4 text-ink-body leading-relaxed">Three branches. One kitchen language. Each location keeps its own personality and its own playlist.</p>
            <div className="mt-8 space-y-4">
              {[
                ['Downtown','12 Birch Lane · Open until 23:00'],
                ['Riverside','5 Riverside Park · Open until 22:00'],
                ['Old Quarter','88 Maple Ave · Closed Mondays'],
              ].map(([n,a]) => (
                <div key={n} className="flex items-start gap-4 p-4 rounded-2xl bg-cream-sub/60">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><MapPin size={18}/></div>
                  <div>
                    <div className="font-fn font-semibold">{n}</div>
                    <div className="text-sm text-ink-body">{a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FoodCard({ item, className, big }) {
  return (
    <Link to="/menu" className={`group relative rounded-3xl overflow-hidden ${className}`} data-testid={`food-card-${item.id}`}>
      <img src={item.img} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-white">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/70">{item.cat}</div>
        <div className={`font-display ${big?'text-3xl md:text-4xl':'text-2xl'} mt-1`}>{item.name}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-sm">${item.price.toFixed(2)}</span>
          <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-sm">View <ArrowRight size={14}/></span>
        </div>
      </div>
    </Link>
  );
}
