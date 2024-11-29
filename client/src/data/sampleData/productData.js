const products = [
    {
        id: 'PRD001',
        name: 'Samsung Galaxy S21',
        sku: 'SAM-S21-BLK',
        barcode: '8806090892547',
        category: 'Electronics',
        subCategory: 'Smartphones',
        description: 'Latest Samsung Galaxy S21 smartphone with 5G capability',
        price: 120000,
        costPrice: 110000,
        stockLevel: 50,
        reorderPoint: 10,
        supplier: 'SUP001',
        brand: 'Samsung',
        specifications: {
            color: 'Black',
            storage: '128GB',
            ram: '8GB',
            warranty: '12 months'
        },
        location: 'Shelf A1',
        status: 'Active',
        images: ['samsung-s21-1.jpg', 'samsung-s21-2.jpg'],
        tags: ['phone', 'mobile', '5G', 'android']
    },
    {
        id: 'PRD002',
        name: 'Lagos Super Rice 10kg',
        sku: 'LSR-10KG',
        barcode: '5901234123457',
        category: 'Groceries',
        subCategory: 'Rice',
        description: 'Premium quality Nigerian rice, 10kg bag',
        price: 5000,
        costPrice: 4000,
        stockLevel: 150,
        reorderPoint: 30,
        supplier: 'SUP003',
        brand: 'Lagos Super',
        specifications: {
            weight: '10kg',
            type: 'Long grain',
            origin: 'Nigeria'
        },
        location: 'Shelf B2',
        status: 'Active',
        images: ['rice-10kg.jpg'],
        tags: ['rice', 'food', 'groceries']
    },
    {
        id: 'PRD003',
        name: 'Nike Air Max Sneakers',
        sku: 'NAM-BLK',
        barcode: '6901234567890',
        category: 'Fashion',
        subCategory: 'Footwear',
        description: 'Original Nike Air Max sneakers',
        price: 35000,
        costPrice: 30000,
        stockLevel: 25,
        reorderPoint: 5,
        supplier: 'SUP004',
        brand: 'Nike',
        specifications: {
            color: 'Black/White',
            size: 'UK 42',
            material: 'Leather/Mesh'
        },
        location: 'Shelf C3',
        status: 'Active',
        images: ['nike-air-max.jpg'],
        tags: ['shoes', 'sneakers', 'sports']
    },
    {
        id: 'PRD004',
        name: 'HP Laptop 15-inch',
        sku: 'HP-15-SLV',
        barcode: '7891234567890',
        category: 'Electronics',
        subCategory: 'Laptops',
        description: 'HP 15-inch laptop with Intel Core i5 processor',
        price: 250000,
        costPrice: 220000,
        stockLevel: 15,
        reorderPoint: 3,
        supplier: 'SUP001',
        brand: 'HP',
        specifications: {
            processor: 'Intel Core i5',
            ram: '8GB',
            storage: '512GB SSD',
            screen: '15.6 inch'
        },
        location: 'Shelf A2',
        status: 'Active',
        images: ['hp-laptop.jpg'],
        tags: ['computer', 'laptop', 'electronics']
    },
    {
        id: 'PRD005',
        name: 'Owambe Party Gown',
        sku: 'OPG-RED',
        barcode: '8901234567890',
        category: 'Fashion',
        subCategory: 'Dresses',
        description: 'Beautiful Nigerian party gown with detailed embroidery',
        price: 45000,
        costPrice: 35000,
        stockLevel: 20,
        reorderPoint: 5,
        supplier: 'SUP004',
        brand: 'Nigerian Fashion',
        specifications: {
            color: 'Red',
            size: 'M',
            material: 'Lace',
            style: 'Traditional'
        },
        location: 'Shelf D1',
        status: 'Active',
        images: ['party-gown.jpg'],
        tags: ['dress', 'party', 'traditional']
    }
];

const getProductById = (id) => products.find(product => product.id === id);
const getAllProducts = () => products;
const getProductsByCategory = (category) => products.filter(product => product.category === category);
const getProductsBySupplier = (supplierId) => products.filter(product => product.supplier === supplierId);
const getLowStockProducts = () => products.filter(product => product.stockLevel <= product.reorderPoint);
const searchProducts = (query) => {
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
};

export {
    products,
    getProductById,
    getAllProducts,
    getProductsByCategory,
    getProductsBySupplier,
    getLowStockProducts,
    searchProducts
};
