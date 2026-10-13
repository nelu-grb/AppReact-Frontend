import { useState, useEffect } from 'react';

type PaymentStatus = 'PROCESSING' | 'SUCCESS' | 'REJECTED';


const mockReservationData = {
  code: 'AS-1048',
  guestName: 'Camila Rojas',
  unit: 'Suite Andes · Habitación 301',
  dates: '09 → 12 oct 2026 · 3 noches',
  occupancy: '2 adultos · Canal directo',
  total: 'US$ 540,00',
  transactionId: 'PAY-2086 · 7 oct 2026, 10:42',
  paymentMethod: 'Visa ···· 4242 · USD'
};

export default function PaymentResult() {
  const [status, setStatus] = useState<PaymentStatus>('PROCESSING');
  
  // Aquí deberías extraer el token de Webpay de la URL
  // const searchParams = new URLSearchParams(window.location.search);
  // const tokenWs = searchParams.get('token_ws');

  useEffect(() => {
    // Simulación de la verificación con el backend
    const verifyPayment = async () => {
      // setTimeout simula el tiempo de espera (pantalla de carga)
      setTimeout(() => {
        // Cambia esto a 'REJECTED' para probar la pantalla de error
        setStatus('SUCCESS'); 
      }, 2500);
    };

    verifyPayment();
  }, []);

  const renderHeader = () => (
    <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white w-full absolute top-0 left-0">
      <div className="flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span className="text-xl font-semibold text-gray-900">AndesStay</span>
      </div>
      <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        ¿Necesitas ayuda?
      </button>
    </header>
  );

  const renderReservationSummary = () => (
    <div className="bg-gray-50/50 rounded-xl p-6 text-sm mb-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <span className="font-semibold text-gray-900 text-base">Resumen de la reserva</span>
        <span className="text-[#0066FF] font-medium">{mockReservationData.code}</span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-500">Huésped</span>
          <span className="font-medium text-gray-900">{mockReservationData.guestName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Alojamiento</span>
          <span className="font-medium text-gray-900">{mockReservationData.unit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Estadía</span>
          <span className="font-medium text-gray-900">{mockReservationData.dates}</span>
        </div>
        <div className="flex justify-between pb-4 border-b border-gray-200">
          <span className="text-gray-500">Ocupación</span>
          <span className="font-medium text-gray-900">{mockReservationData.occupancy}</span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="font-semibold text-gray-900">Total a pagar</span>
          <span className="text-xl font-bold text-gray-900">{mockReservationData.total}</span>
        </div>
      </div>
    </div>
  );

  const renderTransactionDetails = () => (
    <div className="space-y-2 text-xs mb-6 px-2">
      <div className="flex justify-between">
        <span className="text-gray-400">Transacción</span>
        <span className="font-medium text-gray-700">{mockReservationData.transactionId}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-400">Medio de pago</span>
        <span className="font-medium text-gray-700">{mockReservationData.paymentMethod}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col items-center justify-center pt-20 pb-10 px-4 font-sans relative">
      {renderHeader()}

      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-gray-100 max-w-lg w-full">
        
        {/* ESTADO: PROCESSING */}
        {status === 'PROCESSING' && (
          <div className="text-center animate-pulse">
            <div className="w-16 h-16 border-[3px] border-gray-100 border-t-[#0066FF] rounded-full animate-spin mx-auto mb-4"></div>
            <span className="text-[10px] font-bold text-[#0066FF] bg-blue-50 px-2.5 py-1 rounded-md tracking-wider">VERIFICACIÓN EN CURSO</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Estamos verificando tu pago</h2>
            <p className="text-sm text-gray-500 mb-8">Estamos esperando la confirmación del proveedor.<br/>Aún no hay un resultado definitivo.</p>
            
            {renderReservationSummary()}
            {renderTransactionDetails()}

            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3.5 mb-6 flex items-start gap-3 text-left">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs text-gray-600">No repitas el pago ni cierres esta página. La confirmación puede tardar unos segundos.</p>
            </div>

            <button className="w-full bg-[#0066FF] text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Consultar estado
            </button>
            <button className="w-full text-gray-600 font-medium py-3 flex justify-center items-center gap-2 hover:bg-gray-50 rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver a la reserva
            </button>
          </div>
        )}

        {/* ESTADO: SUCCESS */}
        {status === 'SUCCESS' && (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-[#E6F4EA] text-[#1E8E3E] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-[#1E8E3E] bg-[#E6F4EA] px-2.5 py-1 rounded-md tracking-wider">PAGO APROBADO</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Tu pago fue aprobado</h2>
            <p className="text-sm text-gray-500 mb-8">Todo listo, Camila. Recibimos tu pago de forma segura.<br/>Tu reserva en Hotel Cordillera está confirmada.</p>
            
            {renderReservationSummary()}
            {renderTransactionDetails()}

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-6 justify-start px-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>Enviamos el comprobante a camila.rojas@gmail.com.</span>
            </div>

            <button onClick={() => window.location.href = '/reservas'} className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Ver mi reserva
            </button>
            <button className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Descargar comprobante
            </button>
          </div>
        )}

        {/* ESTADO: REJECTED */}
        {status === 'REJECTED' && (
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-[#FCE8E8] text-[#D93025] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-[#D93025] bg-[#FCE8E8] px-2.5 py-1 rounded-md tracking-wider">PAGO RECHAZADO</span>
            <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">No pudimos procesar tu pago</h2>
            <p className="text-sm text-gray-500 mb-8">El banco no autorizó esta transacción. No se realizó<br/>ningún cobro. Puedes intentar con otro medio de pago.</p>
            
            {renderReservationSummary()}
            {renderTransactionDetails()}

            <div className="bg-red-50/50 border border-red-100 rounded-lg p-3.5 mb-6 flex items-start gap-3 text-left">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs text-gray-600">Tu reserva sigue pendiente de pago. Revisa los datos de tu tarjeta o contacta a tu banco.</p>
            </div>

            <button className="w-full bg-[#0066FF] hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Reintentar pago
            </button>
            <button className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors flex justify-center items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Cambiar medio de pago
            </button>
          </div>
        )}

      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Pago seguro · Tus datos están protegidos
        </div>
        <a href="#" className="text-[#0066FF] hover:underline">¿Necesitas ayuda? Contactar al hotel</a>
      </div>
    </div>
  );
}