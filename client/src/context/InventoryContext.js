import React, { createContext, useContext, useState } from 'react';

const InventoryContext = createContext();

const sampleProducts = [
  { id: 1, name: 'Dell XPS 13 Laptop', description: 'Intel Core i7, 16GB RAM, 512GB SSD', price: 850000, quantity: 5, category: 'Laptops' },
  { id: 2, name: 'HP Pavilion Desktop', description: 'AMD Ryzen 5, 8GB RAM, 1TB HDD', price: 450000, quantity: 8, category: 'Desktops' },
  { id: 3, name: 'MacBook Pro M1', description: '8-core CPU, 8GB RAM, 256GB SSD', price: 950000, quantity: 3, category: 'Laptops' },
  { id: 4, name: 'Logitech MX Master 3', description: 'Wireless Mouse', price: 45000, quantity: 15, category: 'Accessories' },
  { id: 5, name: 'Samsung 27" Monitor', description: '4K UHD, 60Hz refresh rate', price: 180000, quantity: 10, category: 'Monitors' },
  { id: 6, name: 'Mechanical Keyboard', description: 'RGB backlit, Cherry MX switches', price: 35000, quantity: 20, category: 'Accessories' },
  { id: 7, name: 'RTX 3080 Graphics Card', description: '10GB GDDR6X', price: 550000, quantity: 4, category: 'Components' },
  { id: 8, name: 'Intel Core i9 12900K', description: '16-core processor', price: 280000, quantity: 6, category: 'Components' },
  { id: 9, name: 'AirPods Pro', description: 'Active noise cancellation', price: 120000, quantity: 12, category: 'Audio' },
  { id: 10, name: 'Gaming Chair', description: 'Ergonomic design, adjustable', price: 85000, quantity: 8, category: 'Furniture' },
  { id: 11, name: 'Lenovo ThinkPad', description: 'Intel Core i5, 8GB RAM, 256GB SSD', price: 420000, quantity: 7, category: 'Laptops' },
  { id: 12, name: 'ASUS ROG Monitor', description: '32" 144Hz Gaming Monitor', price: 250000, quantity: 5, category: 'Monitors' },
  { id: 13, name: 'Corsair RAM 32GB', description: 'DDR4 3200MHz (2x16GB)', price: 75000, quantity: 15, category: 'Components' },
  { id: 14, name: 'External SSD 1TB', description: 'USB-C, 1050MB/s', price: 65000, quantity: 10, category: 'Storage' },
  { id: 15, name: 'Webcam 4K', description: 'Auto-focus, built-in mic', price: 28000, quantity: 18, category: 'Accessories' },
  { id: 16, name: 'Gaming Mouse', description: '16000 DPI, RGB', price: 25000, quantity: 25, category: 'Accessories' },
  { id: 17, name: 'UPS 1500VA', description: 'Battery backup system', price: 95000, quantity: 6, category: 'Power' },
  { id: 18, name: 'iPad Pro 12.9"', description: 'M1 chip, 256GB', price: 680000, quantity: 4, category: 'Tablets' },
  { id: 19, name: 'Network Switch', description: '24-port Gigabit', price: 85000, quantity: 7, category: 'Networking' },
  { id: 20, name: 'Wireless Router', description: 'WiFi 6, dual-band', price: 45000, quantity: 12, category: 'Networking' }
];

export const InventoryProvider = ({ children }) => {
  const [inventory, setInventory] = useState(sampleProducts);
  const [sales, setSales] = useState([]);

  const addProduct = (product) => {
    setInventory([...inventory, { ...product, id: inventory.length + 1 }]);
  };

  const updateProduct = (updatedProduct) => {
    setInventory(inventory.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    ));
  };

  const deleteProduct = (productId) => {
    setInventory(inventory.filter(product => product.id !== productId));
  };

  const addSale = (sale) => {
    const product = inventory.find(p => p.id === sale.productId);
    if (product && product.quantity >= sale.quantity) {
      // Update inventory
      updateProduct({
        ...product,
        quantity: product.quantity - sale.quantity
      });
      
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
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <InventoryContext.Provider value={{
      inventory,
      sales,
      addProduct,
      updateProduct,
      deleteProduct,
      addSale,
      formatCurrency
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export default InventoryContext;
