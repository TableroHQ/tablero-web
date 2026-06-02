'use client';
import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Star, Clock, MapPin, ChefHat, Sparkles, QrCode } from 'lucide-react';
import { IMG, REVIEWS } from '@/lib/mock';
import { api } from '@/lib/client';
import Reveal from '@/components/Reveal';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;

export default function Landing() {
  const t = useTranslations('landing');
  const [restaurant, setRestaurant] = React.useState(null);
  const [menuItems, setMenuItems] = React.useState([]);

  React.useEffect(() => {
    if (!RESTAURANT_ID) return;
    // Load restaurant info and a preview of the menu in parallel
    Promise.all([
      api.get(`/api/restaurants/${RESTAURANT_ID}`).catch(() => null),
      api.get(`/api/restaurants/${RESTAURANT_ID}/menu`).catch(() => null),
    ]).then(([rest, menu]) => {
      if (rest) setRestaurant(rest);
      if (menu) {
        const items = Array.isArray(menu) ? menu : (menu.items ?? menu.categories?.flatMap(c => c.items ?? []) ?? []);
        setMenuItems(items.filter(i => i.isAvailable !== false).slice(0, 4));
      }
    });
  }, []);

  const stats = [
    ['4.8★', restaurant ? t('statRatingNamed', { name: restaurant.name }) : t('statRatingGuest')],
    ['28 min', t('statService')],
    ['12k+', t('statMembers')],
    ['7', t('statServices')],
  ];

  // Use live menu items if available, fall back to mock images for layout
  const previewItems = menuItems.length >= 4 ? menuItems : null;

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-12 pb-16 md:pt-20 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <Reveal className="lg:col-span-7" y={24}>
            <div className="label-eyebrow mb-5">{t('eyebrow')}</div>
            <h1 className="font-display text-5xl md:text-7xl font-semibold text-ink leading-[0.95]">
              {t('heroLine1')}<br />
              <span className="italic text-primary">{t('heroLine2')}</span>
            </h1>
            <p className="mt-6 text-lg text-ink-body max-w-xl leading-relaxed">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/reservations" className="btn-primary inline-flex items-center gap-2" data-testid="hero-reserve">{t('reserveTable')} <ArrowRight size={16} /></Link>
              <Link href="/menu" className="btn-outline inline-flex items-center gap-2" data-testid="hero-menu">{t('exploreMenu')}</Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-8">
              {stats.map(([n, l]) => (
                <div key={l}>
                  <div className="font-display text-3xl text-ink">{n}</div>
                  <div className="label-eyebrow mt-1">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal className="lg:col-span-5 relative" delay={140} y={24}>
            <div className="relative rounded-[2rem] overflow-hidden aspect-[4/5] shadow-2xl">
              <img src={IMG.interior} alt={restaurant?.name || 'Tablero interior'} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 backdrop-blur-xl bg-white/80 rounded-2xl p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <QrCode size={22} />
                </div>
                <div className="flex-1">
                  <div className="text-xs label-eyebrow">{t('scanOrder')}</div>
                  <div className="font-fn text-sm text-ink">{t('scanSubtitle')}</div>
                </div>
                <ArrowRight size={18} className="text-ink-muted" />
              </div>
            </div>
            <div className="absolute -top-6 -left-6 hidden md:block bg-white rounded-2xl shadow-xl p-4 w-56">
              <div className="flex items-center gap-1 text-warn mb-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <p className="text-xs text-ink-body italic">{t('bestReview')}</p>
              <div className="text-[10px] font-mono text-ink-muted mt-2">— SOFIA M.</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-cream-sub/50 py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <Reveal>
            <div className="label-eyebrow">{t('whyTablero')}</div>
            <h2 className="font-display text-4xl md:text-5xl mt-2 max-w-2xl">{t('platformTitle')}</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: ChefHat, title: t('feature1Title'), text: t('feature1Text') },
              { icon: Clock, title: t('feature2Title'), text: t('feature2Text') },
              { icon: Sparkles, title: t('feature3Title'), text: t('feature3Text') },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 90}>
                <div className="bg-white rounded-3xl p-7 hover:-translate-y-1 transition-transform shadow-sm hover:shadow-md h-full">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5"><c.icon size={22} /></div>
                  <h3 className="font-fn font-semibold text-xl text-ink">{c.title}</h3>
                  <p className="mt-2 text-sm text-ink-body leading-relaxed">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* MENU PEEK — uses live items if loaded, otherwise mock images */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <Reveal className="flex items-end justify-between gap-6 mb-10">
            <div>
              <div className="label-eyebrow">{t('tonightsHighlights')}</div>
              <h2 className="font-display text-4xl md:text-5xl mt-2">{t('madeWithCare')}</h2>
            </div>
            <Link href="/menu" className="btn-outline inline-flex items-center gap-2" data-testid="see-menu">{t('fullMenu')} <ArrowRight size={14} /></Link>
          </Reveal>
          <Reveal delay={80}>
          {previewItems ? (
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <FoodCard item={previewItems[0]} className="col-span-12 md:col-span-7 aspect-[16/10]" big fallbackImg={IMG.burger} />
              <FoodCard item={previewItems[3]} className="col-span-6 md:col-span-5 aspect-[4/5]" fallbackImg={IMG.dessert} />
              <FoodCard item={previewItems[2]} className="col-span-6 md:col-span-4 aspect-[4/5]" fallbackImg={IMG.salad} />
              <FoodCard item={previewItems[1]} className="col-span-12 md:col-span-8 aspect-[16/9]" big fallbackImg={IMG.pasta} />
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <StaticCard img={IMG.burger}  cat="Mains"    name="Smokehouse Burger"      price={18.5} className="col-span-12 md:col-span-7 aspect-[16/10]" big />
              <StaticCard img={IMG.dessert} cat="Desserts" name="Bitter Chocolate Cake"  price={9}    className="col-span-6 md:col-span-5 aspect-[4/5]" />
              <StaticCard img={IMG.salad}   cat="Starters" name="Garden Buddha Bowl"     price={14.5} className="col-span-6 md:col-span-4 aspect-[4/5]" />
              <StaticCard img={IMG.pasta}   cat="Mains"    name="Truffle Tagliatelle"    price={24}   className="col-span-12 md:col-span-8 aspect-[16/9]" big />
            </div>
          )}
          </Reveal>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="py-16 md:py-24 bg-ink text-cream">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <Reveal>
            <div className="label-eyebrow !text-cream/60">{t('wordOfMouth')}</div>
            <h2 className="font-display text-4xl md:text-5xl mt-2 max-w-3xl">{t('famousQuote')}</h2>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((r, idx) => (
              <Reveal key={r.id} delay={idx * 90}>
                <div className="bg-white/5 backdrop-blur rounded-3xl p-6 border border-white/10 h-full">
                  <div className="flex items-center gap-1 text-secondary mb-3">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
                  <p className="leading-relaxed text-cream/90">"{r.comment}"</p>
                  <div className="mt-4 text-xs font-mono text-cream/50">— {r.author.toUpperCase()} · {r.date}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 md:py-24 bg-cream-sub/30">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <Reveal className="text-center mb-12">
            <div className="label-eyebrow">{t('pricingEyebrow')}</div>
            <h2 className="font-display text-4xl md:text-5xl mt-2">{t('pricingTitle')}</h2>
            <p className="mt-4 text-ink-body max-w-xl mx-auto">{t('pricingSubtitle')}</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Plus',
                price: '$20',
                period: t('perMonth'),
                desc: t('planPlusDesc'),
                features: t.raw('planPlusFeatures'),
                cta: t('planPlusCta'),
                highlight: false,
              },
              {
                name: 'Premium',
                price: '$45',
                period: t('perMonth'),
                desc: t('planPremiumDesc'),
                features: t.raw('planPremiumFeatures'),
                cta: t('planPremiumCta'),
                highlight: true,
              },
              {
                name: 'Business',
                price: '$100',
                period: t('perMonth'),
                desc: t('planBusinessDesc'),
                features: t.raw('planBusinessFeatures'),
                cta: t('planBusinessCta'),
                highlight: false,
              },
            ].map((plan, i) => (
              <Reveal key={plan.name} delay={i * 90}>
                <div
                className={`rounded-3xl p-7 flex flex-col border h-full ${plan.highlight ? 'bg-ink text-cream border-ink shadow-2xl scale-[1.03] dark:bg-primary/20 dark:text-foreground dark:border-primary/60' : 'bg-white border-border shadow-sm'}`}>
                <div className={`label-eyebrow mb-3 ${plan.highlight ? '!text-cream/50 dark:!text-foreground/50' : ''}`}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`font-display text-5xl ${plan.highlight ? 'text-cream dark:text-foreground' : 'text-ink'}`}>{plan.price}</span>
                  <span className={`font-mono text-sm mb-2 ${plan.highlight ? 'text-cream/60 dark:text-foreground/50' : 'text-ink-muted'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 leading-relaxed ${plan.highlight ? 'text-cream/70 dark:text-foreground/70' : 'text-ink-body'}`}>{plan.desc}</p>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-cream/80 dark:text-foreground/80' : 'text-ink-body'}`}>
                      <span className={`h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] ${plan.highlight ? 'bg-primary text-white' : 'bg-primary/15 text-primary'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className={`w-full py-3 rounded-full text-center font-fn font-medium text-sm transition ${plan.highlight ? 'bg-primary text-white hover:bg-terracotta-dark' : 'border border-ink text-ink hover:bg-ink hover:text-white'}`}>
                  {plan.cta}
                </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FIND US */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <Reveal className="aspect-[4/3] rounded-[2rem] overflow-hidden">
            <img src={IMG.interior2} alt={t('diningRoom')} className="w-full h-full object-cover" />
          </Reveal>
          <Reveal delay={120}>
            <div className="label-eyebrow">{t('visitUs')}</div>
            <h2 className="font-display text-4xl md:text-5xl mt-2">
              {restaurant ? restaurant.name : 'Downtown · Riverside · Old Quarter'}
            </h2>
            <p className="mt-4 text-ink-body leading-relaxed">
              {restaurant?.description || t('threeBranches')}
            </p>
            {restaurant?.address && (
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-cream-sub/60">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><MapPin size={18} /></div>
                  <div>
                    <div className="font-fn font-semibold">{restaurant.name}</div>
                    <div className="text-sm text-ink-body">{restaurant.address}</div>
                  </div>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>
    </div>
  );
}

function FoodCard({ item, className, big, fallbackImg }) {
  const tc = useTranslations('common');
  const img = item.imageUrl || item.image || fallbackImg;
  return (
    <Link href="/menu" className={`group relative rounded-3xl overflow-hidden ${className}`} data-testid={`food-card-${item.id}`}>
      <img src={img} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-white">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/70">{item.categoryName || item.cat}</div>
        <div className={`font-display ${big ? 'text-3xl md:text-4xl' : 'text-2xl'} mt-1`}>{item.name}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-sm">${Number(item.price).toFixed(2)}</span>
          <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-sm">{tc('view')} <ArrowRight size={14} /></span>
        </div>
      </div>
    </Link>
  );
}

function StaticCard({ img, cat, name, price, className, big }) {
  const tc = useTranslations('common');
  return (
    <Link href="/menu" className={`group relative rounded-3xl overflow-hidden ${className}`}>
      <img src={img} alt={name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-7 text-white">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-cream/70">{cat}</div>
        <div className={`font-display ${big ? 'text-3xl md:text-4xl' : 'text-2xl'} mt-1`}>{name}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono text-sm">${price.toFixed(2)}</span>
          <span className="opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-sm">{tc('view')} <ArrowRight size={14} /></span>
        </div>
      </div>
    </Link>
  );
}
