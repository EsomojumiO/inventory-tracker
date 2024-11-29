const suppliers = [
    {
        id: 'SUP001',
        name: 'Abiola Supplies',
        email: 'info@abiolasupplies.com',
        phone: '+234 803 987 6543',
        address: '16 Opebi Road, Ikeja, Lagos',
        website: 'www.abiolasupplies.com',
        category: 'Electronics',
        taxId: 'TIN98765432',
        regNumber: 'RC987654',
        products: [
            {
                name: 'Samsung Galaxy S21',
                sku: 'SAM-S21-BLK',
                price: 110000,
                moq: 5
            },
            {
                name: 'HP Laptop 15-inch',
                sku: 'HP-15-SLV',
                price: 220000,
                moq: 3
            }
        ],
        paymentTerms: 'Net 30',
        rating: 4.8,
        activeStatus: true,
        bankDetails: {
            bankName: 'GTBank',
            accountNumber: '0123456789',
            accountName: 'Abiola Supplies Ltd'
        }
    },
    {
        id: 'SUP002',
        name: 'Greenwich Tech Supplies',
        email: 'sales@greenwichtech.com',
        phone: '+234 805 876 5432',
        address: '25 Adetokunbo Ademola Street, Victoria Island, Lagos',
        website: 'www.greenwichtech.com',
        category: 'Technology',
        taxId: 'TIN87654321',
        regNumber: 'RC876543',
        products: [
            {
                name: 'Wireless Mouse',
                sku: 'WM-LOG-BLK',
                price: 5000,
                moq: 10
            },
            {
                name: 'HP Printer',
                sku: 'HP-PRN-1020',
                price: 75000,
                moq: 2
            }
        ],
        paymentTerms: 'Net 15',
        rating: 4.5,
        activeStatus: true,
        bankDetails: {
            bankName: 'Access Bank',
            accountNumber: '9876543210',
            accountName: 'Greenwich Technologies Ltd'
        }
    },
    {
        id: 'SUP003',
        name: 'Oluwaseun Distributors',
        email: 'contact@oluwaseundist.com',
        phone: '+234 807 765 4321',
        address: '8 Creek Road, Apapa, Lagos',
        website: 'www.oluwaseundist.com',
        category: 'Groceries',
        taxId: 'TIN76543210',
        regNumber: 'RC765432',
        products: [
            {
                name: 'Lagos Super Rice 10kg',
                sku: 'LSR-10KG',
                price: 20000,
                moq: 20
            },
            {
                name: 'Palm Oil 5L',
                sku: 'PO-5L',
                price: 5000,
                moq: 10
            }
        ],
        paymentTerms: 'COD',
        rating: 4.2,
        activeStatus: true,
        bankDetails: {
            bankName: 'UBA',
            accountNumber: '8765432109',
            accountName: 'Oluwaseun Distributors'
        }
    },
    {
        id: 'SUP004',
        name: 'Aminat Ventures',
        email: 'info@aminatventures.com',
        phone: '+234 809 654 3210',
        address: '12 Broad Street, Lagos Island, Lagos',
        website: 'www.aminatventures.com',
        category: 'Fashion',
        taxId: 'TIN65432109',
        regNumber: 'RC654321',
        products: [
            {
                name: 'Owambe Party Gown',
                sku: 'OPG-RED',
                price: 35000,
                moq: 5
            },
            {
                name: 'Nike Air Max Sneakers',
                sku: 'NAM-BLK',
                price: 30000,
                moq: 3
            }
        ],
        paymentTerms: 'Net 7',
        rating: 4.6,
        activeStatus: true,
        bankDetails: {
            bankName: 'Zenith Bank',
            accountNumber: '7654321098',
            accountName: 'Aminat Ventures Ltd'
        }
    },
    {
        id: 'SUP005',
        name: 'Durojaiye Traders',
        email: 'sales@durojaiye.com',
        phone: '+234 802 543 2109',
        address: '35 Commercial Avenue, Yaba, Lagos',
        website: 'www.durojaiye.com',
        category: 'Electronics',
        taxId: 'TIN54321098',
        regNumber: 'RC543210',
        products: [
            {
                name: 'Samsung Smart TV',
                sku: 'SST-43',
                price: 300000,
                moq: 2
            },
            {
                name: 'Home Theater System',
                sku: 'HTS-500',
                price: 120000,
                moq: 2
            }
        ],
        paymentTerms: 'Net 45',
        rating: 4.4,
        activeStatus: true,
        bankDetails: {
            bankName: 'First Bank',
            accountNumber: '6543210987',
            accountName: 'Durojaiye Traders Ltd'
        }
    }
];

const getSupplierById = (id) => suppliers.find(supplier => supplier.id === id);
const getAllSuppliers = () => suppliers;
const getSuppliersByCategory = (category) => suppliers.filter(supplier => supplier.category === category);
const getSupplierProducts = (id) => {
    const supplier = getSupplierById(id);
    return supplier ? supplier.products : [];
};
const getActiveSuppliers = () => suppliers.filter(supplier => supplier.activeStatus);

module.exports = {
    suppliers,
    getSupplierById,
    getAllSuppliers,
    getSuppliersByCategory,
    getSupplierProducts,
    getActiveSuppliers
};
