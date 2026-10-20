import React from 'react';
import { Movement, ScheduledPayment, BudgetCategory, Partner, PropertyManaged, ViewTab } from '../types';
import { formatCOP, formatCompactCOP, calculateFinancialSummary, getScheduledStatus, formatDate } from '../utils/financial';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Users, 
  Building2, 
  CalendarClock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Truck,
  Hammer
} from 'lucide-react';

interface DashboardViewProps {
  movements: Movement[];
  scheduledPayments: ScheduledPayment[];
  budgets: BudgetCategory[];
  partners: Partner[];
  properties: PropertyManaged[];
  onNavigate: (tab: ViewTab) => void;
  onOpenNewMovement: () => void;
  onQuickPayScheduled: (scheduled: ScheduledPayment) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  movements,
  scheduledPayments,
  budgets,
  partners,
  properties,
  onNavigate,
  onOpenNewMovement,
  onQuickPayScheduled,
}) => {
  const summary = calculateFinancialSummary(movements);

  // Filter urgent scheduled payments
  const pendingScheduled = scheduledPayments
    .filter((s) => s.status === 'Pendiente')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const urgentScheduled = pendingScheduled.slice(0, 4);

  // Revenue by real estate category
  const revenueByCategory = movements
    .filter((m) => m.type === 'ingreso' && m.status === 'Completado')
    .reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + m.amount;
      return acc;
    }, {} as Record<string, number>);

  const sortedRevenueCategories = Object.entries(revenueByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Calculate budget overview
  const totalExpenseBudget = budgets
    .filter((b) => b.type === 'gasto_presupuestado')
    .reduce((sum, b) => sum + b.monthlyBudget, 0);

  const totalExpenseActual = movements
    .filter((m) => m.type === 'egreso' && m.status === 'Completado' && m.category !== 'Retiro de Utilidades / Dividendos Socios')
    .reduce((sum, m) => sum + m.amount, 0);

  const budgetExecutionPercent = totalExpenseBudget > 0 
    ? Math.min(100, Math.round((totalExpenseActual / totalExpenseBudget) * 100)) 
    : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Real Estate Context */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1e2022] via-[#2d3033] to-[#1a1c1e] text-white p-6 sm:p-8 shadow-md border border-slate-700/40">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Building2 className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#e10b17]/20 text-red-300 border border-[#e10b17]/30 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-[#e10b17] animate-ping" />
            Panel Ejecutivo · Dueño y Socios MOAI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Control Financiero & Flujo de Caja Inmobiliario
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Gestión contable centralizada de comisiones de venta, recaudos y dispersión de cánones de arriendo,
            servicios de mudanzas, reformas y repartición de dividendos para los socios de Inmobiliaria MOAI en Medellín.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={onOpenNewMovement}
              className="inline-flex items-center gap-2 bg-[#e10b17] hover:bg-[#c00510] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <span>+ Registrar Movimiento</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('scheduled')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-xs border border-white/10"
            >
              <CalendarClock className="w-4 h-4 text-red-400" />
              <span>Ver Fechas Programadas ({pendingScheduled.length})</span>
            </button>
            <button
              onClick={() => onNavigate('partners')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-xs border border-white/10"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Reparto a Socios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Saldo Disponible */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo en Caja / Bancos</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#383B3D] tracking-tight">
            {formatCOP(summary.netCashFlow)}
          </div>
          <div className="mt-2 flex items-center text-xs">
            <span className={`inline-flex items-center font-medium ${summary.netCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {summary.netCashFlow >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {summary.netCashFlow >= 0 ? 'Flujo Positivo' : 'Déficit Temporal'}
            </span>
            <span className="text-slate-600 ml-2">Total disponible</span>
          </div>
        </div>

        {/* KPI 2: Total Ingresos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ingresos del Período</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">
            {formatCOP(summary.totalIncome)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Comisiones + Arriendos + Serv.</span>
            <span className="font-semibold text-emerald-600">{movements.filter(m => m.type === 'ingreso').length} registros</span>
          </div>
        </div>

        {/* KPI 3: Total Egresos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Egresos & Dispersiones</span>
            <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 tracking-tight">
            {formatCOP(summary.totalExpense)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Propietarios, pautas, asesores</span>
            <span className="font-semibold text-rose-600">{movements.filter(m => m.type === 'egreso').length} registros</span>
          </div>
        </div>

        {/* KPI 4: Utilidad Distribuible Socios */}
        <div className="bg-white p-5 rounded-xl border border-amber-200/80 bg-linear-to-br from-amber-50/40 to-white shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Utilidad Operativa Neta</span>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-900 tracking-tight">
            {formatCOP(summary.netOperativeSurplus)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Para distribución a socios</span>
            <span className="text-amber-700 font-bold">3 socios</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Upcoming Scheduled Dates & Real Estate Revenue Lines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Programación de Fechas Inmobiliarias Urgentes */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-[#e10b17]" />
              <h2 className="text-base font-bold text-[#383B3D]">
                Cronograma de Fechas y Vencimientos Inmobiliarios
              </h2>
            </div>
            <button
              onClick={() => onNavigate('scheduled')}
              className="text-xs font-semibold text-[#e10b17] hover:underline flex items-center gap-1"
            >
              <span>Ver calendario completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Fechas programadas de cobros a inquilinos, dispersión de cánones a propietarios, pólizas de seguros Sura/Libertador y pagos de pauta.
          </p>

          <div className="space-y-3">
            {urgentScheduled.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                <p className="text-sm">¡Al día! No hay pagos o cobros pendientes inmediatos.</p>
              </div>
            ) : (
              urgentScheduled.map((item) => {
                const statusInfo = getScheduledStatus(item.dueDate, item.status);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-red-200 bg-slate-50/50 hover:bg-red-50/20 transition-all gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-md border border-slate-200 text-slate-700 shrink-0 mt-0.5">
                        {item.type === 'cobro_canon' && <Building2 className="w-4 h-4 text-emerald-600" />}
                        {item.type === 'pago_propietario' && <Wallet className="w-4 h-4 text-blue-600" />}
                        {item.type === 'poliza_arriendo' && <ShieldCheck className="w-4 h-4 text-purple-600" />}
                        {item.type === 'comision_asesor' && <Users className="w-4 h-4 text-amber-600" />}
                        {item.type === 'pauta_portales' && <TrendingUp className="w-4 h-4 text-[#e10b17]" />}
                        {item.type === 'impuestos' && <Percent className="w-4 h-4 text-slate-700" />}
                        {item.type === 'reforma_pago' && <Hammer className="w-4 h-4 text-orange-600" />}
                        {item.type === 'otro' && <CalendarClock className="w-4 h-4 text-slate-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[#383B3D]">{item.title}</span>
                          {item.propertyCode && (
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-red-100 text-[#c00510]">
                              {item.propertyCode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>{item.beneficiaryOrPayer}</span>
                          <span>•</span>
                          <span className="font-medium">{formatDate(item.dueDate)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-sm text-slate-900">
                          {formatCOP(item.amount)}
                        </div>
                        <span className={`inline-block px-2 py-0.5 text-[10px] rounded-full border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <button
                        onClick={() => onQuickPayScheduled(item)}
                        className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        title="Asentar en libro diario contable"
                      >
                        Asentar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Col: Líneas de Negocio MOAI & Socios Quick Widget */}
        <div className="space-y-6">
          {/* Revenue by Real Estate Services */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-[#383B3D] mb-3 flex items-center justify-between">
              <span>Ingresos por Servicio Inmobiliario</span>
              <span className="text-[11px] text-slate-600 font-normal">Este Mes</span>
            </h3>

            <div className="space-y-3">
              {sortedRevenueCategories.length === 0 ? (
                <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg text-xs">
                  <p className="font-medium text-slate-600">Base contable lista para iniciar</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Registra tu primer ingreso o comisión para comenzar a generar los reportes en Excel.
                  </p>
                </div>
              ) : (
                sortedRevenueCategories.map(([cat, amount]) => {
                  const total = summary.totalIncome || 1;
                  const pct = Math.round((amount / total) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[180px]">{cat}</span>
                        <span className="font-bold text-slate-900">{formatCompactCOP(amount)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#e10b17] h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-slate-400" /> Mudanzas & Reformas
              </span>
              <span className="text-emerald-600 font-semibold">Incluidos en la web</span>
            </div>
          </div>

          {/* Socios Equity Overview */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#383B3D] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                <span>Participación de Socios</span>
              </h3>
              <button
                onClick={() => onNavigate('partners')}
                className="text-xs text-[#e10b17] font-semibold hover:underline"
              >
                Liquidación
              </button>
            </div>

            <div className="space-y-2.5">
              {partners.map((p) => {
                const estimatedProfitShare = (summary.netOperativeSurplus * p.equityPercentage) / 100;
                return (
                  <div key={p.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs"
                        style={{ backgroundColor: p.avatarColor }}
                      >
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-600">{p.equityPercentage}% equity</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-700">
                        {formatCompactCOP(Math.max(0, estimatedProfitShare))}
                      </div>
                      <div className="text-[10px] text-slate-600">Utilidad estimada</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Control Presupuestal & Propiedades Destacadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Presupuesto Status */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-[#383B3D]">Control Presupuestal del Mes</h3>
            </div>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs font-semibold text-[#e10b17] hover:underline"
            >
              Configurar metas
            </button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-xs text-slate-600">Ejecución de Egresos Operativos</span>
              <span className="text-sm font-bold text-slate-900">
                {formatCOP(totalExpenseActual)} / {formatCOP(totalExpenseBudget)}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetExecutionPercent > 90 ? 'bg-rose-500' : budgetExecutionPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetExecutionPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 mt-1">
              <span>0%</span>
              <span className="font-semibold text-slate-700">{budgetExecutionPercent}% consumido</span>
              <span>100% Meta</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[11px] text-slate-600">Portales & Publicidad</div>
              <div className="text-sm font-bold text-slate-800">
                {formatCompactCOP(
                  movements
                    .filter((m) => m.category === 'Publicidad Portales (Finca Raíz, Metrocuadrado, Ads)')
                    .reduce((s, m) => s + m.amount, 0)
                )}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-[11px] text-slate-600">Comisiones Comerciales</div>
              <div className="text-sm font-bold text-slate-800">
                {formatCompactCOP(
                  movements
                    .filter((m) => m.category === 'Comisión a Asesores / Corredores MOAI')
                    .reduce((s, m) => s + m.amount, 0)
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Inmuebles en Cartera MOAI */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-[#383B3D]">Cartera Inmobiliaria Activa</h3>
            </div>
            <button
              onClick={() => onNavigate('properties')}
              className="text-xs font-semibold text-[#e10b17] hover:underline"
            >
              Ver {properties.length} inmuebles
            </button>
          </div>

          <div className="space-y-2.5">
            {properties.slice(0, 3).map((prop) => (
              <div
                key={prop.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#e10b17]">{prop.code}</span>
                    <span className="text-xs font-bold text-slate-800">{prop.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {prop.zone} · {prop.operation} · Propietario: {prop.ownerName}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">
                    {prop.rentalCanon ? formatCOP(prop.rentalCanon) + '/mes' : formatCompactCOP(prop.salePrice || 0)}
                  </div>
                  <span className="inline-block px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded-full">
                    Admin {prop.adminFeePercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
