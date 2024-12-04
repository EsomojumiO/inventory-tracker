import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './theme';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/en-gb'; // Import the locale you want to use

// Context Providers
import { AuthProvider } from './hooks/useAuth';
import { NotificationProvider } from './hooks/useNotification';
import { InventoryProvider } from './context/InventoryContext';
import { SnackbarProvider } from 'notistack';
import { SalesProvider } from './context/SalesContext';
import { CustomerProvider } from './context/CustomerContext';
import { PaymentProvider } from './context/PaymentContext';
import { SupplierProvider } from './context/SupplierContext';
import { ReportProvider } from './context/ReportContext';
import { ReceiptProvider } from './context/ReceiptContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CashProvider } from './context/CashContext';
import { PromotionsProvider } from './context/PromotionsContext';
import { AccountingProvider } from './context/AccountingContext';

// Components
import MainLayout from './components/layout/MainLayout';
import Login from './components/auth/Login';
import SignUp from './components/auth/SignUp';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/analytics/Dashboard';
import InventoryManager from './components/inventory/InventoryManager';
import StockManagement from './components/inventory/StockManagement';
import ReorderManagement from './components/inventory/reorder/ReorderManagement';
import SalesPage from './components/sales/SalesPage';
import SalesHistory from './components/sales/SalesHistory';
import POSManager from './components/pos/POSManager';
import OrdersPage from './components/orders/OrdersPage';
import CustomersPage from './components/customer/CustomersPage';
import SupplierManagement from './components/supplier/SupplierManagement';
import UserManagement from './components/users/UserManagement';
import SettingsPage from './components/settings/SettingsPage';
import Profile from './components/profile/BusinessProfile';
import DocumentsPage from './components/orders/DocumentsPage';
import NotFound from './components/NotFound';
import Notification from './components/Notification';
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';
import InventoryReports from './components/inventory/reports/InventoryReports';
import ReceiptsPage from './components/pos/receipts/ReceiptsPage';
import MainDashboard from './components/dashboard/MainDashboard';
import SalesTerminal from './components/pos/sales/SalesTerminal';
import CashManagement from './components/pos/cash/CashManagement';
import PromotionsManager from './components/pos/promotions/PromotionsManager';
import AccountingDashboard from './components/accounting/AccountingDashboard';

function App() {
  const theme = createAppTheme('light');

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3}>
          <AuthProvider>
            <NotificationProvider>
              <InventoryProvider>
                <SupplierProvider>
                  <PaymentProvider>
                    <CustomerProvider>
                      <SalesProvider>
                        <ReportProvider>
                          <CurrencyProvider>
                            <CashProvider>
                              <PromotionsProvider>
                                <ReceiptProvider>
                                  <AccountingProvider>
                                    <Router>
                                      <Notification />
                                      <Routes>
                                        {/* Public Routes */}
                                        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                                        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
                                        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

                                        {/* Private Routes */}
                                        <Route path="/" element={
                                          <PrivateRoute>
                                            <MainLayout />
                                          </PrivateRoute>
                                        }>
                                          <Route index element={<MainDashboard />} />
                                          <Route path="inventory">
                                            <Route index element={<Navigate to="products" />} />
                                            <Route path="products" element={<InventoryManager />} />
                                            <Route path="stock" element={<StockManagement />} />
                                            <Route path="reorder" element={<ReorderManagement />} />
                                            <Route path="supplier" element={<SupplierManagement />} />
                                            <Route path="reports" element={<InventoryReports />} />
                                          </Route>
                                          <Route path="sales" element={<SalesPage />} />
                                          <Route path="sales/history" element={<SalesHistory />} />
                                          <Route path="pos">
                                            <Route index element={<POSManager />} />
                                            <Route path="sales-terminal" element={<SalesTerminal />} />
                                            <Route path="cash" element={<CashManagement />} />
                                            <Route path="receipts" element={<ReceiptsPage />} />
                                            <Route path="promotions" element={<PrivateRoute><PromotionsManager /></PrivateRoute>} />
                                          </Route>
                                          <Route path="orders" element={<OrdersPage />} />
                                          <Route path="orders/documents" element={<DocumentsPage />} />
                                          <Route path="customers" element={<CustomersPage />} />
                                          <Route path="suppliers" element={<SupplierManagement />} />
                                          <Route path="users" element={<UserManagement />} />
                                          <Route path="settings" element={<SettingsPage />} />
                                          <Route path="profile" element={<Profile />} />
                                          <Route path="accounting" element={<AccountingDashboard />} />
                                        </Route>

                                        {/* 404 Route */}
                                        <Route path="*" element={<NotFound />} />
                                      </Routes>
                                    </Router>
                                  </AccountingProvider>
                                </ReceiptProvider>
                              </PromotionsProvider>
                            </CashProvider>
                          </CurrencyProvider>
                        </ReportProvider>
                      </SalesProvider>
                    </CustomerProvider>
                  </PaymentProvider>
                </SupplierProvider>
              </InventoryProvider>
            </NotificationProvider>
          </AuthProvider>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;