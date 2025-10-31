import React from "react";
import "./styles/global.css"; // Import CSS toàn cục
import "./App.css"; // Giữ lại CSS cũ cho tương thích ngược
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

// Import các component mới (với đuôi .new) để demo
// Bạn có thể chuyển đổi giữa phiên bản cũ và mới bằng cách thay đổi các import
// import Header from "./components/Header"; // Header gốc
import Header from "./components/Header"; // Use existing Header component

import Footer from "./components/Footer"; // Footer gốc
// import Footer from "./components/Footer.new"; // Footer mới (bỏ comment để sử dụng)
import FloatContact from "./components/FloatContact";

import NotificationContainer from "./components/Notification";

// Các trang người dùng
import HomePage from "./pages/HomePage.new"; // Sử dụng trang chủ responsive mới
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import LoginPage from "./pages/LoginPage";

// Các trang quản trị
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardAdminPage from "./pages/admin/DashboardAdminPage";
import ProductListAdminPage from "./pages/admin/ProductListAdminPage";
import ProductEditAdminPage from "./pages/admin/ProductEditAdminPage";
import OrderListAdminPage from "./pages/admin/OrderListAdminPage";
import CustomerListAdminPage from "./pages/admin/CustomerListAdminPage";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <Router>
            <Header />
            <main className="container mt-3">
              <Routes>
                {/* Các route người dùng */}
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<LoginPage />} />
                {/* Layout quản trị với các route con */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<DashboardAdminPage />} />
                  <Route path="products" element={<ProductListAdminPage />} />
                  <Route path="products/new" element={<ProductEditAdminPage />} />
                  <Route path="products/:id/edit" element={<ProductEditAdminPage />} />
                  <Route path="orders" element={<OrderListAdminPage />} />
                  <Route path="customers" element={<CustomerListAdminPage />} />
                  {/* Có thể thêm các route admin khác ở đây */}
                </Route>
              </Routes>
            </main>
            <Footer />
            {/* Floating contact buttons (Zalo + Call) */}
            <FloatContact />
            <NotificationContainer />
          </Router>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
