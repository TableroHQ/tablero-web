'use client';
// Simulates live Kafka events — random nudges to the notification store every ~22 seconds.
import React from 'react';
import { useStore } from '@/lib/store';

const events = [
  { type: 'order.ready', title: 'Order #4412 is ready', body: 'Chef Marcus just rang — table 7.' },
  { type: 'bonus.earned', title: 'You earned +25 points', body: 'Your last visit paid off.' },
  { type: 'reservation.confirmed', title: 'Reservation confirmed', body: 'Sat Feb 8 · 19:30 · party of 2.' },
  { type: 'delivery.checkpoint', title: 'Your courier is 300m away', body: 'Jamie just passed Birch & 4th.' },
  { type: 'payment.succeeded', title: 'Payment received', body: '$48.50 charged to card ending •4242.' },
  { type: 'order.served', title: 'Order served', body: 'Enjoy! Rating opens in 15 min.' },
];

export default function LiveSimulator() {
  const [, s] = useStore();
  React.useEffect(() => {
    const t = setInterval(() => {
      // Only signed-in users receive notifications — guests get none.
      const { hasSession, user } = s.get();
      if (!hasSession || user.role === 'GUEST') return;
      if (Math.random() < 0.5) {
        const e = events[Math.floor(Math.random() * events.length)];
        s.addNotif(e);
      }
    }, 22000);
    return () => clearInterval(t);
  }, [s]);
  return null;
}
