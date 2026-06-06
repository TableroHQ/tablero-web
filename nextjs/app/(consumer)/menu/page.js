'use client';
import React from 'react';
import { Plus, Minus, Search, AlertTriangle, LogIn } from 'lucide-react';
import { SkeletonCard } from '@/components/Skeleton';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import Reveal from '@/components/Reveal';

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID;

// Normalise items from various possible server shapes
function normaliseItems(data) {
  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  // { categories: [{ name, items: [] }] }
  if (data?.categories) return data.categories.flatMap(c => (c.items ?? []).map(i => ({ ...i, cat: c.name })));
  return [];
}

function extractCats(items) {
  const cats = [...new Set(items.map(i => i.categoryName || i.cat || 'Other'))];
  return ['All', ...cats]; // 'All' is a sentinel, translated at render time
}

export default function Menu() {
  const t = useTranslations('menu');
  const locale = useLocale();
  const [cat, setCat] = React.useState('All');
  const [q, setQ] = React.useState('');
  const [items, setItems] = React.useState([]);
  const [cats, setCats] = React.useState(['All']);
  const [loading, setLoading] = React.useState(true);
  const [state, store] = useStore();
  const router = useRouter();
  const isGuest = state.user.role === 'GUEST';

  React.useEffect(() => {
    if (!RESTAURANT_ID) {
      setLoading(false);
      return;
    }
    // Ask the API for names/descriptions in the active UI language; the backend
    // falls back to English for any locale it does not have a translation for.
    api.get(`/api/restaurants/${RESTAURANT_ID}/menu`, {
      headers: { 'Accept-Language': locale },
    })
      .then((data) => {
        const normalised = normaliseItems(data).map((item) => ({
          ...item,
          cat: item.categoryName || item.cat || 'Other',
          img: item.imageUrl || item.image || '',
          available: item.isAvailable !== false && item.available !== false,
          allergens: item.allergens ?? [],
          tags: item.tags ?? [],
          desc: item.description || item.desc || '',
        }));
        setItems(normalised);
        setCats(extractCats(normalised));
      })
      .catch(() => toast.error(t('couldNotLoad')))
      .finally(() => setLoading(false));
    // Re-fetch when the language changes so the menu re-localizes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const list = items.filter(m =>
    (cat === 'All' || m.cat === cat) &&
    m.name.toLowerCase().includes(q.toLowerCase())
  );

  const add = (m) => {
    if (isGuest) {
      toast.error(t('signInToOrder'), {
        action: { label: t('signInToOrder'), onClick: () => router.push('/login?next=/menu') },
      });
      return;
    }
    store.addToCart(m);
    toast.success(t('addedToOrder', { name: m.name }));
  };

  // Stepper controls for items already in the cart — increment/decrement the
  // quantity in place so the diner can see and adjust how many they've ordered.
  const inc = (m) => { store.addToCart(m); };
  const dec = (m, qty) => { qty <= 1 ? store.removeCart(m.id) : store.changeQty(m.id, -1); };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 md:py-16">
      <div className="label-eyebrow">{t('eyebrow', { mode: RESTAURANT_ID ? t('modeLive') : t('modeSample') })}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2 max-w-2xl">{t('title')}</h1>
      <p className="mt-4 text-ink-body max-w-xl">{t('subtitle')}</p>

      <div className="sticky top-[72px] z-30 -mx-6 md:-mx-12 px-6 md:px-12 py-4 mt-10 glass-nav border-y border-border/60">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-border rounded-full px-4 py-2 flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="text-ink-muted" />
            <input data-testid="menu-search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('search')} className="bg-transparent flex-1 outline-none text-sm font-fn" />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)} data-testid={`menu-cat-${c.toLowerCase()}`}
                className={`px-4 py-2 rounded-full text-sm font-fn whitespace-nowrap transition ${cat === c ? 'bg-ink text-white dark:bg-primary dark:text-white' : 'bg-white border border-border text-ink-body hover:border-ink/30'}`}>
                {c === 'All' ? t('all') : c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-20 text-center text-ink-muted font-fn">{t('noItems')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {list.map((m, i) => {
            const qty = state.cart.find(c => c.id === m.id)?.qty || 0;
            return (
            <Reveal key={m.id} delay={Math.min(i, 8) * 60}>
            <article className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition group h-full flex flex-col">
              <div className="aspect-[4/3] relative overflow-hidden">
                <img src={m.img} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" onError={e => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
                {!m.available && (
                  <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
                    <span className="chip bg-white text-ink"><AlertTriangle size={12} /> {t('soldOut')}</span>
                  </div>
                )}
                <span className="absolute top-3 left-3 chip bg-white/90 text-ink-body">{m.cat}</span>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl text-ink">{m.name}</h3>
                  <span className="font-mono text-sm font-semibold shrink-0">${Number(m.price).toFixed(2)}</span>
                </div>
                <p className="mt-2 text-sm text-ink-body leading-relaxed line-clamp-2">{m.desc}</p>
                {(m.isSpicy || m.isVegetarian || m.isVegan || m.isGlutenFree || Number(m.calories) > 0) && (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap text-[11px] font-fn">
                    {m.isVegan && <span className="chip bg-green-50 text-green-700">🌱 Vegan</span>}
                    {!m.isVegan && m.isVegetarian && <span className="chip bg-green-50 text-green-700">Vegetarian</span>}
                    {m.isGlutenFree && <span className="chip bg-amber-50 text-amber-700">Gluten-free</span>}
                    {m.isSpicy && <span className="chip bg-red-50 text-red-700">🌶 Spicy</span>}
                    {Number(m.calories) > 0 && <span className="chip bg-cream-sub text-ink-muted">{m.calories} kcal</span>}
                    {Number(m.preparationTimeMinutes) > 0 && <span className="chip bg-cream-sub text-ink-muted">{m.preparationTimeMinutes} min</span>}
                  </div>
                )}
                {m.allergens.length > 0 && (
                  <div className="mt-3 flex items-center gap-1 flex-wrap">
                    {m.allergens.map(a => <span key={a} className="text-[10px] font-mono uppercase tracking-wide bg-cream-sub px-2 py-0.5 rounded-full text-ink-muted">{a}</span>)}
                  </div>
                )}
                <div className="mt-auto pt-5">
                  {isGuest ? (
                    <button onClick={() => add(m)} data-testid={`menu-add-${m.id}`}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-primary text-primary font-fn font-medium hover:bg-primary hover:text-white transition">
                      <LogIn size={16} /> {t('signInToOrder')}
                    </button>
                  ) : qty > 0 ? (
                    <div className="flex items-center justify-between rounded-full bg-primary text-white px-2 py-1.5" data-testid={`menu-stepper-${m.id}`}>
                      <button onClick={() => dec(m, qty)} aria-label={t('decrease')} data-testid={`menu-dec-${m.id}`}
                        className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                        <Minus size={16} />
                      </button>
                      <span className="font-fn font-medium text-sm" data-testid={`menu-qty-${m.id}`}>{t('inOrderCount', { n: qty })}</span>
                      <button disabled={!m.available} onClick={() => inc(m)} aria-label={t('increase')} data-testid={`menu-inc-${m.id}`}
                        className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/20 transition disabled:opacity-40">
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button disabled={!m.available} onClick={() => add(m)} data-testid={`menu-add-${m.id}`}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-white font-fn font-medium hover:bg-terracotta-dark transition disabled:bg-cream-sub disabled:text-ink-muted">
                      <Plus size={16} /> {t('addToOrder')}
                    </button>
                  )}
                </div>
              </div>
            </article>
            </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
