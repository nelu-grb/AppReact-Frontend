import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmWebpayPayment } from '../services/webpayService';

type ViewState = 'processing' | 'success' | 'cancelled' | 'rejected';

export default function PaymentResult() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [view, setView] = useState<ViewState>('processing');
  const [reservationId, setReservationId] = useState<string | null>(null);
  const started = useRef(false); // evita doble commit por React.StrictMode

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const tokenWs = searchParams.get('token_ws');
    const status = searchParams.get('status');

    if (status === 'cancelled') {
      setView('cancelled');
      return;
    }

    if (!tokenWs) {
      setView('rejected');
      return;
    }

    // limpiamos el token de la URL para no reintentar el commit al refrescar
    setSearchParams({}, { replace: true });

    confirmWebpayPayment(tokenWs)
      .then((result) => {
        setReservationId(String(result.reservationId));
        setView(result.status === 'APPROVED' ? 'success' : 'rejected');
      })
      .catch(() => setView('rejected'));
  }, [searchParams, setSearchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border">

        {view === 'processing' && (
          <>
            <div className="text-blue-500 text-5xl mb-4 animate-pulse">⏳</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Procesando tu pago…</h2>
            <p className="text-gray-600 mb-6">Estamos confirmando la transacción con Webpay.</p>
          </>
        )}

        {view === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h2>
            <p className="text-gray-600 mb-6">Tu reserva #{reservationId} quedó pagada y lista para tu llegada.</p>
          </>
        )}

        {view === 'cancelled' && (
          <>
            <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pago Cancelado</h2>
            <p className="text-gray-600 mb-6">Cancelaste el proceso de pago. Tu reserva sigue guardada.</p>
          </>
        )}

        {view === 'rejected' && (
          <>
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pago Rechazado</h2>
            <p className="text-gray-600 mb-6">Hubo un problema al procesar tu tarjeta o conectarse al banco.</p>
          </>
        )}

        {view !== 'processing' && (
          <button
            onClick={() => navigate('/reservations')}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Volver a mis reservas
          </button>
        )}
      </div>
    </div>
  );
}
