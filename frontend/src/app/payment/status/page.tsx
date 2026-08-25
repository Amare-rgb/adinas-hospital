'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageProvider';
import { useTheme } from '@/contexts/ThemeProvider'; // ✅ Added theme import

// Types
interface PaymentData {
  transaction_id?: string;
  id?: string;
  tx_ref?: string;
  amount?: number | string;
  status?: string;
  [key: string]: unknown;
}

interface VerificationResponse {
  success: boolean;
  data?: PaymentData;
  message?: string;
}

type StatusType = 'loading' | 'success' | 'failed' | 'error';

// Separate component that uses useSearchParams
function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, t } = useLanguage();
  const { theme } = useTheme(); // ✅ Get current theme
  const isDark = theme === 'dark'; // ✅ Check if dark mode
  const tx_ref = searchParams.get('tx_ref');
  const [status, setStatus] = useState<StatusType>('loading');
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tx_ref) {
      setStatus('error');
      setError(t('payment.noReference') || 'No transaction reference found');
      return;
    }

    const verifyPayment = async () => {
      try {
        console.log('🔍 Verifying payment:', tx_ref);
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/payment/verify?tx_ref=${tx_ref}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const data: VerificationResponse = await response.json();
        console.log('📦 Verification response:', data);

        if (data.success) {
          setStatus('success');
          setPaymentData(data.data || null);
        } else {
          setStatus('failed');
          setError(data.message || t('payment.verificationFailed') || 'Payment verification failed');
        }
      } catch (err: unknown) {
        console.error('❌ Verification error:', err);
        setStatus('error');
        if (err instanceof Error) {
          setError(err.message || t('payment.verificationFailed') || 'Failed to verify payment');
        } else {
          setError(t('payment.verificationFailed') || 'Failed to verify payment');
        }
      }
    };

    verifyPayment();
  }, [tx_ref, t]);

  // Loading state - With dark mode support
  if (status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
        ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className={`h-16 w-16 animate-spin mx-auto mb-4 ${isDark ? 'text-[#4A5BCC]' : 'text-blue-600'}`} />
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
            {t('payment.verifying') || 'Verifying Payment...'}
          </h2>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('payment.pleaseWait') || 'Please wait while we confirm your transaction'}
          </p>
        </div>
      </div>
    );
  }

  // Success state - With dark mode support
  if (status === 'success') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
        ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full rounded-lg shadow-lg p-8 text-center transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border border-gray-700 shadow-[#4A5BCC]/10' 
            : 'bg-white shadow-lg'}`}>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-20 w-20 text-green-500 dark:text-green-400" />
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {t('payment.success') || 'Payment Successful! 🎉'}
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('payment.successMessage') || 'Your payment has been confirmed successfully.'}
          </p>
          
          {paymentData && (
            <div className={`rounded-lg p-4 mb-6 text-left transition-colors duration-300
              ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {t('payment.transactionId') || 'Transaction ID:'}
                </span>
                <span className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {paymentData.transaction_id || paymentData.id || 'N/A'}
                </span>
                
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {t('payment.reference') || 'Reference:'}
                </span>
                <span className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {paymentData.tx_ref || tx_ref || 'N/A'}
                </span>
                
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {t('payment.amount') || 'Amount:'}
                </span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {paymentData.amount ? `${paymentData.amount} ETB` : 'N/A'}
                </span>
                
                <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {t('payment.status') || 'Status:'}
                </span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {paymentData.status || 'Completed'}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors text-white
                ${isDark 
                  ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                  : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('payment.returnHome') || 'Return to Home'}
            </Link>
            <Link
              href="/appointments"
              className={`inline-flex items-center justify-center px-6 py-3 border rounded-lg transition-colors
                ${isDark 
                  ? 'border-[#4A5BCC] text-[#4A5BCC] hover:bg-[#4A5BCC]/10' 
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}
            >
              {t('payment.viewAppointments') || 'View My Appointments'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Failed/Error state - With dark mode support
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
      ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full rounded-lg shadow-lg p-8 text-center transition-colors duration-300
        ${isDark 
          ? 'bg-gray-800 border border-gray-700 shadow-[#4A5BCC]/10' 
          : 'bg-white shadow-lg'}`}>
        <div className="flex justify-center mb-4">
          <XCircle className="h-20 w-20 text-red-500 dark:text-red-400" />
        </div>
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          {t('payment.failed') || 'Payment Failed ❌'}
        </h2>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {error || t('payment.failedMessage') || 'We could not verify your payment. Please try again or contact support.'}
        </p>
        
        <div className={`border rounded-lg p-4 mb-6 text-left transition-colors duration-300
          ${isDark 
            ? 'bg-red-900/20 border-red-800' 
            : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>
            <strong>{t('payment.reference') || 'Reference:'}</strong> {tx_ref || 'N/A'}
          </p>
          {paymentData && (
            <p className={`text-sm mt-1 ${isDark ? 'text-red-400' : 'text-red-700'}`}>
              <strong>{t('payment.status') || 'Status:'}</strong> {paymentData.status || 'Unknown'}
            </p>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className={`inline-flex items-center justify-center px-6 py-3 rounded-lg transition-colors text-white
              ${isDark 
                ? 'bg-[#4A5BCC] hover:bg-[#5B6BD8]' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('payment.returnHome') || 'Return to Home'}
          </Link>
          <button
            onClick={() => window.history.back()}
            className={`inline-flex items-center justify-center px-6 py-3 border rounded-lg transition-colors
              ${isDark 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            {t('payment.tryAgain') || 'Try Again'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary - With dark mode support
export default function PaymentStatusPage() {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Suspense fallback={
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
        ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader2 className={`h-16 w-16 animate-spin mx-auto mb-4 ${isDark ? 'text-[#4A5BCC]' : 'text-blue-600'}`} />
          <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-700'}`}>
            {language === 'am' ? 'በመጫን ላይ...' : 'Loading...'}
          </h2>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {language === 'am' ? 'እባክዎ ይጠብቁ' : 'Please wait'}
          </p>
        </div>
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}