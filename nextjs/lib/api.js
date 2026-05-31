// Mock API — imitates the ~85 endpoints from Tablero docs with tiny delays + fake responses.
// No real network. Used to give a realistic feel (loading states, errors).
const wait = (ms = 350) => new Promise(r => setTimeout(r, ms));

const ok = async (data, ms) => { await wait(ms); return { ok: true, data }; };
const fail = async (msg, ms) => { await wait(ms); return { ok: false, error: msg }; };

export const api = {
  // identity
  register: (body) => ok({ user: { ...body }, token: 'jwt.mock' }),
  login: (id, pw) => id && pw ? ok({ token: 'jwt.mock', refresh: 'refresh.mock' }) : fail('Invalid credentials'),
  forgotPassword: (email) => email?.includes('@') ? ok({ sent: true, expiresIn: 600 }) : fail('Email not found'),
  verifyOtp: (otp) => otp === '000000' || otp?.length === 6 ? ok({ resetToken: 'reset.mock' }) : fail('Invalid OTP'),
  resetPassword: () => ok({ reset: true }),

  // restaurant
  getRestaurant: (id) => ok({ id, name: 'Tablero · Downtown' }),
  getPublicMenu: () => ok({ categories: [] }),
  getQr: (tableId) => ok({ url: `/qr?t=${tableId}` }),

  // reservations
  availability: () => ok({ slots: ['12:00','18:30','19:00','19:30','20:00'] }),
  createReservation: (body) => ok({ id: `r_${Date.now()}`, status: 'CONFIRMED', ...body }),
  cancelReservation: (id) => ok({ id, status: 'CANCELLED' }),
  confirmReservation: (id) => ok({ id, status: 'CONFIRMED' }),
  seatReservation: (id) => ok({ id, status: 'SEATED' }),
  completeReservation: (id) => ok({ id, status: 'COMPLETED' }),
  noShow: (id) => ok({ id, status: 'NO_SHOW' }),

  // orders
  placeOrder: (body) => ok({ id: `o_${Date.now()}`, status: 'PENDING', ...body }),
  cancelOrder: (id) => ok({ id, status: 'CANCELLED' }),
  updateKitchenStatus: (itemId, status) => ok({ itemId, status }),
  markServed: (id) => ok({ id, status: 'SERVED' }),
  call86: (itemId) => ok({ itemId, is_available: false }),
  callWaiter: (waiterId) => ok({ waiterId, pushed: true }),

  // payment
  getBalance: () => ok({ available: 84, held: 0, loyalty: 1240 }),
  topup: (amount) => amount > 0 ? ok({ newBalance: 84 + amount }) : fail('Invalid amount'),
  payInvoice: (id, method) => ok({ id, status: 'PAID', method }),
  splitInvoice: (id, shares) => ok({ id, shares }),
  refund: (id) => ok({ id, status: 'REFUNDED' }),
  loyaltyRedeem: (itemId) => ok({ itemId, status: 'REDEEMED' }),

  // delivery
  createDelivery: (body) => ok({ id: `d_${Date.now()}`, status: 'PENDING_PICKUP', ...body }),
  trackDelivery: (id) => ok({ id, checkpoints: [] }),
  confirmReceipt: (id) => ok({ id, status: 'CONFIRMED' }),
  acceptDelivery: (id) => Math.random() > 0.2 ? ok({ id, status: 'ASSIGNED' }) : fail('Sorry, already taken'),
  addCheckpoint: (id, point) => ok({ id, point }),
  markDelivered: (id) => ok({ id, status: 'DELIVERED' }),
  courierStatus: (online) => ok({ online }),

  // notifications / reviews
  getNotifications: () => ok([]),
  submitReview: (body) => ok({ id: `rv_${Date.now()}`, ...body, moderation: 'PENDING' }),
  publishReview: (id) => ok({ id, published: true }),
  deleteReview: (id) => ok({ id, deleted: true }),
  sendPromotion: (body) => ok({ sent: 4214, ...body }),

  // admin / staff / menu crud
  createStaff: (body) => ok({ id: `s_${Date.now()}`, ...body }),
  changeRole: (id, role) => ok({ id, role }),
  suspend: (id) => ok({ id, status: 'SUSPENDED' }),
  createCategory: (body) => ok({ id: `c_${Date.now()}`, ...body }),
  createMenuItem: (body) => ok({ id: `m_${Date.now()}`, ...body }),
  updateMenuItem: (id, body) => ok({ id, ...body }),
  deleteMenuItem: (id) => ok({ id, deleted: true }),
  createTable: (body) => ok({ id: `t_${Date.now()}`, ...body }),
  regenQr: (id) => ok({ id, qrUrl: `/qr?t=${id}&v=${Date.now()}` }),
};
