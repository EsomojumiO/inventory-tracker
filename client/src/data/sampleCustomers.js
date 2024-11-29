export const sampleCustomers = [
  {
    _id: '1',
    firstName: 'Oluwaseun',
    lastName: 'Adebayo',
    businessName: 'Adebayo Electronics',
    email: 'seun.adebayo@gmail.com',
    phone: '+234 803 123 4567',
    category: 'vip',
    totalSpent: 2500000,
    totalPurchases: 48,
    creditLimit: 1000000,
    loyaltyPoints: 2500,
    notes: [
      {
        content: 'Bulk purchase of smartphones - interested in iPhone 13 Pro Max',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        content: 'Requested wholesale pricing for laptop accessories',
        createdAt: '2024-01-10T14:20:00Z'
      }
    ],
    status: 'active',
    address: {
      street: '15 Marina Street',
      city: 'Lagos Island',
      state: 'Lagos',
      country: 'Nigeria'
    }
  },
  {
    _id: '2',
    firstName: 'Chioma',
    lastName: 'Okonkwo',
    businessName: 'ChiChi Fashion House',
    email: 'chioma.okonkwo@yahoo.com',
    phone: '+234 705 987 6543',
    category: 'regular',
    totalSpent: 850000,
    totalPurchases: 23,
    creditLimit: 500000,
    loyaltyPoints: 850,
    notes: [
      {
        content: 'Interested in seasonal clothing collection',
        createdAt: '2024-01-14T09:15:00Z'
      }
    ],
    status: 'active',
    address: {
      street: '7B Admiralty Way',
      city: 'Lekki',
      state: 'Lagos',
      country: 'Nigeria'
    }
  },
  {
    _id: '3',
    firstName: 'Ibrahim',
    lastName: 'Musa',
    businessName: 'Musa & Sons Trading',
    email: 'ibrahim.musa@gmail.com',
    phone: '+234 802 456 7890',
    category: 'vip',
    totalSpent: 4200000,
    totalPurchases: 67,
    creditLimit: 2000000,
    loyaltyPoints: 4200,
    notes: [
      {
        content: 'Monthly bulk order scheduled for electronics',
        createdAt: '2024-01-13T11:45:00Z'
      },
      {
        content: 'Requested product catalog for Q1 2024',
        createdAt: '2024-01-08T16:30:00Z'
      }
    ],
    status: 'active',
    address: {
      street: '45 Ibrahim Taiwo Road',
      city: 'Kano',
      state: 'Kano',
      country: 'Nigeria'
    }
  }
];

export const customerCategories = [
  { value: 'regular', label: 'Regular' },
  { value: 'vip', label: 'VIP' },
  { value: 'wholesale', label: 'Wholesale' }
];

export const customerStatuses = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' }
];
