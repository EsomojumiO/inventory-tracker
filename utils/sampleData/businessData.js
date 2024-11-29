const businesses = [
    {
        id: 'BUS001',
        name: 'Olumide Electronics',
        address: 'No. 20, Adewale Crescent, Ikeja, Lagos',
        phone: '+234 803 123 4567',
        email: 'info@olumideelectronics.com',
        website: 'www.olumideelectronics.com',
        taxId: 'TIN12345678',
        regNumber: 'RC123456',
        type: 'Electronics Retail',
        operatingHours: '9:00 AM - 7:00 PM',
        bankDetails: {
            bankName: 'Zenith Bank',
            accountNumber: '1234567890',
            accountName: 'Olumide Electronics Ltd'
        }
    },
    {
        id: 'BUS002',
        name: "Zoe's Fashion Boutique",
        address: '15B, Allen Avenue, Ikeja, Lagos',
        phone: '+234 805 234 5678',
        email: 'contact@zoesfashion.com',
        website: 'www.zoesfashion.com',
        taxId: 'TIN23456789',
        regNumber: 'RC234567',
        type: 'Fashion Retail',
        operatingHours: '10:00 AM - 8:00 PM',
        bankDetails: {
            bankName: 'GTBank',
            accountNumber: '2345678901',
            accountName: "Zoe's Fashion Enterprise"
        }
    },
    {
        id: 'BUS003',
        name: 'African Delights Restaurant',
        address: '45, Toyin Street, Ikeja, Lagos',
        phone: '+234 807 345 6789',
        email: 'info@africandelights.com',
        website: 'www.africandelights.com',
        taxId: 'TIN34567890',
        regNumber: 'RC345678',
        type: 'Restaurant',
        operatingHours: '8:00 AM - 10:00 PM',
        bankDetails: {
            bankName: 'Access Bank',
            accountNumber: '3456789012',
            accountName: 'African Delights Ltd'
        }
    },
    {
        id: 'BUS004',
        name: 'Lagos Super Mart',
        address: '78, Awolowo Road, Ikoyi, Lagos',
        phone: '+234 809 456 7890',
        email: 'support@lagossupermart.com',
        website: 'www.lagossupermart.com',
        taxId: 'TIN45678901',
        regNumber: 'RC456789',
        type: 'Supermarket',
        operatingHours: '8:00 AM - 9:00 PM',
        bankDetails: {
            bankName: 'First Bank',
            accountNumber: '4567890123',
            accountName: 'Lagos Super Mart Ltd'
        }
    },
    {
        id: 'BUS005',
        name: 'Nigerian Tech Solutions',
        address: '25, Broad Street, Marina, Lagos',
        phone: '+234 802 567 8901',
        email: 'hello@nigtech.com',
        website: 'www.nigtech.com',
        taxId: 'TIN56789012',
        regNumber: 'RC567890',
        type: 'Technology Services',
        operatingHours: '9:00 AM - 6:00 PM',
        bankDetails: {
            bankName: 'UBA',
            accountNumber: '5678901234',
            accountName: 'Nigerian Tech Solutions Ltd'
        }
    }
];

const getBusinessById = (id) => businesses.find(business => business.id === id);
const getAllBusinesses = () => businesses;

module.exports = {
    businesses,
    getBusinessById,
    getAllBusinesses
};
