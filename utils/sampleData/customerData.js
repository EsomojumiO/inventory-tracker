const customers = [
    {
        id: 'CUS001',
        name: 'Chinonso Okeke',
        email: 'chinonso.okeke@gmail.com',
        phone: '+234 703 200 4503',
        address: '24 Ogunlana Drive, Surulere, Lagos',
        segment: 'Premium',
        dateJoined: '2023-01-15',
        purchaseHistory: [
            {
                orderId: 'ORD001',
                date: '2024-01-20',
                items: [
                    { product: 'Samsung Galaxy S21', quantity: 1, amount: 120000 },
                    { product: 'HP Laptop 15-inch', quantity: 1, amount: 250000 }
                ],
                total: 370000
            }
        ],
        loyaltyPoints: 1500,
        preferredPaymentMethod: 'Credit Card'
    },
    {
        id: 'CUS002',
        name: 'Fatimah Adebayo',
        email: 'fatimah.adebayo@yahoo.com',
        phone: '+234 805 123 4567',
        address: '15 Admiralty Way, Lekki Phase 1, Lagos',
        segment: 'Loyal',
        dateJoined: '2023-03-20',
        purchaseHistory: [
            {
                orderId: 'ORD002',
                date: '2024-01-25',
                items: [
                    { product: 'Owambe Party Gown', quantity: 2, amount: 45000 },
                    { product: 'Nike Air Max Sneakers', quantity: 1, amount: 35000 }
                ],
                total: 125000
            }
        ],
        loyaltyPoints: 800,
        preferredPaymentMethod: 'Bank Transfer'
    },
    {
        id: 'CUS003',
        name: 'John Nwachukwu',
        email: 'john.nwachukwu@gmail.com',
        phone: '+234 807 345 6789',
        address: '7B Gbagada Estate, Gbagada, Lagos',
        segment: 'Premium',
        dateJoined: '2023-02-10',
        purchaseHistory: [
            {
                orderId: 'ORD003',
                date: '2024-02-01',
                items: [
                    { product: 'Lagos Super Rice 10kg', quantity: 5, amount: 25000 },
                    { product: 'HP Printer', quantity: 1, amount: 85000 }
                ],
                total: 110000
            }
        ],
        loyaltyPoints: 1200,
        preferredPaymentMethod: 'Cash'
    },
    {
        id: 'CUS004',
        name: 'Lola Olamide',
        email: 'lola.olamide@outlook.com',
        phone: '+234 809 456 7890',
        address: '45 Isaac John Street, GRA, Ikeja, Lagos',
        segment: 'New',
        dateJoined: '2024-01-05',
        purchaseHistory: [
            {
                orderId: 'ORD004',
                date: '2024-02-05',
                items: [
                    { product: 'iPhone Charger', quantity: 2, amount: 5000 },
                    { product: 'Wireless Mouse', quantity: 1, amount: 7500 }
                ],
                total: 17500
            }
        ],
        loyaltyPoints: 100,
        preferredPaymentMethod: 'Mobile Money'
    },
    {
        id: 'CUS005',
        name: 'Tunde Bakare',
        email: 'tunde.bakare@gmail.com',
        phone: '+234 802 567 8901',
        address: '12 Adeola Odeku Street, Victoria Island, Lagos',
        segment: 'Loyal',
        dateJoined: '2023-06-15',
        purchaseHistory: [
            {
                orderId: 'ORD005',
                date: '2024-02-10',
                items: [
                    { product: 'Samsung Smart TV', quantity: 1, amount: 350000 },
                    { product: 'Home Theater System', quantity: 1, amount: 150000 }
                ],
                total: 500000
            }
        ],
        loyaltyPoints: 2500,
        preferredPaymentMethod: 'Credit Card'
    }
];

const getCustomerById = (id) => customers.find(customer => customer.id === id);
const getAllCustomers = () => customers;
const getCustomersBySegment = (segment) => customers.filter(customer => customer.segment === segment);
const getCustomerPurchaseHistory = (id) => {
    const customer = getCustomerById(id);
    return customer ? customer.purchaseHistory : [];
};

module.exports = {
    customers,
    getCustomerById,
    getAllCustomers,
    getCustomersBySegment,
    getCustomerPurchaseHistory
};
