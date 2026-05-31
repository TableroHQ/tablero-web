'use client';
import React from 'react';
import { Plus, Search, AlertTriangle, LogIn } from 'lucide-react';
import { SkeletonCard } from '@/components/Skeleton';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';
import { toast } from 'sonner';
import { IMG } from '@/lib/mock';
import { useTranslations } from 'next-intl';

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

const PLACEHOLDER_IMGS = [IMG.burger, IMG.pasta, IMG.salad, IMG.dessert];

export default function Menu() {
  const t = useTranslations('menu');
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
    api.get(`/api/restaurants/${RESTAURANT_ID}/menu`)
      .then((data) => {
        const normalised = normaliseItems(data).map((item, idx) => ({
          ...item,
          cat: item.categoryName || item.cat || 'Other',
          img: item.imageUrl || item.image || PLACEHOLDER_IMGS[idx % PLACEHOLDER_IMGS.length],
          available: item.isAvailable !== false && item.available !== false,
          allergens: item.allergens ?? [],
          desc: item.description || item.desc || '',
        }));
        setItems(normalised);
        setCats(extractCats(normalised));
      })
      .catch(() => toast.error(t('couldNotLoad')))
      .finally(() => setLoading(false));
  }, []);

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
    toast.success(`${m.name} added to your order`);
  };

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {[0,1,2,3,4,5].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : list.length === 0 ? (
        <div className="mt-20 text-center text-ink-muted font-fn">{t('noItems')}</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {list.map(m => (
            <article key={m.id} className="bg-white rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition group">
              <div className="aspect-[4/3] relative overflow-hidden">
                <img src={m.img} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER_IMGS[0]; }} />
                {!m.available && (
                  <div className="absolute inset-0 bg-ink/70 flex items-center justify-center">
                    <span className="chip bg-white text-ink"><AlertTriangle size={12} /> {t('soldOut')}</span>
                  </div>
                )}
                <span className="absolute top-3 left-3 chip bg-white/90 text-ink-body">{m.cat}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-xl text-ink">{m.name}</h3>
                  <span className="font-mono text-sm font-semibold">${Number(m.price).toFixed(2)}</span>
                </div>
                <p className="mt-2 text-sm text-ink-body leading-relaxed">{m.desc}</p>
                {m.allergens.length > 0 && (
                  <div className="mt-3 flex items-center gap-1 flex-wrap">
                    {m.allergens.map(a => <span key={a} className="text-[10px] font-mono uppercase tracking-wide bg-cream-sub px-2 py-0.5 rounded-full text-ink-muted">{a}</span>)}
                  </div>
                )}
                {isGuest ? (
                  <button onClick={() => add(m)} data-testid={`menu-add-${m.id}`}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-full border-2 border-primary text-primary font-fn font-medium hover:bg-primary hover:text-white transition">
                    <LogIn size={16} /> {t('signInToOrder')}
                  </button>
                ) : (
                  <button disabled={!m.available} onClick={() => add(m)} data-testid={`menu-add-${m.id}`}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary text-white font-fn font-medium hover:bg-terracotta-dark transition disabled:bg-cream-sub disabled:text-ink-muted">
                    <Plus size={16} /> {t('addToOrder')}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
