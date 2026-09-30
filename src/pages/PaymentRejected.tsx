import { Link } from 'react-router-dom';
import { formatCLP } from '../utils/formatters';
import type { WebpayPaymentResult } from '../services/webpayService';

export default function PaymentRejected({ result }: { result: WebpayPaymentResult }) {
  return (
    <main className="min-h-screen grid place-items-center bg-[#F5F6F8] p-6">
      <section className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-rose-700">
          {result.status === 'ABORTED' ? 'Pago anulado' : 'Pago rechazado'}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">No se confirmó el pago</h1>
        <p className="mt-2 text-sm text-gray-600">
          La reserva no está confirmada. Puedes volver a tus reservas para revisar el estado o
          intentarlo nuevamente.
        </p>

        <dl className="mt-6 space-y-3 border-y border-gray-100 py-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Código de reserva</dt>
            <dd className="font-semibold text-gray-900">{result.reservationCode}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Alojamiento</dt>
            <dd className="text-right font-medium text-gray-900">{result.unitName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Total</dt>
            <dd className="font-bold text-gray-900">{formatCLP(result.totalAmount)}</dd>
          </div>
        </dl>

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