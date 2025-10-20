import { useState, useEffect } from 'react';
import { supabase, Service, Payment } from '../lib/supabase';
import { DollarSign, TrendingUp, Calendar, CreditCard, Banknote, Smartphone, Upload, CheckCircle, AlertTriangle } from 'lucide-react';

interface ServiceWithPayment extends Service {
  payments: Payment[];
}

interface Stats {
  todayServices: number;
  todayIncome: number;
  pendingPayments: number;
  totalByMethod: {
    efectivo: number;
    transferencia: number;
    tarjeta: number;
  };
}

export function AccountingDashboard() {
  const [services, setServices] = useState<ServiceWithPayment[]>([]);
  const [stats, setStats] = useState<Stats>({
    todayServices: 0,
    todayIncome: 0,
    pendingPayments: 0,
    totalByMethod: {
      efectivo: 0,
      transferencia: 0,
      tarjeta: 0
    }
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'efectivo' as 'efectivo' | 'transferencia' | 'tarjeta',
    receipt_url: ''
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_types(*),
          teams(*),
          payments(*)
        `)
        .eq('scheduled_date', selectedDate)
        .order('scheduled_time');

      if (error) throw error;

      const servicesWithPayments = data || [];
      setServices(servicesWithPayments);
      calculateStats(servicesWithPayments);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (servicesData: ServiceWithPayment[]) => {
    const completedServices = servicesData.filter(s => s.status === 'finalizado');

    let totalIncome = 0;
    let pendingCount = 0;
    const methodTotals = { efectivo: 0, transferencia: 0, tarjeta: 0 };

    servicesData.forEach(service => {
      if (service.payments && service.payments.length > 0) {
        service.payments.forEach(payment => {
          if (payment.status === 'pagado' || payment.status === 'verificado') {
            totalIncome += payment.amount;
            methodTotals[payment.payment_method] += payment.amount;
          } else {
            pendingCount++;
          }
        });
      } else if (service.status === 'finalizado') {
        pendingCount++;
      }
    });

    setStats({
      todayServices: completedServices.length,
      todayIncome: totalIncome,
      pendingPayments: pendingCount,
      totalByMethod: methodTotals
    });
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService) {
      alert('Selecciona un servicio');
      return;
    }

    const service = services.find(s => s.id === selectedService);
    const expectedAmount = service?.service_types?.base_price || 0;
    const actualAmount = parseFloat(paymentData.amount);

    let notes = null;
    if (Math.abs(expectedAmount - actualAmount) > 0.01) {
      notes = `Diferencia detectada: Esperado $${expectedAmount.toFixed(2)}, Recibido $${actualAmount.toFixed(2)}. ¿Hubo descuento o ajuste?`;
    }

    try {
      const { error } = await supabase.from('payments').insert({
        service_id: selectedService,
        amount: actualAmount,
        payment_method: paymentData.payment_method,
        receipt_url: paymentData.receipt_url || null,
        status: 'pagado',
        notes
      });

      if (error) throw error;

      setShowPaymentForm(false);
      setSelectedService('');
      setPaymentData({
        amount: '',
        payment_method: 'efectivo',
        receipt_url: ''
      });
      fetchData();

      if (notes) {
        alert(notes);
      }
    } catch (error: any) {
      alert('Error al registrar pago: ' + error.message);
    }
  };

  const getPaymentStatus = (service: ServiceWithPayment) => {
    if (!service.payments || service.payments.length === 0) {
      return { status: 'pendiente', label: 'Sin pago', color: 'bg-red-100 text-red-800 border-red-300' };
    }

    const payment = service.payments[0];
    if (payment.status === 'pagado' || payment.status === 'verificado') {
      return { status: 'pagado', label: 'Pagado', color: 'bg-green-100 text-green-800 border-green-300' };
    }

    return { status: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel Contable</h2>
            <p className="text-gray-600 mt-1">Control de pagos e ingresos</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>Registrar Pago</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100">Servicios Completados</span>
              <TrendingUp className="w-6 h-6 text-blue-200" />
            </div>
            <p className="text-3xl font-bold">{stats.todayServices}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100">Ingresos del Día</span>
              <DollarSign className="w-6 h-6 text-green-200" />
            </div>
            <p className="text-3xl font-bold">${stats.todayIncome.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-100">Pagos Pendientes</span>
              <AlertTriangle className="w-6 h-6 text-orange-200" />
            </div>
            <p className="text-3xl font-bold">{stats.pendingPayments}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">Promedio por Servicio</span>
              <DollarSign className="w-6 h-6 text-purple-200" />
            </div>
            <p className="text-3xl font-bold">
              ${stats.todayServices > 0 ? (stats.todayIncome / stats.todayServices).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <Banknote className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Efectivo</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.totalByMethod.efectivo.toFixed(2)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Transferencia</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.totalByMethod.transferencia.toFixed(2)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Tarjeta</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.totalByMethod.tarjeta.toFixed(2)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Servicio</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Equipo</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Precio Base</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Monto Pagado</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Método</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Estado</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => {
                const paymentStatus = getPaymentStatus(service);
                const payment = service.payments?.[0];

                return (
                  <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{service.service_types?.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{service.teams?.name}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      ${service.service_types?.base_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                      {payment ? `$${payment.amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700 capitalize">
                      {payment?.payment_method || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full border ${paymentStatus.color}`}>
                          {paymentStatus.label}
                        </span>
                        {payment?.notes && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" title={payment.notes} />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {services.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay servicios para esta fecha</p>
            </div>
          )}
        </div>
      </div>

      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold">Registrar Pago</h3>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servicio
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    const service = services.find(s => s.id === e.target.value);
                    if (service) {
                      setPaymentData({
                        ...paymentData,
                        amount: service.service_types?.base_price.toString() || ''
                      });
                    }
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar servicio...</option>
                  {services
                    .filter(s => !s.payments || s.payments.length === 0)
                    .map(service => (
                      <option key={service.id} value={service.id}>
                        {service.service_types?.name} - {service.teams?.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={paymentData.payment_method}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL del Comprobante (opcional)
                </label>
                <input
                  type="url"
                  value={paymentData.receipt_url}
                  onChange={(e) => setPaymentData({ ...paymentData, receipt_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
