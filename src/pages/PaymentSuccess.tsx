import { Link } from 'react-router-dom';
import { formatCLP } from '../utils/formatters';
import type { WebpayPaymentResult } from '../services/webpayService';

export default function PaymentSuccess({ result }: { result: WebpayPaymentResult }) {
  return (
    <main className="min-h-screen grid place-items-center bg-[#F5F6F8] p-6">
      <section className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-emerald-700">Pago confirmado</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Reserva confirmada</h1>
          <p className="mt-2 text-sm text-gray-600">
            Recibimos el pago y tu reserva quedó confirmada.
          </p>
        </div>

        <dl className="space-y-3 border-y border-gray-100 py-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Código</dt>
            <dd className="font-semibold text-gray-900">{result.reservationCode}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Huésped</dt>
            <dd className="text-right font-medium text-gray-900">{result.guestName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Alojamiento</dt>
            <dd className="text-right font-medium text-gray-900">{result.unitName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Fechas</dt>
            <dd className="text-right font-medium text-gray-900">
              {result.checkInDate} al {result.checkOutDate}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Total pagado</dt>
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