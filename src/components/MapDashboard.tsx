import { useEffect, useState } from 'react';
import { supabase, Service } from '../lib/supabase';
import { ServiceCard } from './ServiceCard';
import { MapPin, Calendar, Clock } from 'lucide-react';

export function MapDashboard() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchServices();
  }, [selectedDate]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_types(*),
          teams(*)
        `)
        .eq('scheduled_date', selectedDate)
        .order('scheduled_time');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    asignado: 'bg-blue-100 text-blue-800 border-blue-300',
    en_camino: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    realizando: 'bg-purple-100 text-purple-800 border-purple-300',
    finalizado: 'bg-green-100 text-green-800 border-green-300',
    cancelado: 'bg-red-100 text-red-800 border-red-300',
    reprogramado: 'bg-orange-100 text-orange-800 border-orange-300'
  };

  const statusLabels: Record<string, string> = {
    asignado: 'Asignado',
    en_camino: 'En Camino',
    realizando: 'Realizando',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
    reprogramado: 'Reprogramado'
  };

  const cdmxCenter = { lat: 19.4326, lng: -99.1332 };

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
            <h2 className="text-2xl font-bold text-gray-900">Panel de Operaciones</h2>
            <p className="text-gray-600 mt-1">Vista de servicios programados</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-sm font-semibold text-blue-900">
                {services.length} servicios
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              Ciudad de México
            </h3>
            <p className="text-center text-blue-200 mb-6">
              Centro: {cdmxCenter.lat.toFixed(4)}, {cdmxCenter.lng.toFixed(4)}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/20 transition-all text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <span className="font-semibold text-white text-sm">
                        {service.teams?.name || 'Sin equipo'}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[service.status]}`}>
                      {statusLabels[service.status]}
                    </span>
                  </div>
                  <p className="text-sm text-blue-100 mb-2 line-clamp-2">
                    {service.address}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-blue-200">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{service.scheduled_time}</span>
                    </div>
                    <span>•</span>
                    <span>{service.service_types?.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {services.length === 0 && (
              <div className="text-center py-12">
                <p className="text-blue-200">No hay servicios programados para esta fecha</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full border ${statusColors[status]}`}></div>
              <span className="text-sm text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedService && (
        <ServiceCard
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onUpdate={fetchServices}
        />
      )}
    </div>
  );
}
