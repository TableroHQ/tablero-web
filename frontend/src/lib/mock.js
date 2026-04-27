// Bite — mock data layer for the SPA. No backend.

export const IMG = {
  logo: 'https://static.prod-images.emergentagent.com/jobs/d78e7132-dd0c-4247-aef3-70a3e1819389/images/6a66c426fc9dfea8b4def610ca4e613f6fc1d25ba980e6184fc9291bd39da038.png',
  texture: 'https://static.prod-images.emergentagent.com/jobs/d78e7132-dd0c-4247-aef3-70a3e1819389/images/b9361a2768fec277e17d528c557bc9f993367982ad19c889094a78f7daf3538a.png',
  interior: 'https://images.pexels.com/photos/35505245/pexels-photo-35505245.jpeg',
  interior2: 'https://images.pexels.com/photos/29692582/pexels-photo-29692582.jpeg',
  chef: 'https://images.pexels.com/photos/32742915/pexels-photo-32742915.jpeg',
  burger: 'https://images.pexels.com/photos/29368033/pexels-photo-29368033.jpeg',
  pasta: 'https://images.unsplash.com/photo-1611270629569-8b357cb88da9',
  salad: 'https://images.pexels.com/photos/36442209/pexels-photo-36442209.jpeg',
  dessert: 'https://images.pexels.com/photos/34952057/pexels-photo-34952057.jpeg',
};

export const MENU = [
  { id: 'm1', cat: 'Mains', name: 'Smokehouse Burger', desc: 'Aged cheddar, smoked aioli, brioche bun, hand-cut fries.', price: 18.5, img: IMG.burger, allergens: ['gluten', 'dairy'], available: true },
  { id: 'm2', cat: 'Mains', name: 'Truffle Tagliatelle', desc: 'Hand-rolled pasta, black truffle, parmesan cream.', price: 24, img: IMG.pasta, allergens: ['gluten', 'dairy'], available: true },
  { id: 'm3', cat: 'Starters', name: 'Garden Buddha Bowl', desc: 'Roasted veggies, tahini, quinoa, soft herbs.', price: 14.5, img: IMG.salad, allergens: ['sesame'], available: true },
  { id: 'm4', cat: 'Desserts', name: 'Bitter Chocolate Cake', desc: 'Dark ganache, sea salt, raspberry coulis.', price: 9, img: IMG.dessert, allergens: ['dairy', 'eggs'], available: true },
  { id: 'm5', cat: 'Mains', name: 'Charred Octopus', desc: 'Smoky paprika, white bean purée, lemon.', price: 28, img: IMG.salad, allergens: ['shellfish'], available: false },
  { id: 'm6', cat: 'Starters', name: 'Burrata & Heirloom', desc: 'Tomatoes, basil oil, sourdough.', price: 16, img: IMG.salad, allergens: ['gluten', 'dairy'], available: true },
];

export const CATS = ['All', 'Starters', 'Mains', 'Desserts'];

export const RESERVATIONS = [
  { id: 'r1', date: '2026-02-04', slot: '19:30', table: 'T-07', zone: 'Terrace', party: 4, status: 'CONFIRMED' },
  { id: 'r2', date: '2026-01-20', slot: '20:00', table: 'T-12', zone: 'Indoor', party: 2, status: 'COMPLETED' },
];

export const ORDERS = [
  { id: 'o1', date: '2026-01-12', total: 64.5, status: 'COMPLETED', items: 3, type: 'DINE-IN' },
  { id: 'o2', date: '2026-01-05', total: 41.0, status: 'COMPLETED', items: 2, type: 'DELIVERY' },
];

export const BONUSES = [
  { id: 'b1', name: 'Classic Hotdog', cost: 50, img: IMG.burger },
  { id: 'b2', name: 'Smokehouse Burger', cost: 120, img: IMG.burger },
  { id: 'b3', name: 'Soda Refill', cost: 30, img: IMG.salad },
  { id: 'b4', name: 'Bitter Chocolate Cake', cost: 80, img: IMG.dessert },
];

export const KDS_TICKETS = [
  { id: 'k1', table: 'T-07', server: 'Maya', elapsedSec: 245, status: 'PREPARING', items: [
    { name: 'Smokehouse Burger', mods: 'no pickles', qty: 1, status: 'PREPARING' },
    { name: 'Buddha Bowl', mods: 'extra tahini', qty: 1, status: 'READY' },
  ]},
  { id: 'k2', table: 'T-12', server: 'Leo', elapsedSec: 90, status: 'QUEUED', items: [
    { name: 'Truffle Tagliatelle', mods: '', qty: 2, status: 'QUEUED' },
    { name: 'Burrata & Heirloom', mods: '', qty: 1, status: 'QUEUED' },
  ]},
  { id: 'k3', table: 'T-03', server: 'Maya', elapsedSec: 510, status: 'READY', items: [
    { name: 'Bitter Chocolate Cake', mods: '', qty: 2, status: 'READY' },
  ]},
  { id: 'k4', table: 'DLV-441', server: 'Delivery', elapsedSec: 130, status: 'PREPARING', items: [
    { name: 'Smokehouse Burger', mods: 'medium', qty: 2, status: 'PREPARING' },
    { name: 'Soda', mods: '', qty: 2, status: 'READY' },
  ]},
];

export const TABLES = Array.from({ length: 12 }).map((_, i) => {
  const id = i + 1;
  const statuses = ['EMPTY', 'OCCUPIED', 'BILL_REQUESTED'];
  const s = statuses[id % 3];
  return { id: `T-${String(id).padStart(2, '0')}`, zone: id < 5 ? 'Indoor' : id < 9 ? 'Terrace' : 'Bar', seats: id % 3 === 0 ? 6 : id % 2 ? 4 : 2, status: s, total: s === 'EMPTY' ? 0 : 38 + id * 7.5 };
});

export const COURIER_ORDERS = [
  { id: 'd1', address: '12 Birch Lane, Apt 4', distance: '1.2 km', payout: 6.5, items: 3, status: 'AVAILABLE' },
  { id: 'd2', address: '88 Maple Ave', distance: '2.4 km', payout: 8.0, items: 2, status: 'AVAILABLE' },
  { id: 'd3', address: '5 Riverside Park', distance: '0.6 km', payout: 4.0, items: 1, status: 'ASSIGNED' },
];

export const REVIEWS = [
  { id: 'rv1', author: 'Sofia M.', rating: 5, comment: 'Best truffle pasta in town. Service was attentive without being intrusive.', date: '2026-01-08' },
  { id: 'rv2', author: 'Daniel R.', rating: 4, comment: 'Loved the atmosphere. Burger could have arrived a touch warmer.', date: '2026-01-04' },
  { id: 'rv3', author: 'Aria K.', rating: 5, comment: 'The chocolate cake. That\'s it. That\'s the review.', date: '2025-12-29' },
];

export const SALES_DATA = [
  { day: 'Mon', revenue: 4200, orders: 84 },
  { day: 'Tue', revenue: 3800, orders: 71 },
  { day: 'Wed', revenue: 5100, orders: 102 },
  { day: 'Thu', revenue: 6200, orders: 121 },
  { day: 'Fri', revenue: 9100, orders: 178 },
  { day: 'Sat', revenue: 11200, orders: 214 },
  { day: 'Sun', revenue: 8400, orders: 162 },
];

export const STAFF = [
  { id: 's1', name: 'Maya Holloway', role: 'Waiter', status: 'On shift', branch: 'Downtown' },
  { id: 's2', name: 'Marcus Chen', role: 'Chef', status: 'On shift', branch: 'Downtown' },
  { id: 's3', name: 'Priya Anand', role: 'Cashier', status: 'Off', branch: 'Downtown' },
  { id: 's4', name: 'Leo Vargas', role: 'Waiter', status: 'On shift', branch: 'Riverside' },
  { id: 's5', name: 'Jamie Okafor', role: 'Courier', status: 'On shift', branch: 'Downtown' },
];

export const TIME_SLOTS = ['12:00', '12:30', '13:00', '13:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
