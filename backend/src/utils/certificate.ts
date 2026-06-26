import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import qrcode from 'qrcode';
import { ensureDirExists } from './storage';

interface CertificateData {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  issueDate: Date;
  verificationUrl: string;
}

const CERTIFICATES_DIR = path.join(__dirname, '..', '..', 'uploads', 'certificates');

/**
 * Generates a beautiful Certificate of Completion as a PDF.
 * Uses a horizontal landscape layout (A4), premium borders and embeds QR code.
 * @returns Relative path to saved PDF (e.g. /uploads/certificates/CERT-123.pdf)
 */
export const generateCertificatePDF = async (data: CertificateData): Promise<string> => {
  ensureDirExists(CERTIFICATES_DIR);

  const filename = `${data.certificateId}.pdf`;
  const filepath = path.join(CERTIFICATES_DIR, filename);

  // Generate QR Code image as base64 data URL
  const qrCodeDataUrl = await qrcode.toDataURL(data.verificationUrl, {
    margin: 1,
    width: 100,
    color: {
      dark: '#1e293b', // Navy Blue
      light: '#ffffff'
    }
  });

  return new Promise((resolve, reject) => {
    // Landscape A4 size is 841.89 x 595.28 points
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 40 });
    const writeStream = fs.createWriteStream(filepath);
    doc.pipe(writeStream);

    const width = 841.89;
    const height = 595.28;

    // --- Background Border Layout ---
    // Outer Border (Gold Theme)
    doc.rect(20, 20, width - 40, height - 40).lineWidth(4).strokeColor('#d97706').stroke();
    
    // Inner Border
    doc.rect(26, 26, width - 52, height - 52).lineWidth(1).strokeColor('#fbbf24').stroke();

    // Corner Accents (Draw decorative corner brackets in gold)
    doc.rect(32, 32, 40, 40).lineWidth(1.5).strokeColor('#d97706').stroke();
    doc.rect(width - 72, 32, 40, 40).lineWidth(1.5).strokeColor('#d97706').stroke();
    doc.rect(32, height - 72, 40, 40).lineWidth(1.5).strokeColor('#d97706').stroke();
    doc.rect(width - 72, height - 72, 40, 40).lineWidth(1.5).strokeColor('#d97706').stroke();

    // --- Logo & Platform Details ---
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#4f46e5').text('SKILLFORGE ACADEMY', width / 2, 70, { align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('VERIFIED TRAINING CREDENTIAL', width / 2, 90, { align: 'center' });

    // --- Main Certificate Copy ---
    doc.fontSize(36).font('Times-Bold').fillColor('#1e293b').text('Certificate of Completion', width / 2, 140, { align: 'center' });
    
    doc.fontSize(12).font('Helvetica').fillColor('#64748b').text('THIS IS PROUDLY PRESENTED TO', width / 2, 210, { align: 'center' });
    
    // Student Name (large, elegant serif)
    doc.fontSize(32).font('Times-BoldItalic').fillColor('#4f46e5').text(data.studentName, width / 2, 240, { align: 'center' });

    doc.moveTo(width / 2 - 150, 285).lineTo(width / 2 + 150, 285).strokeColor('#cbd5e1').lineWidth(1).stroke();

    doc.fontSize(11).font('Helvetica').fillColor('#64748b');
    doc.text('FOR SUCCESSFULLY COMPLETING THE DETAILED ACADEMIC SYLLABUS AND EVALUATIVE EXAMINATIONS FOR', width / 2, 310, { align: 'center' });

    // Course Title
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#0f172a').text(data.courseTitle, width / 2, 340, { align: 'center' });

    doc.fontSize(10).font('Helvetica').fillColor('#64748b');
    doc.text(`Awarded on: ${data.issueDate.toLocaleDateString('en-IN')}`, width / 2, 385, { align: 'center' });

    // --- Signatures & QR Verification Block ---
    const bottomBlockTop = 440;

    // Instructor Signature line
    doc.moveTo(80, bottomBlockTop + 45).lineTo(230, bottomBlockTop + 45).strokeColor('#94a3b8').stroke();
    doc.fontSize(10).font('Times-BoldItalic').fillColor('#1e293b').text('SkillForge Board Signature', 80, bottomBlockTop + 50, { width: 150, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Authorized Instructor Representative', 80, bottomBlockTop + 65, { width: 150, align: 'center' });

    // Embedded QR Code verification
    doc.image(qrCodeDataUrl, width / 2 - 40, bottomBlockTop - 10, { width: 80, height: 80 });
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text('Scan to Verify Online', width / 2 - 50, bottomBlockTop + 75, { width: 100, align: 'center' });

    // Certificate ID & Authority details
    doc.moveTo(width - 230, bottomBlockTop + 45).lineTo(width - 80, bottomBlockTop + 45).strokeColor('#94a3b8').stroke();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e293b').text(`Credential ID: ${data.certificateId}`, width - 230, bottomBlockTop + 50, { width: 150, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('SkillForge Authentication Authority', width - 230, bottomBlockTop + 65, { width: 150, align: 'center' });

    doc.end();

    writeStream.on('finish', () => {
      resolve(`/uploads/certificates/${filename}`);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};
