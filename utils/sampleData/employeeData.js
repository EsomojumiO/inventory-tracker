const employees = [
    {
        id: 'EMP001',
        firstName: 'Oluwaseun',
        lastName: 'Adebayo',
        email: 'oluwaseun.adebayo@retailmaster.com',
        phone: '+234 803 123 4567',
        role: 'Sales Manager',
        department: 'Sales',
        hireDate: '2023-01-01',
        address: '25 Ikorodu Road, Lagos',
        emergencyContact: {
            name: 'Folake Adebayo',
            relationship: 'Spouse',
            phone: '+234 805 987 6543'
        },
        permissions: ['sales.create', 'sales.view', 'sales.edit', 'inventory.view'],
        status: 'Active',
        salary: 150000,
        bankDetails: {
            bankName: 'GTBank',
            accountNumber: '0123456789',
            accountName: 'Oluwaseun Adebayo'
        },
        performance: {
            salesTarget: 1000000,
            currentSales: 850000,
            rating: 4.8
        }
    },
    {
        id: 'EMP002',
        firstName: 'Chidinma',
        lastName: 'Okonkwo',
        email: 'chidinma.okonkwo@retailmaster.com',
        phone: '+234 802 345 6789',
        role: 'Sales Representative',
        department: 'Sales',
        hireDate: '2023-02-15',
        address: '12 Allen Avenue, Ikeja, Lagos',
        emergencyContact: {
            name: 'Chukwudi Okonkwo',
            relationship: 'Brother',
            phone: '+234 806 789 0123'
        },
        permissions: ['sales.create', 'sales.view', 'inventory.view'],
        status: 'Active',
        salary: 100000,
        bankDetails: {
            bankName: 'Access Bank',
            accountNumber: '9876543210',
            accountName: 'Chidinma Okonkwo'
        },
        performance: {
            salesTarget: 750000,
            currentSales: 620000,
            rating: 4.5
        }
    },
    {
        id: 'EMP003',
        firstName: 'Ibrahim',
        lastName: 'Musa',
        email: 'ibrahim.musa@retailmaster.com',
        phone: '+234 805 456 7890',
        role: 'Inventory Manager',
        department: 'Inventory',
        hireDate: '2023-03-01',
        address: '8 Admiralty Way, Lekki, Lagos',
        emergencyContact: {
            name: 'Aisha Musa',
            relationship: 'Sister',
            phone: '+234 807 890 1234'
        },
        permissions: ['inventory.create', 'inventory.view', 'inventory.edit', 'inventory.delete'],
        status: 'Active',
        salary: 130000,
        bankDetails: {
            bankName: 'UBA',
            accountNumber: '8765432109',
            accountName: 'Ibrahim Musa'
        },
        performance: {
            stockAccuracy: 98.5,
            rating: 4.7
        }
    },
    {
        id: 'EMP004',
        firstName: 'Blessing',
        lastName: 'Eze',
        email: 'blessing.eze@retailmaster.com',
        phone: '+234 809 567 8901',
        role: 'Accountant',
        department: 'Finance',
        hireDate: '2023-04-01',
        address: '15 Victoria Island, Lagos',
        emergencyContact: {
            name: 'Charles Eze',
            relationship: 'Father',
            phone: '+234 808 901 2345'
        },
        permissions: ['finance.view', 'finance.edit', 'reports.view'],
        status: 'Active',
        salary: 140000,
        bankDetails: {
            bankName: 'Zenith Bank',
            accountNumber: '7654321098',
            accountName: 'Blessing Eze'
        },
        performance: {
            accuracy: 99.2,
            rating: 4.9
        }
    },
    {
        id: 'EMP005',
        firstName: 'Yusuf',
        lastName: 'Abubakar',
        email: 'yusuf.abubakar@retailmaster.com',
        phone: '+234 801 678 9012',
        role: 'IT Support',
        department: 'IT',
        hireDate: '2023-05-01',
        address: '30 Broad Street, Lagos Island, Lagos',
        emergencyContact: {
            name: 'Fatima Abubakar',
            relationship: 'Mother',
            phone: '+234 803 012 3456'
        },
        permissions: ['system.admin', 'system.view', 'system.edit'],
        status: 'Active',
        salary: 120000,
        bankDetails: {
            bankName: 'First Bank',
            accountNumber: '6543210987',
            accountName: 'Yusuf Abubakar'
        },
        performance: {
            ticketResolutionRate: 95.8,
            rating: 4.6
        }
    }
];

const getEmployeeById = (id) => employees.find(employee => employee.id === id);
const getAllEmployees = () => employees;
const getEmployeesByDepartment = (department) => employees.filter(employee => employee.department === department);
const getEmployeesByRole = (role) => employees.filter(employee => employee.role === role);
const getActiveEmployees = () => employees.filter(employee => employee.status === 'Active');
const getEmployeePerformance = (id) => {
    const employee = getEmployeeById(id);
    return employee ? employee.performance : null;
};

module.exports = {
    employees,
    getEmployeeById,
    getAllEmployees,
    getEmployeesByDepartment,
    getEmployeesByRole,
    getActiveEmployees,
    getEmployeePerformance
};
