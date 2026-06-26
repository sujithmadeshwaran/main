'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  ArrowLeft, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';

interface Course {
  id: string;
  title: string;
  price: number;
  discount: number;
  thumbnail: string | null;
}

export default function CheckoutPage() {
  const { id } = useParams(); // Course ID
  const router = useRouter();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Razorpay Order Details
  const [rzpOrder, setRzpOrder] = useState<any | null>(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/checkout/${id}`);
      return;
    }

    const fetchCourse = async () => {
      try {
        const response = await api.get(`/courses/${id}`);
        setCourse(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, user, router]);

  const handleCheckoutInit = async () => {
    if (!course) return;
    setError(null);
    setProcessing(true);

    try {
      // Create Razorpay Order in Backend
      const response = await api.post('/payments/create-order', {
        courseId: course.id,
      });

      const orderData = response.data;
      setRzpOrder(orderData);

      if (!orderData.isMock) {
        // Trigger standard Razorpay Checkout
        const options = {
          key: orderData.keyId,
          amount: orderData.amount * 100,
          currency: orderData.currency,
          name: 'SkillForge Academy',
          description: `Enrollment for ${course.title}`,
          order_id: orderData.gatewayOrderId,
          handler: async (paymentResponse: any) => {
            await handlePaymentVerification({
              orderId: orderData.orderId,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            });
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#4f46e5',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        setProcessing(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initialize payment gateway.');
      setProcessing(false);
    }
  };

  const handlePaymentVerification = async (payload: {
    orderId: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
  }) => {
    setProcessing(true);
    try {
      await api.post('/payments/verify', payload);
      setSuccess(true);
      setRzpOrder(null);
      
      // Delay redirect slightly to show success checkmark
      setTimeout(() => {
        router.push('/dashboard?payment=success');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Payment verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulatePayment = async (status: 'SUCCESS' | 'FAILURE') => {
    if (!rzpOrder) return;
    setError(null);
    
    if (status === 'FAILURE') {
      setError('Simulated payment failed. Please retry.');
      setRzpOrder(null);
      return;
    }

    // Call verify endpoint with mock data
    await handlePaymentVerification({
      orderId: rzpOrder.orderId,
      razorpayPaymentId: `pay_mock_${Math.random().toString(36).slice(2, 9)}`,
      razorpayOrderId: rzpOrder.gatewayOrderId,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-semibold">Opening secure checkout...</p>
      </div>
    );
  }

  if (!course) return <div className="text-center py-20 text-rose-500">Course not found.</div>;

  // Math Invoice details
  const price = course.price;
  const baseValue = parseFloat((price / 1.18).toFixed(2));
  const totalGST = parseFloat((price - baseValue).toFixed(2));
  const cgst = parseFloat((totalGST / 2).toFixed(2));
  const sgst = parseFloat((totalGST / 2).toFixed(2));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-6">
      {/* Razorpay Standard script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${course.title.toLowerCase().replace(/\s+/g, '-')}`}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="font-bold text-lg text-slate-850 dark:text-slate-150">Confirm Order</span>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-450 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success ? (
          <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
            <CheckCircle className="mx-auto text-emerald-500 animate-bounce" size={48} />
            <h2 className="text-xl font-extrabold text-slate-850 dark:text-slate-100">Enrollment Successful!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Your payment of ₹{price.toLocaleString('en-IN')} has been verified. Redirecting you to the student console...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Left Box: Bill outlines */}
            <div className="md:col-span-3 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-4 shadow-xs">
                <h3 className="font-bold text-slate-850 dark:text-slate-100">Course Summary</h3>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden shrink-0">
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail.startsWith('/uploads/') ? `http://localhost:5000${course.thumbnail}` : course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm line-clamp-1">{course.title}</h4>
                    <span className="text-3xs bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">
                      Lifetime Access
                    </span>
                  </div>
                </div>
              </div>

              {/* Secure Checkout details */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl space-y-3.5 shadow-xs">
                <h3 className="font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="text-indigo-500" size={18} />
                  Safe & Secure Checkout
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
                  Your payments are processed securely through Razorpay using industry standard encryption. Supported payment options include UPI, Debit Cards, Net Banking and wallets.
                </p>
              </div>
            </div>

            {/* Right Box: GST invoice break down */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
                <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm">Billing Details</h3>
                
                <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-350">
                  <div className="flex justify-between">
                    <span>Taxable Subtotal</span>
                    <span>₹{baseValue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CGST (9%)</span>
                    <span>₹{cgst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST (9%)</span>
                    <span>₹{sgst.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-between font-extrabold text-sm text-slate-850 dark:text-slate-150">
                    <span>Grand Total</span>
                    <span className="text-indigo-600 dark:text-indigo-400">₹{price.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {!rzpOrder ? (
                  <button
                    onClick={handleCheckoutInit}
                    disabled={processing}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md text-xs"
                  >
                    {processing ? 'Processing...' : 'Pay with Razorpay'}
                  </button>
                ) : (
                  // Mock Simulator Box
                  <div className="p-4 bg-slate-950 text-white rounded-xl border border-slate-800 text-center space-y-3">
                    <span className="block text-2xs font-extrabold uppercase tracking-widest text-indigo-400">
                      Mock Payments Simulator
                    </span>
                    <p className="text-3xs text-slate-400">
                      Razorpay keys are in mock mode. Choose payment result below:
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSimulatePayment('FAILURE')}
                        disabled={processing}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-lg text-3xs transition-colors"
                      >
                        Fail Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulatePayment('SUCCESS')}
                        disabled={processing}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-3xs transition-colors"
                      >
                        Pass Payment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
