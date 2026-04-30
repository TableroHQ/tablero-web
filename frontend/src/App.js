import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from '@/components/Layout';
import RoleSwitcher from '@/components/RoleSwitcher';
import LiveSimulator from '@/components/LiveSimulator';
import { StoreProvider } from '@/lib/store';

import Landing from '@/pages/Landing';
import Menu from '@/pages/Menu';
import Auth from '@/pages/Auth';
import ForgotPassword from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import Reservations from '@/pages/Reservations';
import Checkout from '@/pages/Checkout';
import Loyalty from '@/pages/Loyalty';
import Reviews from '@/pages/Reviews';
import Profile from '@/pages/Profile';
import TopUp from '@/pages/TopUp';
import Notifications from '@/pages/Notifications';
import OrderDetail from '@/pages/OrderDetail';
import DeliveryTracking from '@/pages/DeliveryTracking';
import QrScan from '@/pages/QrScan';

import KDS from '@/pages/KDS';
import Waiter from '@/pages/Waiter';
import POS from '@/pages/POS';
import Courier from '@/pages/Courier';
import Admin from '@/pages/Admin';
import MenuMgmt from '@/pages/admin/MenuMgmt';
import TablesMgmt from '@/pages/admin/TablesMgmt';
import StaffMgmt from '@/pages/admin/StaffMgmt';
import ReviewsModeration from '@/pages/admin/ReviewsModeration';
import Promotions from '@/pages/admin/Promotions';
import Refunds from '@/pages/admin/Refunds';
import RevenueReport from '@/pages/admin/RevenueReport';
import '@/App.css';

const C = (P) => <Layout><P/></Layout>;

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <LiveSimulator/>
        <Routes>
          {/* Consumer pages */}
          <Route path="/" element={C(Landing)}/>
          <Route path="/menu" element={C(Menu)}/>
          <Route path="/login" element={C(Auth)}/>
          <Route path="/forgot-password" element={C(ForgotPassword)}/>
          <Route path="/dashboard" element={C(Dashboard)}/>
          <Route path="/reservations" element={C(Reservations)}/>
          <Route path="/checkout" element={C(Checkout)}/>
          <Route path="/loyalty" element={C(Loyalty)}/>
          <Route path="/reviews" element={C(Reviews)}/>
          <Route path="/profile" element={C(Profile)}/>
          <Route path="/topup" element={C(TopUp)}/>
          <Route path="/notifications" element={C(Notifications)}/>
          <Route path="/orders/:id" element={C(OrderDetail)}/>
          <Route path="/delivery/:id" element={C(DeliveryTracking)}/>
          <Route path="/qr" element={<QrScan/>}/>

          {/* Operational dashboards (own layout) */}
          <Route path="/kds" element={<KDS/>}/>
          <Route path="/waiter" element={<Waiter/>}/>
          <Route path="/pos" element={<POS/>}/>
          <Route path="/courier" element={<Courier/>}/>
          <Route path="/admin" element={<Admin/>}/>
          <Route path="/admin/menu" element={<MenuMgmt/>}/>
          <Route path="/admin/tables" element={<TablesMgmt/>}/>
          <Route path="/admin/staff" element={<StaffMgmt/>}/>
          <Route path="/admin/reviews" element={<ReviewsModeration/>}/>
          <Route path="/admin/promotions" element={<Promotions/>}/>
          <Route path="/admin/refunds" element={<Refunds/>}/>
          <Route path="/admin/revenue" element={<RevenueReport/>}/>
        </Routes>
        <RoleSwitcher/>
        <Toaster position="top-right" theme="light" richColors closeButton toastOptions={{
          style: { background: '#fff', border: '1px solid #E8E4DF', borderRadius: '16px', fontFamily: 'Figtree, sans-serif' }
        }}/>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
