import React, { createContext, useContext, useState, useMemo } from 'react';
import { products, getProductById, getAllProducts, getProductsByCategory, getLowStockProducts } from '../data/sampleData/productData';

const InventoryContext = createContext();

// Convert our sample products to the expected format
const sampleProducts = products.map(product => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  quantity: product.stockLevel,
  category: product.category,
  sku: product.sku,
  reorderPoint: product.reorderPoint,
  supplier: product.supplier,
  specifications: product.specifications,
  location: product.location,
  status: product.status
}));

// Get unique categories from products
const categories = [...new Set(products.map(product => product.category))];

const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState(sampleProducts);
  const [sales, setSales] = useState([]);

  const value = useMemo(() => ({
    inventory,
    setInventory,
    categories,
    addItem: (item) => {
      setInventory(prev => [...prev, item]);
    },
    updateItem: (id, updates) => {
      setInventory(prev =>
        prev.map(item => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    deleteItem: (id) => {
      setInventory(prev => prev.filter(item => item.id !== id));
    },
    getItem: (id) => inventory.find(item => item.id === id),
    getItemsByCategory: (category) => inventory.filter(item => item.category === category),
    getLowStockItems: () => inventory.filter(item => item.quantity <= item.reorderPoint),
    sales,
    addSale: (sale) => {
      const product = inventory.find(p => p.id === sale.productId);
      if (product && product.quantity >= sale.quantity) {
        // Update inventory
        setInventory(prev =>
          prev.map(item =>
            item.id === sale.productId
              ? { ...item, quantity: item.quantity - sale.quantity }
              : item
          )
        );
        
        // Add sale record
        setSales([...sales, {
          ...sale,
          productName: product.name,
          price: product.price,
          date: new Date().toISOString()
        }]);
        return true;
      }
      return false;
    },
    formatCurrency: (amount) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN'
      }).format(amount);
    }
  }), [inventory, sales]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export { InventoryProvider, useInventory };
