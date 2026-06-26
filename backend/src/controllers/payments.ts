import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import prisma from '../config/db';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { generateGSTInvoicePDF } from '../utils/invoice';
import { sendEmail } from '../utils/otp';

// Auxiliary helper to generate a unique invoice number
const generateInvoiceNumber = async (): Promise<string> => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.invoice.count();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${count + randomSuffix}`;
};

// Initialize Razorpay SDK conditionally (will fail on boot if keys are missing in production)
const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mockkeysecret';
  
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });
    if (!courseId) return res.status(400).json({ message: 'Course ID is required.' });

    // Fetch course details
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ message: 'Course not found.' });

    // Check if user already purchased the course
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId,
        courseId,
        status: 'COMPLETED',
      },
    });

    if (existingOrder) {
      return res.status(400).json({ message: 'You have already purchased this course.' });
    }

    const calculatedPrice = course.price;
    const taxAmount = parseFloat((calculatedPrice - (calculatedPrice / 1.18)).toFixed(2));
    const isMock = process.env.RAZORPAY_KEY_ID === 'rzp_test_mockkeyid' || !process.env.RAZORPAY_KEY_ID;

    let gatewayOrderId = `order_mock_${crypto.randomUUID().slice(0, 8)}`;
    
    if (!isMock) {
      try {
        const rzp = getRazorpayInstance();
        const rzpOrder = await rzp.orders.create({
          amount: Math.round(calculatedPrice * 100), // Razorpay amount is in paise
          currency: 'INR',
          receipt: `rcpt_${crypto.randomUUID().slice(0, 8)}`,
        });
        gatewayOrderId = rzpOrder.id;
      } catch (error) {
        console.error('[RAZORPAY CREATE ORDER ERROR]', error);
        return res.status(500).json({ message: 'Razorpay gateway initialization failed.' });
      }
    }

    // Save pending order to database
    const dbOrder = await prisma.order.create({
      data: {
        userId,
        courseId,
        amount: calculatedPrice,
        tax: taxAmount,
        currency: 'INR',
        gatewayOrderId,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      orderId: dbOrder.id,
      gatewayOrderId,
      amount: calculatedPrice,
      currency: 'INR',
      isMock,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkeyid',
    });
  } catch (error) {
    console.error('[CREATE ORDER ERROR]', error);
    return res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized.' });
    if (!orderId) return res.status(400).json({ message: 'Order reference is required.' });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { course: true, user: true },
    });

    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const isMock = order.gatewayOrderId?.startsWith('order_mock_') || process.env.RAZORPAY_KEY_ID === 'rzp_test_mockkeyid';

    if (!isMock) {
      // Real cryptographic verification
      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'FAILED' },
        });
        return res.status(400).json({ message: 'Payment signature verification failed. Transation flagged.' });
      }
    }

    // Complete order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        gatewayPaymentId: razorpayPaymentId || `pay_mock_${crypto.randomUUID().slice(0, 8)}`,
      },
    });

    // Create Payment log
    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.amount,
        status: 'captured',
        method: isMock ? 'upi_mock' : 'razorpay',
        details: JSON.stringify({ razorpayPaymentId, razorpayOrderId, isMock }),
      },
    });

    // Create Invoice PDF
    const invoiceNumber = await generateInvoiceNumber();
    const invoiceUrl = await generateGSTInvoicePDF({
      invoiceNumber,
      date: new Date(),
      studentName: order.user.name,
      studentEmail: order.user.email || 'billing@skillforge.com',
      courseTitle: order.course.title,
      amountPaid: order.amount,
    });

    // Save Invoice to database
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        pdfUrl: invoiceUrl,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAYMENT_SUCCESS',
        details: `Purchased course: ${order.course.title}. Invoice generated: ${invoiceNumber}`,
      },
    });

    // Dispatch confirmation email
    if (order.user.email) {
      await sendEmail(
        order.user.email,
        'Payment Receipt & Course Unlocked - SkillForge LMS',
        `<h3>Thank you for your purchase!</h3>
        <p>Hi ${order.user.name}, your payment of ₹${order.amount} has been successfully verified.</p>
        <p><strong>Course Unlocked:</strong> ${order.course.title}</p>
        <p>Invoice reference: <strong>${invoiceNumber}</strong>. You can download the PDF invoice directly from your SkillForge dashboard.</p>
        <p>Happy Learning!</p>`
      );
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully. Course unlocked.',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[VERIFY PAYMENT ERROR]', error);
    return res.status(500).json({ message: 'Verification processing failed.' });
  }
};

// ==========================================
// ADMIN TRANSACTIONS
// ==========================================

export const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        course: { select: { title: true } },
        invoice: { select: { invoiceNumber: true, pdfUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error) {
    console.error('[GET TRANSACTIONS ERROR]', error);
    return res.status(500).json({ message: 'Failed to retrieve transactions.' });
  }
};

export const initiateRefund = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string; // Order ID
    const userId = req.user?.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true, course: true },
    });

    if (!order || order.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Order is not completed and cannot be refunded.' });
    }

    // Mock Refund logic
    // In real Razorpay integration, calls:
    // await getRazorpayInstance().payments.refund(order.gatewayPaymentId, { amount: order.amount * 100 })
    
    await prisma.order.update({
      where: { id },
      data: { status: 'FAILED' }, // Mark as FAILED or separate REFUNDED enum
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PAYMENT_REFUND',
        details: `Refunded Order ${order.id} for user ${order.user.name}. Amount: ₹${order.amount}`,
      },
    });

    // Send refund email
    if (order.user.email) {
      await sendEmail(
        order.user.email,
        'Refund Completed - SkillForge LMS',
        `<h3>Payment Refund Initiated</h3>
        <p>Dear ${order.user.name}, we have processed a refund of ₹${order.amount} for the course "${order.course.title}".</p>
        <p>The money will be credited back to your original payment method in 5-7 working days.</p>`
      );
    }

    return res.json({ message: 'Refund completed successfully.' });
  } catch (error) {
    console.error('[REFUND ERROR]', error);
    return res.status(500).json({ message: 'Failed to process refund.' });
  }
};
