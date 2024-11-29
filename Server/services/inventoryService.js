const mongoose = require('mongoose');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class InventoryService {
  // Real-time stock tracking
  async updateStockLevel(productId, quantity, location) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Update stock based on location
      if (location === 'physical') {
        product.physicalStock = quantity;
      } else if (location === 'online') {
        product.onlineStock = quantity;
      }

      product.totalStock = (product.physicalStock || 0) + (product.onlineStock || 0);
      
      // Check if stock is below threshold
      if (product.totalStock <= product.lowStockThreshold) {
        await this.createLowStockAlert(product);
      }

      await product.save();
      return product;
    } catch (error) {
      throw new Error(`Failed to update stock level: ${error.message}`);
    }
  }

  // Low stock alerts
  async createLowStockAlert(product) {
    try {
      const notification = new Notification({
        type: 'LOW_STOCK',
        message: `Low stock alert for ${product.name}. Current stock: ${product.totalStock}`,
        product: product._id,
        severity: 'warning',
      });
      await notification.save();
      return notification;
    } catch (error) {
      throw new Error(`Failed to create low stock alert: ${error.message}`);
    }
  }

  // Barcode management
  async getProductByBarcode(barcode) {
    try {
      const product = await Product.findOne({ barcode });
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw new Error(`Failed to get product by barcode: ${error.message}`);
    }
  }

  async updateProductBarcode(productId, barcode) {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        { barcode },
        { new: true }
      );
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw new Error(`Failed to update product barcode: ${error.message}`);
    }
  }

  // Bulk import/export
  async importProductsFromCSV(filePath) {
    try {
      const products = [];
      const results = [];

      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => products.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      for (const product of products) {
        try {
          const newProduct = new Product({
            name: product.name,
            description: product.description,
            barcode: product.barcode,
            physicalStock: parseInt(product.physicalStock) || 0,
            onlineStock: parseInt(product.onlineStock) || 0,
            lowStockThreshold: parseInt(product.lowStockThreshold) || 10,
            price: parseFloat(product.price) || 0,
            category: product.category,
          });

          await newProduct.save();
          results.push({ success: true, product: newProduct });
        } catch (error) {
          results.push({ success: false, error: error.message, data: product });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to import products: ${error.message}`);
    }
  }

  async exportProductsToCSV(outputPath) {
    try {
      const products = await Product.find({});
      
      const csvWriter = createCsvWriter({
        path: outputPath,
        header: [
          { id: 'name', title: 'Name' },
          { id: 'description', title: 'Description' },
          { id: 'barcode', title: 'Barcode' },
          { id: 'physicalStock', title: 'Physical Stock' },
          { id: 'onlineStock', title: 'Online Stock' },
          { id: 'totalStock', title: 'Total Stock' },
          { id: 'lowStockThreshold', title: 'Low Stock Threshold' },
          { id: 'price', title: 'Price' },
          { id: 'category', title: 'Category' },
        ],
      });

      await csvWriter.writeRecords(products);
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to export products: ${error.message}`);
    }
  }

  async exportProductsToExcel(outputPath) {
    try {
      const products = await Product.find({});
      const worksheet = XLSX.utils.json_to_sheet(products.map(p => p.toObject()));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      XLSX.writeFile(workbook, outputPath);
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to export products to Excel: ${error.message}`);
    }
  }

  // Stock transfer between locations
  async transferStock(productId, quantity, fromLocation, toLocation) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Validate source location has enough stock
      if (fromLocation === 'physical' && product.physicalStock < quantity) {
        throw new Error('Insufficient physical stock');
      }
      if (fromLocation === 'online' && product.onlineStock < quantity) {
        throw new Error('Insufficient online stock');
      }

      // Update stock levels
      if (fromLocation === 'physical') {
        product.physicalStock -= quantity;
        product.onlineStock += quantity;
      } else {
        product.onlineStock -= quantity;
        product.physicalStock += quantity;
      }

      product.totalStock = product.physicalStock + product.onlineStock;
      await product.save();
      return product;
    } catch (error) {
      throw new Error(`Failed to transfer stock: ${error.message}`);
    }
  }

  // Get low stock products
  async getLowStockProducts() {
    try {
      const products = await Product.find({
        $expr: {
          $lte: ['$totalStock', '$lowStockThreshold']
        }
      });
      return products;
    } catch (error) {
      throw new Error(`Failed to get low stock products: ${error.message}`);
    }
  }
}

module.exports = new InventoryService();
