import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Leemos lo que nos mandó el Backend en la URL
  const status = searchParams.get('status');
  const id = searchParams.get('id');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border">
        
        {status === 'success' && (
          <>
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Pago Exitoso!</h2>
            <p className="text-gray-600 mb-6">Tu reserva #{id} está confirmada y lista para tu llegada.</p>
          </>
        )}

        {status === 'cancelled' && (
          <>
            <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pago Cancelado</h2>
            <p className="text-gray-600 mb-6">Cancelaste el proceso de pago. Tu reserva sigue guardada.</p>
          </>
        )}

        {(status === 'rejected' || status === 'error') && (
          <>
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Pago Rechazado</h2>
            <p className="text-gray-600 mb-6">Hubo un problema al procesar tu tarjeta o conectarse al banco.</p>
          </>
        )}

        <button 
          onClick={() => navigate('/reservations')} 
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Volver a mis reservas
        </button>
      </div>
    </div>
  );
}