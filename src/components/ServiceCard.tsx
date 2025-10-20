import { useState, useEffect } from 'react';
import { X, MapPin, Clock, Calendar, DollarSign, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, Service, ServiceStatus, Payment } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ServiceCardProps {
  service: Service;
  onClose: () => void;
  onUpdate: () => void;
}

export function ServiceCard({ service, onClose, onUpdate }: ServiceCardProps) {
  const { userRole } = useAuth();
  const [status, setStatus] = useState<ServiceStatus>(service.status);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPayment();
  }, [service.id]);

  const fetchPayment = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('service_id', service.id)
        .maybeSingle();

      if (error) throw error;
      setPayment(data);
    } catch (error) {
      console.error('Error fetching payment:', error);
    }
  };

  const handleStatusUpdate = async () => {
    if (status === service.status) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({ status })
        .eq('id', service.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions: { value: ServiceStatus; label: string }[] = [
    { value: 'asignado', label: 'Asignado' },
    { value: 'en_camino', label: 'En Camino' },
    { value: 'realizando', label: 'Realizando Servicio' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'reprogramado', label: 'Reprogramado' }
  ];

  const canEditStatus = userRole && ['admin', 'asesor', 'plantilla'].includes(userRole);

  const googleMapsUrl = service.latitude && service.longitude
    ? `https://www.google.com/maps?q=${service.latitude},${service.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.address)}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-2xl font-bold">Detalles del Servicio</h3>
            <p className="text-blue-100 mt-1">{service.service_types?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Dirección</span>
                </div>
                <p className="text-gray-700 ml-7">{service.address}</p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm ml-7 inline-block mt-2 underline"
                >
                  Ver en Google Maps
                </a>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Fecha</span>
                </div>
                <p className="text-gray-700 ml-7">
                  {new Date(service.scheduled_date).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Horario</span>
                </div>
                <p className="text-gray-700 ml-7">{service.scheduled_time}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Tipo de Servicio</span>
                </div>
                <p className="text-gray-700 ml-7">{service.service_types?.name}</p>
                <p className="text-sm text-gray-600 ml-7 mt-1">
                  {service.service_types?.category}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Precio Base</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 ml-7">
                  ${service.service_types?.base_price.toFixed(2)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-semibold text-gray-900">Equipo Asignado</span>
                </div>
                <p className="text-gray-700">{service.teams?.name || 'Sin asignar'}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Estado del Servicio
            </label>
            <div className="flex items-center space-x-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                disabled={!canEditStatus}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {canEditStatus && status !== service.status && (
                <button
                  onClick={handleStatusUpdate}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Actualizar'}
                </button>
              )}
            </div>
          </div>

          {payment && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Información de Pago</span>
              </h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Monto:</span>
                  <span className="font-bold text-gray-900">${payment.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Método:</span>
                  <span className="font-semibold text-gray-900 capitalize">{payment.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Estado:</span>
                  <span className="font-semibold text-gray-900 capitalize">{payment.status}</span>
                </div>
                {payment.notes && (
                  <div className="mt-3 pt-3 border-t border-green-300">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                      <p className="text-sm text-gray-700">{payment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
