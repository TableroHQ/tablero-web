'use client';
import React from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Phone, MapPin, Send, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TOPIC_KEYS = ['topic1', 'topic2', 'topic3', 'topic4', 'topic5', 'topic6'];

export default function Contact() {
  const t = useTranslations('contact');
  const tc = useTranslations('common');
  const [form, setForm] = React.useState({ name: '', email: '', topic: '', message: '' });
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(t('fillRequired'));
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    setSent(true);
    toast.success(t('sentToast'));
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16">
      <div className="label-eyebrow">{t('eyebrow')}</div>
      <h1 className="font-display text-5xl md:text-6xl mt-2">{t('title')}</h1>
      <p className="mt-3 text-ink-body max-w-xl">{t('intro')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-border p-7 md:p-8">
          {sent ? (
            <div className="py-10 text-center">
              <div className="h-16 w-16 rounded-full bg-ok-bg text-ok flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
              <h2 className="font-display text-3xl">{t('receivedTitle')}</h2>
              <p className="mt-2 text-ink-body">{t.rich('receivedText', { email: form.email, b: (c) => <strong>{c}</strong> })}</p>
              <button onClick={() => { setSent(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                className="btn-outline mt-6">{t('sendAnother')}</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <h2 className="font-display text-2xl mb-6">{t('formTitle')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-eyebrow">{t('nameLabel')}</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('namePlaceholder')}
                    className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="label-eyebrow">{t('emailLabel')}</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder={t('emailPlaceholder')}
                    className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="label-eyebrow">{t('topicLabel')}</label>
                <select value={form.topic} onChange={e => set('topic', e.target.value)}
                  className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary appearance-none">
                  <option value="">{t('topicSelect')}</option>
                  {TOPIC_KEYS.map(k => <option key={k} value={k}>{t(k)}</option>)}
                </select>
              </div>
              <div>
                <label className="label-eyebrow">{t('messageLabel')}</label>
                <textarea value={form.message} onChange={e => set('message', e.target.value)}
                  placeholder={t('messagePlaceholder')}
                  className="mt-2 w-full bg-cream-sub rounded-xl px-4 py-3 font-fn outline-none focus:ring-2 focus:ring-primary min-h-[140px] resize-y" />
              </div>
              <button type="submit" disabled={sending}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? tc('sending') : t('sendMessage')}
              </button>
            </form>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-border p-6">
            <div className="label-eyebrow mb-4">{t('reachDirectly')}</div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5"><Mail size={16} /></div>
                <div>
                  <div className="text-xs font-mono text-ink-muted">{t('emailUpper')}</div>
                  <a href="mailto:hello@tablero.com" className="text-sm font-fn text-ink hover:text-primary transition">hello@tablero.com</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5"><Phone size={16} /></div>
                <div>
                  <div className="text-xs font-mono text-ink-muted">{t('phoneUpper')}</div>
                  <a href="tel:+15550001234" className="text-sm font-fn text-ink hover:text-primary transition">+1 (555) 000-1234</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5"><MapPin size={16} /></div>
                <div>
                  <div className="text-xs font-mono text-ink-muted">{t('hqUpper')}</div>
                  <span className="text-sm font-fn text-ink">{t('hqAddress1')}<br />{t('hqAddress2')}</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl border border-border p-6">
            <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4"><MessageCircle size={18} /></div>
            <div className="font-fn font-semibold text-ink">{t('liveChat')}</div>
            <p className="mt-1 text-sm text-ink-body">{t('liveChatDesc')}</p>
            <button className="mt-4 w-full py-2.5 rounded-full bg-secondary text-white font-fn font-medium text-sm hover:bg-amber2-dark transition">
              {t('startChat')}
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-border p-6">
            <div className="label-eyebrow mb-2">{t('responseTimes')}</div>
            <ul className="space-y-2 text-sm text-ink-body">
              <li className="flex justify-between"><span>{t('rtLiveChat')}</span><span className="font-mono text-ok">{t('rtLiveChatVal')}</span></li>
              <li className="flex justify-between"><span>{t('rtEmail')}</span><span className="font-mono text-ok">{t('rtEmailVal')}</span></li>
              <li className="flex justify-between"><span>{t('rtPhone')}</span><span className="font-mono text-ok">{t('rtPhoneVal')}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
