import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmWebpayPayment, type WebpayPaymentResult } from '../services/webpayService';
import { parseApiError } from '../utils/errorHandler';
import PaymentRejected from './PaymentRejected';
import PaymentSuccess from './PaymentSuccess';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const paymentToken = searchParams.get('token_ws') || searchParams.get('paymentId');
  
  const [result, setResult] = useState<WebpayPaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Evita que React 18 ejecute la confirmación dos veces en modo desarrollo
  const calledRef = useRef(false);

  useEffect(() => {
    if (!paymentToken) {
      setError('Falta la referencia del pago. No se pudo verificar la transacción.');
      setLoading(false);
      return;
    }

    if (calledRef.current) return; // Si ya se ejecutó, no vuelve a llamar
    calledRef.current = true;

    const loadResult = async () => {
      try {
        const paymentResult = await confirmWebpayPayment(paymentToken);
        setResult(paymentResult);
      } catch (requestError) {
        setError(parseApiError(requestError));
      } finally {
        setLoading(false);
      }
    };

    void loadResult();
  }, [paymentToken]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#F5F6F8] p-6">
        <p className="text-sm text-gray-600">Verificando el resultado del pago...</p>
      </main>
    );
  }

  if (result?.status === 'APPROVED') return <PaymentSuccess result={result} />;
  if (result && result.status !== 'PENDING') return <PaymentRejected result={result} />;

  return (
    <main className="min-h-screen grid place-items-center bg-[#F5F6F8] p-6">
      <section className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">
          {result?.status === 'PENDING' ? 'Pago en revisión' : 'No se pudo verificar el pago'}
        </h1>
        <p role={error ? 'alert' : undefined} className="mt-3 text-sm text-gray-600">
          {error ?? 'El token de la transacción ya expiro o no fue encontrado.'}
        </p>
        <Link
          to="/reservations"
          className="mt-6 inline-flex rounded-lg bg-[#1A423B] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#255e54]"
        >
          Volver a mis reservas
        </Link>
      </section>
    </main>
  );
}