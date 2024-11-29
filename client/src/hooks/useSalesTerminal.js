import { useState, useCallback, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency } from '../utils/formatCurrency';

export const useSalesTerminal = () => {
  // State management
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState({ cash: 0, card: 0 });
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    transactionCount: 0,
    averageTransaction: 0,
    topProducts: []
  });
  const [offlineMode, setOfflineMode] = useState(false);
  const [pendingSync, setPendingSync] = useState([]);

  const { inventory, updateInventory } = useInventory();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = 0.075; // 7.5% tax rate
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [cart]);

  // Product management
  const addToCart = useCallback((product, quantity = 1) => {
    if (!product.inStock) {
      showError('Product out of stock');
      return false;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stockQuantity) {
          showError('Insufficient stock');
          return prevCart;
        }
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    return true;
  }, [showError]);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity) => {
    setCart(prevCart => {
      const product = inventory.find(p => p.id === productId);
      if (newQuantity > product.stockQuantity) {
        showError('Insufficient stock');
        return prevCart;
      }
      return prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ).filter(item => item.quantity > 0);
    });
  }, [inventory, showError]);

  const updatePrice = useCallback((productId, newPrice) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, price: newPrice }
          : item
      )
    );
  }, []);

  // Barcode handling
  const handleBarcodeScan = useCallback(async (barcode) => {
    try {
      const product = inventory.find(p => p.barcode === barcode);
      if (product) {
        addToCart(product);
        setBarcodeInput('');
      } else {
        showError('Product not found');
      }
    } catch (error) {
      showError('Error processing barcode');
    }
  }, [inventory, addToCart, showError]);

  // Payment processing
  const processPayment = useCallback(async (paymentDetails) => {
    try {
      const { subtotal, tax, total } = calculateTotals();
      const saleData = {
        items: cart,
        subtotal,
        tax,
        total,
        paymentMethod: splitPayment ? 'split' : paymentMethod,
        paymentAmounts: splitPayment ? paymentAmounts : { [paymentMethod]: total },
        timestamp: new Date(),
        cashierId: user.id,
        offlineCreated: offlineMode
      };

      if (offlineMode) {
        // Store transaction for later sync
        setPendingSync(prev => [...prev, saleData]);
        showSuccess('Sale completed (offline mode)');
      } else {
        // Process online transaction
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(saleData)
        });

        if (!response.ok) throw new Error('Failed to process sale');
        
        // Update inventory
        cart.forEach(item => {
          updateInventory(item.id, -item.quantity);
        });

        showSuccess('Sale completed successfully');
      }

      // Clear cart and reset payment state
      setCart([]);
      setSplitPayment(false);
      setPaymentAmounts({ cash: 0, card: 0 });
      
      // Update daily stats
      fetchDailyStats();

      return true;
    } catch (error) {
      showError('Error processing payment: ' + error.message);
      return false;
    }
  }, [cart, calculateTotals, paymentMethod, splitPayment, paymentAmounts, offlineMode, user.id, updateInventory, showSuccess, showError]);

  // Fetch daily statistics
  const fetchDailyStats = useCallback(async () => {
    try {
      const response = await fetch('/api/sales/daily-stats');
      const data = await response.json();
      setDailyStats(data);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    }
  }, []);

  // Sync offline transactions
  const syncOfflineTransactions = useCallback(async () => {
    if (pendingSync.length === 0) return;

    try {
      for (const transaction of pendingSync) {
        await fetch('/api/sales/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transaction)
        });
      }
      setPendingSync([]);
      showSuccess('Offline transactions synced successfully');
    } catch (error) {
      showError('Error syncing offline transactions');
    }
  }, [pendingSync, showSuccess, showError]);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      setOfflineMode(false);
      syncOfflineTransactions();
    };
    const handleOffline = () => setOfflineMode(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineTransactions]);

  // Initial setup
  useEffect(() => {
    fetchDailyStats();
  }, [fetchDailyStats]);

  return {
    // State
    cart,
    searchQuery,
    barcodeInput,
    paymentMethod,
    splitPayment,
    paymentAmounts,
    dailyStats,
    offlineMode,
    pendingSync,

    // Setters
    setSearchQuery,
    setBarcodeInput,
    setPaymentMethod,
    setSplitPayment,
    setPaymentAmounts,

    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    updatePrice,
    handleBarcodeScan,
    processPayment,
    calculateTotals
  };
};
