import React, { useState } from 'react';
import { ScheduledPayment, ScheduledType, RecurrenceType, PropertyManaged, Category } from '../types';
import { formatCOP, formatDate, getScheduledStatus } from '../utils/financial';
import { 
  CalendarClock, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2, 
  ShieldCheck, 
  Wallet, 
  Users, 
  TrendingUp, 
  Percent, 
  Trash2,
  CalendarDays,
  BellRing
} from 'lucide-react';

interface ScheduledViewProps {
  scheduledPayments: ScheduledPayment[];
  properties: PropertyManaged[];
  onAddScheduled: (payment: Omit<ScheduledPayment, 'id'>) => void;
  onQuickPay: (item: ScheduledPayment) => void;
  onDeleteScheduled: (id: string) => void;
}

export const ScheduledView: React.FC<ScheduledViewProps> = ({
  scheduledPayments,
  properties,
  onAddScheduled,
  onQuickPay,
  onDeleteScheduled,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'urgent' | 'paid'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New scheduled form state
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ScheduledType>('cobro_canon');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [recurrence, setRecurrence] = useState<RecurrenceType>('Mensual');
  const [beneficiaryOrPayer, setBeneficiaryOrPayer] = useState('');
  const [propertyCode, setPropertyCode] = useState('');
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [notes, setNotes] = useState('');

  // Filter items
  const filteredList = scheduledPayments.filter((item) => {
    const statusInfo = getScheduledStatus(item.dueDate, item.status);
    if (filterStatus === 'pending') return item.status === 'Pendiente';
    if (filterStatus === 'urgent') return item.status === 'Pendiente' && statusInfo.isUrgent;
    if (filterStatus === 'paid') return item.status === 'Pagado';
    return true;
  }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Category mapping helper
  const getCategoryForType = (scheduledType: ScheduledType): Category => {
    switch (scheduledType) {
      case 'cobro_canon':
        return 'Canon de Arrendamiento Recaudado';
      case 'pago_propietario':
        return 'Dispersión / Pago a Propietarios (Cánones)';
      case 'poliza_arriendo':
        return 'Póliza Seguros Arrendamiento (Sura / Libertador)';
      case 'comision_asesor':
        return 'Comisión a Asesores / Corredores MOAI';
      case 'pauta_portales':
        return 'Publicidad Portales (Finca Raíz, Metrocuadrado, Ads)';
      case 'impuestos':
        return 'Impuestos (ICA Medellín, ReteFuente, IVA)';
      case 'reforma_pago':
        return 'Materiales y Contratistas Reformas';
      default:
        return 'Otros Gastos Operacionales';
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || amount <= 0 || !dueDate) return;

    onAddScheduled({
      title,
      type,
      amount,
      dueDate,
      recurrence,
      status: 'Pendiente',
      beneficiaryOrPayer: beneficiaryOrPayer || 'Sin especificar',
      propertyCode: propertyCode || undefined,
      reminderDaysBefore,
      category: getCategoryForType(type),
      notes,
    });

    // Reset
    setTitle('');
    setAmount(0);
    setBeneficiaryOrPayer('');
    setPropertyCode('');
    setNotes('');
    setIsModalOpen(false);
  };

  // Quick stats
  const totalPendingAmount = scheduledPayments
    .filter((s) => s.status === 'Pendiente')
    .reduce((sum, s) => sum + s.amount, 0);

  const urgentCount = scheduledPayments.filter(
    (s) => s.status === 'Pendiente' && getScheduledStatus(s.dueDate, s.status).isUrgent
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#383B3D] tracking-tight flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-[#e10b17]" />
            <span>Programación de Fechas & Vencimientos</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de cobros de canon, dispersión a propietarios, pólizas Sura/Libertador y pagos recurrentes de MOAI.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#e10b17] hover:bg-[#c00510] text-white transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Programar Fecha</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Monto Total Programado</div>
            <div className="text-xl font-extrabold text-slate-800">{formatCOP(totalPendingAmount)}</div>
            <div className="text-[11px] text-slate-400">Por ejecutar en el período</div>
          </div>
          <div className="p-3 bg-red-50 text-[#e10b17] rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Vencimientos Próximos</div>
            <div className="text-xl font-extrabold text-amber-600">{urgentCount} eventos</div>
            <div className="text-[11px] text-amber-700">Vencen en los próximos 7 días</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <BellRing className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Programaciones Activas</div>
            <div className="text-xl font-extrabold text-emerald-600">
              {scheduledPayments.filter((s) => s.status === 'Pendiente').length} de {scheduledPayments.length}
            </div>
            <div className="text-[11px] text-emerald-700">En seguimiento contable</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-medium w-fit">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            filterStatus === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Todos ({scheduledPayments.length})
        </button>
        <button
          onClick={() => setFilterStatus('urgent')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            filterStatus === 'urgent' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-amber-700'
          }`}
        >
          Urgentes / Vencidos ({urgentCount})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            filterStatus === 'pending' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-blue-700'
          }`}
        >
          Pendientes ({scheduledPayments.filter((s) => s.status === 'Pendiente').length})
        </button>
        <button
          onClick={() => setFilterStatus('paid')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            filterStatus === 'paid' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          Asentados / Pagados ({scheduledPayments.filter((s) => s.status === 'Pagado').length})
        </button>
      </div>

      {/* Scheduled Items List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No hay eventos programados en esta categoría.</p>
          </div>
        ) : (
          filteredList.map((item) => {
            const statusInfo = getScheduledStatus(item.dueDate, item.status);
            const isPaid = item.status === 'Pagado';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  statusInfo.isUrgent && !isPaid
                    ? 'border-amber-300 bg-amber-50/10'
                    : isPaid
                    ? 'border-slate-200 opacity-75'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl shrink-0 mt-0.5">
                    {item.type === 'cobro_canon' && <Building2 className="w-5 h-5 text-emerald-600" />}
                    {item.type === 'pago_propietario' && <Wallet className="w-5 h-5 text-blue-600" />}
                    {item.type === 'poliza_arriendo' && <ShieldCheck className="w-5 h-5 text-purple-600" />}
                    {item.type === 'comision_asesor' && <Users className="w-5 h-5 text-amber-600" />}
                    {item.type === 'pauta_portales' && <TrendingUp className="w-5 h-5 text-[#e10b17]" />}
                    {item.type === 'impuestos' && <Percent className="w-5 h-5 text-slate-700" />}
                    {item.type === 'otro' && <CalendarClock className="w-5 h-5 text-slate-600" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#383B3D]">{item.title}</span>
                      {item.propertyCode && (
                        <span className="font-mono text-xs font-bold text-[#c00510] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                          {item.propertyCode}
                        </span>
                      )}
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {item.recurrence}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span><strong>Tercero:</strong> {item.beneficiaryOrPayer}</span>
                      <span>•</span>
                      <span><strong>Fecha Límite:</strong> {formatDate(item.dueDate)}</span>
                      {item.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-600">{item.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-base font-extrabold text-[#383B3D]">
                      {formatCOP(item.amount)}
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isPaid ? (
                      <button
                        onClick={() => onQuickPay(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs flex items-center gap-1"
                        title="Asentar pago en el libro contable"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Asentar</span>
                      </button>
                    ) : (
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-xs font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Asentado
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteScheduled(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar programación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nueva Programación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-[#383B3D] mb-1">Programar Nueva Fecha Contable</h2>
            <p className="text-xs text-slate-500 mb-4">
              Registra pagos o cobros inmobiliarios futuros con alerta de vencimiento y cálculo de flujo.
            </p>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título del Evento / Vencimiento</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Dispersión canon Propietario Envigado"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Evento</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ScheduledType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
                  >
                    <option value="cobro_canon">Cobro de Canon Arriendo</option>
                    <option value="pago_propietario">Dispersión a Propietario</option>
                    <option value="poliza_arriendo">Póliza Sura / Libertador</option>
                    <option value="comision_asesor">Comisión a Asesor MOAI</option>
                    <option value="pauta_portales">Factura Portales (Finca Raíz/Metrocuadrado)</option>
                    <option value="impuestos">Impuestos (DIAN / ICA)</option>
                    <option value="reforma_pago">Pago Contratista Reforma</option>
                    <option value="otro">Otro Pago Operacional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monto Estimado (COP)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="Ej: 3500000"
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha Programada (Límite)</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Periodicidad / Recurrencia</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
                  >
                    <option value="Unica vez">Única vez</option>
                    <option value="Mensual">Mensual (Cánones / Nómina)</option>
                    <option value="Bimestral">Bimestral (IVA / ICA)</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Anual">Anual (Pólizas / Renta)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inmueble Asociado</label>
                  <select
                    value={propertyCode}
                    onChange={(e) => setPropertyCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
                  >
                    <option value="">Gasto General / Corporativo</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.code}>
                        {p.code} - {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tercero (Beneficiario / Pagador)</label>
                  <input
                    type="text"
                    placeholder="Ej: Inquilino Juan Pérez / Propietario"
                    value={beneficiaryOrPayer}
                    onChange={(e) => setBeneficiaryOrPayer(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas o Detalles de Pago</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Cta de ahorros Bancolombia, descontar 10% de administración..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e10b17] hover:bg-[#c00510] text-white rounded-lg font-semibold shadow-xs"
                >
                  Guardar Programación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
