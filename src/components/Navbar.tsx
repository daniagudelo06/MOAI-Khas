import React from 'react';
import { ViewTab } from '../types';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  CalendarClock, 
  PieChart, 
  Users, 
  Building2, 
  FileText, 
  PlusCircle, 
  FileSpreadsheet, 
  ExternalLink,
  BellRing
} from 'lucide-react';

interface NavbarProps {
  currentTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  onOpenNewMovement: () => void;
  onExportExcel: () => void;
  urgentScheduledCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenNewMovement,
  onExportExcel,
  urgentScheduledCount,
}) => {
  const tabs: { id: ViewTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'movements', label: 'Movimientos', icon: <ArrowLeftRight className="w-4 h-4" /> },
    { 
      id: 'scheduled', 
      label: 'Programación', 
      icon: <CalendarClock className="w-4 h-4" />, 
      badge: urgentScheduledCount > 0 ? urgentScheduledCount : undefined 
    },
    { id: 'budgets', label: 'Presupuestos', icon: <PieChart className="w-4 h-4" /> },
    { id: 'partners', label: 'Socios', icon: <Users className="w-4 h-4" /> },
    { id: 'properties', label: 'Inmuebles', icon: <Building2 className="w-4 h-4" /> },
    { id: 'reports', label: 'Reportes', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-xs">
      {/* Top micro-bar for branding & repo */}
      <div className="bg-[#18191b] text-slate-300 text-xs py-1.5 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#e10b17] animate-pulse"></span>
          <span className="font-medium text-slate-200 tracking-wide">MOAI Inmobiliaria</span>
          <span className="hidden sm:inline text-slate-400">· Medellín, Colombia</span>
          <span className="hidden md:inline text-slate-500 italic">"Cuidamos lo que más te importa"</span>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="https://www.inmobiliariamoai.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white flex items-center gap-1 transition-colors text-xs"
          >
            <span>inmobiliariamoai.com</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <span className="text-slate-600">|</span>
          <a
            href="https://github.com/daniagudelo06/MOAI-Kash"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-300 hover:text-white flex items-center gap-1 transition-colors text-xs font-mono"
            title="Repositorio oficial en GitHub"
          >
            <span>daniagudelo06/MOAI-Kash</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onTabChange('dashboard')} 
              className="flex items-center gap-3 text-left group focus:outline-hidden"
            >
              <div className="relative flex items-center justify-center h-10 w-auto">
                <img 
                  src="https://assets.softr-files.com/applications/5b21f71b-810b-491e-b74c-c2b9257d6865/assets/a87235ad-6b0b-4219-9f77-58b6ccc05fbc.png" 
                  alt="MOAI Inmobiliaria" 
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to text logo if image blocked
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-[#383B3D]">
                    MOAI
                  </span>
                  <span className="bg-[#e10b17] text-white text-xs font-bold px-1.5 py-0.5 rounded-sm tracking-wider uppercase">
                    Kash
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase -mt-0.5">
                  Finanzas & Socios
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-[#e10b17] bg-red-50/80 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="ml-1 px-1.5 py-0.2 bg-[#e10b17] text-white text-[11px] font-bold rounded-full animate-bounce">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#e10b17] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Export Complete Accounting to Excel */}
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400 transition-all shadow-xs"
              title="Descargar informe consolidado completo en Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>

            {/* Quick alert badge for scheduled payments */}
            {urgentScheduledCount > 0 && (
              <button
                onClick={() => onTabChange('scheduled')}
                className="relative p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors"
                title={`${urgentScheduledCount} pagos o cobros urgentes/vencidos`}
              >
                <BellRing className="w-4 h-4 text-amber-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#e10b17] text-white text-[10px] font-bold flex items-center justify-center">
                  {urgentScheduledCount}
                </span>
              </button>
            )}

            {/* Register Movement CTA */}
            <button
              onClick={onOpenNewMovement}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-[#e10b17] hover:bg-[#c00510] active:scale-98 transition-all shadow-sm shadow-red-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Movimiento</span>
            </button>
          </div>
        </div>

        {/* Mobile horizontal scrollable tabs */}
        <div className="lg:hidden flex overflow-x-auto py-2 border-t border-slate-100 gap-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'text-white bg-[#e10b17] shadow-xs'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-[#e10b17]' : 'bg-[#e10b17] text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
