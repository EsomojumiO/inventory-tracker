import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export class DocumentGenerator {
  constructor(businessInfo) {
    this.doc = new jsPDF();
    this.businessInfo = {
      businessName: businessInfo.name || 'Business Name',
      address: businessInfo.address || 'Business Address',
      phone: businessInfo.phone || 'Phone Number',
      email: businessInfo.email || 'Email Address',
      bankName: businessInfo.bankName || 'Bank Name',
      accountName: businessInfo.accountName || 'Account Name',
      accountNumber: businessInfo.accountNumber || 'Account Number',
      logo: businessInfo.logo || null
    };
  }

  setFont(type = 'normal') {
    switch (type) {
      case 'bold':
        this.doc.setFont('helvetica', 'bold');
        break;
      case 'italic':
        this.doc.setFont('helvetica', 'italic');
        break;
      default:
        this.doc.setFont('helvetica', 'normal');
    }
  }

  addHeader(documentType) {
    const { businessName, address, phone, email, logo } = this.businessInfo;
    
    // Add logo if exists
    if (logo) {
      this.doc.addImage(logo, 'JPEG', 10, 10, 50, 30);
    }

    // Business details
    this.setFont('bold');
    this.doc.setFontSize(20);
    this.doc.text(businessName, 70, 20);
    
    this.setFont('normal');
    this.doc.setFontSize(10);
    this.doc.text(address, 70, 30);
    this.doc.text(phone, 70, 35);
    this.doc.text(email, 70, 40);

    // Document type header
    this.doc.setFontSize(16);
    this.setFont('bold');
    this.doc.text(documentType.toUpperCase(), 10, 60);
    
    this.doc.line(10, 65, 200, 65); // Horizontal line
  }

  addCustomerInfo(customer, documentNumber, date) {
    this.setFont('bold');
    this.doc.setFontSize(12);
    this.doc.text('Bill To:', 10, 80);
    
    this.setFont('normal');
    this.doc.setFontSize(10);
    this.doc.text(customer.name || 'Guest Customer', 10, 90);
    this.doc.text(customer.address || 'N/A', 10, 95);
    this.doc.text(customer.phone || 'N/A', 10, 100);
    this.doc.text(customer.email || 'N/A', 10, 105);

    // Document details
    this.doc.text(`Date: ${format(new Date(date), 'dd/MM/yyyy')}`, 150, 90);
    this.doc.text(`Document #: ${documentNumber}`, 150, 95);
  }

  addItemsTable(items) {
    const tableColumn = ['Item', 'Quantity', 'Unit Price', 'Total'];
    const tableRows = items.map(item => [
      item.name || 'Unnamed Item',
      item.quantity?.toString() || '0',
      `₦${(item.price || 0).toFixed(2)}`,
      `₦${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`
    ]);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
    const vat = subtotal * 0.075; // 7.5% VAT
    const total = subtotal + vat;

    this.doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 120,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [66, 66, 66]
      }
    });

    const finalY = this.doc.lastAutoTable.finalY + 10;

    // Add totals
    this.doc.text('Subtotal:', 140, finalY);
    this.doc.text(`₦${subtotal.toFixed(2)}`, 170, finalY);
    
    this.doc.text('VAT (7.5%):', 140, finalY + 7);
    this.doc.text(`₦${vat.toFixed(2)}`, 170, finalY + 7);
    
    this.setFont('bold');
    this.doc.text('Total:', 140, finalY + 14);
    this.doc.text(`₦${total.toFixed(2)}`, 170, finalY + 14);

    return finalY;
  }

  addFooter(finalY, documentType) {
    this.setFont('normal');
    this.doc.setFontSize(10);

    switch (documentType.toLowerCase()) {
      case 'quotation':
        this.doc.text('* This quotation is valid for 30 days from the date of issue.', 10, finalY + 30);
        this.doc.text('* Prices are subject to change without prior notice.', 10, finalY + 35);
        break;
      case 'invoice':
        this.doc.text('Payment Terms:', 10, finalY + 30);
        this.doc.text('* Payment is due within 15 days of invoice date', 10, finalY + 35);
        this.doc.text('* Please include invoice number in payment reference', 10, finalY + 40);
        this.doc.text('Bank Details:', 10, finalY + 50);
        this.doc.text(`Bank: ${this.businessInfo.bankName}`, 10, finalY + 55);
        this.doc.text(`Account Name: ${this.businessInfo.accountName}`, 10, finalY + 60);
        this.doc.text(`Account Number: ${this.businessInfo.accountNumber}`, 10, finalY + 65);
        break;
      case 'receipt':
        this.doc.text('Thank you for your business!', 10, finalY + 30);
        this.setFont('bold');
        this.doc.text('PAID', 85, finalY + 40, null, 45);
        break;
      case 'delivery':
        this.doc.text('Delivery Instructions:', 10, finalY + 30);
        this.doc.text('* Please check all items upon delivery', 10, finalY + 35);
        this.doc.text('* Sign and return the delivery note to the delivery person', 10, finalY + 40);
        break;
      case 'purchase':
        this.doc.text('Purchase Order Terms:', 10, finalY + 30);
        this.doc.text('* Please confirm receipt of this purchase order', 10, finalY + 35);
        this.doc.text('* Quote this PO number in all correspondence', 10, finalY + 40);
        break;
    }
  }

  addBankDetails() {
    this.doc.text('Bank Details:', 10, 200);
    this.doc.text(`Bank: ${this.businessInfo.bankName}`, 10, 205);
    this.doc.text(`Account Name: ${this.businessInfo.accountName}`, 10, 210);
    this.doc.text(`Account Number: ${this.businessInfo.accountNumber}`, 10, 215);
  }

  generate(documentData, documentType) {
    try {
      const {
        orderNumber = 'N/A',
        customer = { name: 'Guest Customer' },
        items = [],
        date = new Date(),
      } = documentData;

      this.addHeader(documentType);
      this.addCustomerInfo(customer, orderNumber, date);
      const finalY = this.addItemsTable(items);
      this.addFooter(finalY, documentType);

      return this.doc;
    } catch (error) {
      console.error('Error generating document:', error);
      throw new Error('Failed to generate document');
    }
  }
}

export const generateDocument = (documentData, documentType, businessInfo) => {
  try {
    const generator = new DocumentGenerator(businessInfo);
    const { orderNumber, customer, items, date } = documentData;

    // Add header with document type
    generator.addHeader(documentType);
    
    // Add customer and document info
    generator.addCustomerInfo(customer, orderNumber, date);
    
    // Add items table
    generator.addItemsTable(items);
    
    // Add footer if needed
    if (documentType === 'invoice' || documentType === 'quotation') {
      generator.addBankDetails();
    }
    
    return generator.doc;
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
};

export default DocumentGenerator;
