const sales = [
    {
        id: 'SLE001',
        orderId: 'ORD001',
        date: '2024-01-20T10:30:00Z',
        customer: 'CUS001',
        items: [
            {
                product: 'PRD001',
                name: 'Samsung Galaxy S21',
                quantity: 1,
                unitPrice: 120000,
                discount: 0,
                total: 120000
            },
            {
                product: 'PRD004',
                name: 'HP Laptop 15-inch',
                quantity: 1,
                unitPrice: 250000,
                discount: 0,
                total: 250000
            }
        ],
        subtotal: 370000,
        discount: 0,
        tax: 18500,
        total: 388500,
        payment: {
            method: 'Credit Card',
            reference: 'PAY001',
            status: 'Completed'
        },
        salesRep: 'EMP001',
        status: 'Completed',
        notes: 'Customer requested extended warranty'
    },
    {
        id: 'SLE002',
        orderId: 'ORD002',
        date: '2024-01-25T14:15:00Z',
        customer: 'CUS002',
        items: [
            {
                product: 'PRD005',
                name: 'Owambe Party Gown',
                quantity: 2,
                unitPrice: 45000,
                discount: 5000,
                total: 85000
            },
            {
                product: 'PRD003',
                name: 'Nike Air Max Sneakers',
                quantity: 1,
                unitPrice: 35000,
                discount: 0,
                total: 35000
            }
        ],
        subtotal: 125000,
        discount: 5000,
        tax: 6000,
        total: 126000,
        payment: {
            method: 'Bank Transfer',
            reference: 'PAY002',
            status: 'Completed'
        },
        salesRep: 'EMP002',
        status: 'Completed',
        notes: 'Bulk purchase discount applied'
    },
    {
        id: 'SLE003',
        orderId: 'ORD003',
        date: '2024-02-01T09:45:00Z',
        customer: 'CUS003',
        items: [
            {
                product: 'PRD002',
                name: 'Lagos Super Rice 10kg',
                quantity: 5,
                unitPrice: 5000,
                discount: 0,
                total: 25000
            }
        ],
        subtotal: 25000,
        discount: 0,
        tax: 1250,
        total: 26250,
        payment: {
            method: 'Cash',
            reference: 'PAY003',
            status: 'Completed'
        },
        salesRep: 'EMP001',
        status: 'Completed',
        notes: ''
    },
    {
        id: 'SLE004',
        orderId: 'ORD004',
        date: '2024-02-05T16:20:00Z',
        customer: 'CUS004',
        items: [
            {
                product: 'PRD001',
                name: 'Samsung Galaxy S21',
                quantity: 1,
                unitPrice: 120000,
                discount: 10000,
                total: 110000
            }
        ],
        subtotal: 120000,
        discount: 10000,
        tax: 5500,
        total: 115500,
        payment: {
            method: 'Mobile Money',
            reference: 'PAY004',
            status: 'Completed'
        },
        salesRep: 'EMP003',
        status: 'Completed',
        notes: 'New customer discount applied'
    },
    {
        id: 'SLE005',
        orderId: 'ORD005',
        date: '2024-02-10T11:30:00Z',
        customer: 'CUS005',
        items: [
            {
                product: 'PRD004',
                name: 'HP Laptop 15-inch',
                quantity: 2,
                unitPrice: 250000,
                discount: 25000,
                total: 475000
            }
        ],
        subtotal: 500000,
        discount: 25000,
        tax: 23750,
        total: 498750,
        payment: {
            method: 'Credit Card',
            reference: 'PAY005',
            status: 'Completed'
        },
        salesRep: 'EMP002',
        status: 'Completed',
        notes: 'Bulk purchase discount applied'
    }
];

const getSaleById = (id) => sales.find(sale => sale.id === id);
const getAllSales = () => sales;
const getSalesByCustomer = (customerId) => sales.filter(sale => sale.customer === customerId);
const getSalesByDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= start && saleDate <= end;
    });
};
const getSalesBySalesRep = (salesRepId) => sales.filter(sale => sale.salesRep === salesRepId);
const getTotalSales = () => sales.reduce((total, sale) => total + sale.total, 0);
const getAverageSaleAmount = () => getTotalSales() / sales.length;

export {
    sales,
    getSaleById,
    getAllSales,
    getSalesByCustomer,
    getSalesByDateRange,
    getSalesBySalesRep,
    getTotalSales,
    getAverageSaleAmount
};
