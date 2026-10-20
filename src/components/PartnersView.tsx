import React, { useState } from 'react';
import { Partner, Movement } from '../types';
import { formatCOP, formatCompactCOP, calculateFinancialSummary, formatDate } from '../utils/financial';
import confetti from 'canvas-confetti';
import { 
  Users, 
  Wallet, 
  Sparkles, 
  PieChart, 
  ArrowUpRight, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Share2, 
  ShieldCheck, 
  DollarSign, 
  TrendingUp 
} from 'lucide-react';

interface PartnersViewProps {
  partners: Partner[];
  movements: Movement[];
  onExecuteDistribution: (payouts: { partnerId: string; amount: number; name: string }[]) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({
  partners,
  movements,
  onExecuteDistribution,
}) => {
  const summary = calculateFinancialSummary(movements);
  const [distributeAmount, setDistributeAmount] = useState<number>(
    Math.max(0, summary.netOperativeSurplus > 0 ? summary.netOperativeSurplus : 10000000)
  );
  const [showActaModal, setShowActaModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Filter historical partner dividend movements
  const partnerMovements = movements.filter(
    (m) => m.category === 'Retiro de Utilidades / Dividendos Socios' && m.status === 'Completado'
  );

  const handleDistribute = () => {
    if (distributeAmount <= 0) return;

    // Calculate each partner's payout
    const payouts = partners.map((p) => ({
      partnerId: p.id,
      name: p.name,
      amount: Math.round((distributeAmount * p.equityPercentage) / 100),
    }));

    onExecuteDistribution(payouts);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e10b17', '#c00510', '#10b981', '#f59e0b'],
      });
    } catch {
      // ignore
    }

    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 5000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Módulo Confidencial · Junta de Socios MOAI</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#383B3D] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#e10b17]" />
            <span>Socios, Capital & Distribución de Utilidades</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control accionario, cálculo automático de dividendos e historial de retiros para los socios de Inmobiliaria MOAI.
          </p>
        </div>

        <button
          onClick={() => setShowActaModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <FileText className="w-4 h-4 text-slate-600" />
          <span>Generar Acta de Socios</span>
        </button>
      </div>

      {/* Global Financial Surplus Strip */}
      <div className="bg-linear-to-r from-slate-900 via-[#1f2327] to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Utilidad Operativa Distribuible
            </span>
            <div className="text-3xl font-black text-amber-400 tracking-tight mt-1">
              {formatCOP(summary.netOperativeSurplus)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Superávit neto de comisiones y servicios inmobiliarios del período.
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Dividendos Ya Retirados
            </span>
            <div className="text-2xl font-bold text-slate-200 tracking-tight mt-1">
              {formatCOP(summary.totalPartnerWithdrawals)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {partnerMovements.length} dispersiones registradas en el libro contable.
            </p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Saldo Disponible en Bancos
            </span>
            <div className="text-2xl font-bold text-emerald-400 tracking-tight mt-1">
              {formatCOP(summary.netCashFlow)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Liquidez real en cuentas corrientes y de ahorros.
            </p>
          </div>
        </div>
      </div>

      {/* Partners Equity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {partners.map((partner) => {
          const estimatedShare = (summary.netOperativeSurplus * partner.equityPercentage) / 100;
          return (
            <div
              key={partner.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: partner.avatarColor }}
              />

              <div className="flex items-start justify-between mb-4 mt-1">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm"
                    style={{ backgroundColor: partner.avatarColor }}
                  >
                    {partner.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-[#383B3D]">{partner.name}</h3>
                    <p className="text-xs text-slate-500">{partner.role}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-800 border border-slate-200">
                    {partner.equityPercentage}% Equity
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Capital Aportado Histórico:</span>
                  <span className="font-semibold text-slate-800">{formatCOP(partner.totalContributed)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Retiros Históricos:</span>
                  <span className="font-semibold text-rose-600">{formatCOP(partner.totalWithdrawn)}</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-700">Utilidad Proyectada ({partner.equityPercentage}%):</span>
                  <span className="font-extrabold text-sm text-amber-700">
                    {formatCOP(Math.max(0, estimatedShare))}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-600 flex flex-col gap-0.5">
                <span>Email: {partner.email}</span>
                <span>Tel: {partner.phone}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator / Payout Execution Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-[#383B3D]">
              Simulador y Dispersión de Dividendos a Socios
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            Cálculo proporcional según participación estatutaria
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-5">
          Ingresa el monto neto a repartir entre los socios. El sistema calculará el valor exacto para Dani Agudelo (50%),
          Mateo Restrepo (30%) y Carolina Correa (20%), y al confirmar registrará los 3 egresos correspondientes en el libro contable de MOAI-Kash.
        </p>

        {isSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>¡Excelente! Se ha realizado la dispersión de utilidades y se han registrado los 3 comprobantes de egreso en el libro diario.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Monto Total a Distribuir (COP):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={500000}
                value={distributeAmount}
                onChange={(e) => setDistributeAmount(Number(e.target.value))}
                className="w-full text-base font-extrabold p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#e10b17] focus:bg-white"
              />
              <button
                onClick={() => setDistributeAmount(Math.max(0, summary.netOperativeSurplus))}
                className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg whitespace-nowrap"
                title="Ajustar al 100% de la utilidad operativa actual"
              >
                100% Utilidad
              </button>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Valor en letras / formato: {formatCOP(distributeAmount)}
            </div>
          </div>

          {/* Breakdown Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-700 text-xs mb-1">Distribución resultante:</div>
            {partners.map((p) => {
              const portion = Math.round((distributeAmount * p.equityPercentage) / 100);
              return (
                <div key={p.id} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0">
                  <span className="font-medium text-slate-700">
                    {p.name} ({p.equityPercentage}%):
                  </span>
                  <span className="font-extrabold text-sm text-slate-900">{formatCOP(portion)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={handleDistribute}
            disabled={distributeAmount <= 0}
            className="px-5 py-2.5 bg-[#e10b17] hover:bg-[#c00510] disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-sm active:scale-98 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ejecutar & Registrar Dispersión a Socios</span>
          </button>
        </div>
      </div>

      {/* Historical Dividend Movements */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-[#383B3D] mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-600" />
          <span>Historial de Pagos y Retiros de Socios</span>
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {partnerMovements.length === 0 ? (
            <p className="text-slate-400 py-4 text-center">No hay registros de retiros previos.</p>
          ) : (
            partnerMovements.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{m.thirdParty}</div>
                  <div className="text-[11px] text-slate-600">
                    {formatDate(m.date)} · Ref: {m.voucherNumber || m.id} · {m.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-sm text-rose-600">{formatCOP(m.amount)}</div>
                  <div className="text-[10px] text-slate-600">{m.paymentMethod}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Printable Acta de Socios Modal */}
      {showActaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-base font-extrabold text-[#383B3D]">
                  ACTA DE REUNIÓN DE JUNTA DE SOCIOS · INMOBILIARIA MOAI SAS
                </h2>
                <p className="text-xs text-slate-500">Medellín, Colombia · NIT 901.845.291-3</p>
              </div>
              <button
                onClick={() => setShowActaModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                En la ciudad de Medellín, a los <strong>{new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>, 
                se reunieron en la sede administrativa de <strong>INMOBILIARIA MOAI</strong> los socios que representan el 100% del capital social:
              </p>

              <ul className="list-disc pl-5 space-y-1">
                {partners.map((p) => (
                  <li key={p.id}>
                    <strong>{p.name}</strong> ({p.role}) — Propietario del <strong>{p.equityPercentage}%</strong> de las cuotas sociales.
                  </li>
                ))}
              </ul>

              <h4 className="font-bold text-slate-900 pt-2 border-t border-slate-100">
                ORDEN DEL DÍA Y BALANCE CONTABLE DEL PERÍODO:
              </h4>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>(+) Ingresos Operacionales MOAI:</span>
                  <span className="font-bold text-emerald-700">{formatCOP(summary.totalIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span>(-) Egresos y Dispersiones:</span>
                  <span className="font-bold text-rose-700">{formatCOP(summary.totalExpense)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span>(=) Superávit Operativo Distribuible:</span>
                  <span className="text-amber-800">{formatCOP(summary.netOperativeSurplus)}</span>
                </div>
              </div>

              <p>
                Los socios por decisión unánime aprobaron el balance financiero emitido por el sistema <strong>MOAI-Kash</strong> y
                acordaron mantener como reserva operativa de caja la suma necesaria para cubrir las dispersiones a propietarios y pólizas de seguros del próximo ciclo.
              </p>

              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[10px]">
                {partners.map((p) => (
                  <div key={p.id} className="border-t border-slate-400 pt-2">
                    <div className="font-bold text-slate-800">{p.name}</div>
                    <div className="text-slate-500">{p.role}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#383B3D] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Acta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
