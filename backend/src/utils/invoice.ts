import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { ensureDirExists } from './storage';

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  amountPaid: number;
}

const INVOICES_DIR = path.join(__dirname, '..', '..', 'uploads', 'invoices');

/**
 * Generates a GST compliant invoice PDF.
 * CGST (9%) + SGST (9%) computed from inclusive amount.
 * @returns Relative path to saved PDF (e.g. /uploads/invoices/INV-123.pdf)
 */
export const generateGSTInvoicePDF = async (data: InvoiceData): Promise<string> => {
  ensureDirExists(INVOICES_DIR);
  
  const filename = `${data.invoiceNumber}.pdf`;
  const filepath = path.join(INVOICES_DIR, filename);
  
  // GST Calculations (18% inclusive)
  const totalAmount = data.amountPaid;
  const baseAmount = parseFloat((totalAmount / 1.18).toFixed(2));
  const gstAmount = parseFloat((totalAmount - baseAmount).toFixed(2));
  const cgstAmount = parseFloat((gstAmount / 2).toFixed(2));
  const sgstAmount = parseFloat((gstAmount / 2).toFixed(2));

  // Configure environment metadata
  const compName = process.env.COMPANY_NAME || 'SkillForge Academy Private Limited';
  const compGstin = process.env.COMPANY_GSTIN || '27AAAAA1111A1Z1';
  const compAddress = process.env.COMPANY_ADDRESS || '101, Tech Hub, Hiranandani Gardens, Powai, Mumbai - 400076';

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    // --- Invoice Layout Header ---
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#4f46e5').text(compName, 50, 50);
    doc.fontSize(9).font('Helvetica').fillColor('#4b5563').text(`GSTIN: ${compGstin}`, 50, 75);
    doc.text(compAddress, 50, 90, { width: 250 });

    doc.fontSize(24).font('Helvetica-Bold').fillColor('#111827').text('TAX INVOICE', 380, 50, { align: 'right' });
    
    // Metadata block
    doc.fontSize(9).font('Helvetica').fillColor('#4b5563');
    doc.text(`Invoice No: ${data.invoiceNumber}`, 350, 85, { align: 'right' });
    doc.text(`Invoice Date: ${data.date.toLocaleDateString('en-IN')}`, 350, 100, { align: 'right' });
    doc.text(`Place of Supply: Maharashtra (27)`, 350, 115, { align: 'right' });

    doc.moveTo(50, 140).lineTo(550, 140).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // --- Billing details ---
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151').text('BILL TO:', 50, 160);
    doc.font('Helvetica').fillColor('#4b5563');
    doc.text(`Student Name: ${data.studentName}`, 50, 175);
    doc.text(`Student Email: ${data.studentEmail}`, 50, 190);

    // --- Invoice Table ---
    const tableTop = 230;
    
    // Table Header
    doc.rect(50, tableTop, 500, 25).fill('#f3f4f6');
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151');
    doc.text('Description', 60, tableTop + 8);
    doc.text('SAC', 280, tableTop + 8);
    doc.text('Taxable Value', 340, tableTop + 8, { width: 80, align: 'right' });
    doc.text('GST Rate', 430, tableTop + 8, { width: 50, align: 'right' });
    doc.text('Total (INR)', 490, tableTop + 8, { width: 50, align: 'right' });

    // Table Content
    const itemRowTop = tableTop + 35;
    doc.font('Helvetica').fillColor('#4b5563');
    doc.text(`${data.courseTitle} - Online Course Enrollment`, 60, itemRowTop, { width: 210 });
    doc.text('999249', 280, itemRowTop); // SAC code for online education
    doc.text(`₹${baseAmount.toLocaleString('en-IN')}`, 340, itemRowTop, { width: 80, align: 'right' });
    doc.text('18%', 430, itemRowTop, { width: 50, align: 'right' });
    doc.text(`₹${totalAmount.toLocaleString('en-IN')}`, 490, itemRowTop, { width: 50, align: 'right' });

    doc.moveTo(50, itemRowTop + 25).lineTo(550, itemRowTop + 25).strokeColor('#f3f4f6').stroke();

    // --- Totals Breakdown ---
    const totalBlockTop = itemRowTop + 45;
    doc.fontSize(9).font('Helvetica');
    doc.text('Taxable Subtotal:', 340, totalBlockTop, { width: 120, align: 'right' });
    doc.text(`₹${baseAmount.toLocaleString('en-IN')}`, 470, totalBlockTop, { width: 70, align: 'right' });

    doc.text('CGST (9%):', 340, totalBlockTop + 15, { width: 120, align: 'right' });
    doc.text(`₹${cgstAmount.toLocaleString('en-IN')}`, 470, totalBlockTop + 15, { width: 70, align: 'right' });

    doc.text('SGST (9%):', 340, totalBlockTop + 30, { width: 120, align: 'right' });
    doc.text(`₹${sgstAmount.toLocaleString('en-IN')}`, 470, totalBlockTop + 30, { width: 70, align: 'right' });

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827');
    doc.text('Total Amount (Inclusive):', 300, totalBlockTop + 50, { width: 160, align: 'right' });
    doc.text(`₹${totalAmount.toLocaleString('en-IN')}`, 470, totalBlockTop + 50, { width: 70, align: 'right' });

    // Terms
    doc.fontSize(8).font('Helvetica').fillColor('#9ca3af');
    doc.text('This is a computer generated invoice and requires no physical signature.', 50, 480, { align: 'center' });
    doc.text('Thank you for learning with SkillForge Academy!', 50, 495, { align: 'center' });

    doc.end();

    writeStream.on('finish', () => {
      resolve(`/uploads/invoices/${filename}`);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};
