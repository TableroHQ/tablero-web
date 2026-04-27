import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Menu from '@/pages/Menu';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Reservations from '@/pages/Reservations';
import Checkout from '@/pages/Checkout';
import Loyalty from '@/pages/Loyalty';
import Reviews from '@/pages/Reviews';
import KDS from '@/pages/KDS';
import Waiter from '@/pages/Waiter';
import POS from '@/pages/POS';
import Courier from '@/pages/Courier';
import Admin from '@/pages/Admin';
import '@/App.css';

const C = (Page) => (
  <Layout><Page/></Layout>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Consumer pages — wrapped in Layout */}
        <Route path="/" element={C(Landing)} />
        <Route path="/menu" element={C(Menu)} />
        <Route path="/login" element={C(Auth)} />
        <Route path="/dashboard" element={C(Dashboard)} />
        <Route path="/reservations" element={C(Reservations)} />
        <Route path="/checkout" element={C(Checkout)} />
        <Route path="/loyalty" element={C(Loyalty)} />
        <Route path="/reviews" element={C(Reviews)} />
        {/* Operational dashboards — own layout */}
        <Route path="/kds" element={<KDS/>} />
        <Route path="/waiter" element={<Waiter/>} />
        <Route path="/pos" element={<POS/>} />
        <Route path="/courier" element={<Courier/>} />
        <Route path="/admin" element={<Admin/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
