import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header } from './Header';
import { MapDashboard } from './MapDashboard';
import { AccountingDashboard } from './AccountingDashboard';
import { ServicesManager } from './ServicesManager';
import { TeamsManager } from './TeamsManager';
import { Map, DollarSign, Briefcase, Users } from 'lucide-react';

type View = 'map' | 'accounting' | 'services' | 'teams';

export function Dashboard() {
  const { userRole } = useAuth();
  const [currentView, setCurrentView] = useState<View>('map');

  const navigationItems = [
    { id: 'map' as View, label: 'Mapa', icon: Map, roles: ['admin', 'asesor', 'plantilla'] },
    { id: 'services' as View, label: 'Servicios', icon: Briefcase, roles: ['admin', 'asesor'] },
    { id: 'teams' as View, label: 'Equipos', icon: Users, roles: ['admin', 'asesor'] },
    { id: 'accounting' as View, label: 'Contabilidad', icon: DollarSign, roles: ['admin', 'contador', 'asesor'] }
  ];

  const visibleNavItems = navigationItems.filter(item =>
    userRole && item.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex space-x-1 p-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div>
          {currentView === 'map' && <MapDashboard />}
          {currentView === 'accounting' && <AccountingDashboard />}
          {currentView === 'services' && <ServicesManager />}
          {currentView === 'teams' && <TeamsManager />}
        </div>
      </div>
    </div>
  );
}
