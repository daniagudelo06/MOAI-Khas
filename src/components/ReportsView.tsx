import React, { useRef } from 'react';
import { Movement, Partner, BudgetCategory, PropertyManaged, ScheduledPayment } from '../types';
import { formatCOP, calculateFinancialSummary, triggerFileDownload, formatDate } from '../utils/financial';
import { exportCompleteAccountingToExcel } from '../utils/excelExport';
import { 
  FileText, 
  Printer, 
  Download, 
  Upload, 
  TrendingUp, 
  Building2, 
  Users, 
  PieChart, 
  ShieldCheck, 
  FileSpreadsheet, 
  BarChart3 
} from 'lucide-react';

interface ReportsViewProps {
  movements: Movement[];
  scheduledPayments: ScheduledPayment[];
  partners: Partner[];
  budgets: BudgetCategory[];
  properties: PropertyManaged[];
  onImportBackup: (data: { movements: Movement[]; partners: Partner[]; properties: PropertyManaged[] }) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  movements,
  scheduledPayments,
  partners,
  budgets,
  properties,
  onImportBackup,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const summary = calculateFinancialSummary(movements);

  // Group revenues by main real estate lines
  const completed = movements.filter((m) => m.status === 'Completado');

  const ventaComisiones = completed
    .filter((m) => m.category === 'Comisión por Venta Inmueble')
    .reduce((s, m) => s + m.amount, 0);

  const arriendoComisiones = completed
    .filter((m) => m.category === 'Comisión Administración Arriendo')
    .reduce((s, m) => s + m.amount, 0);

  const canonesBrutos = completed
    .filter((m) => m.category === 'Canon de Arrendamiento Recaudado')
    .reduce((s, m) => s + m.amount, 0);

  const mudanzasIngresos = completed
    .filter((m) => m.category === 'Intermediación Servicio Mudanza')
    .reduce((s, m) => s + m.amount, 0);

  const reformasIngresos = completed
    .filter((m) => m.category === 'Servicio Reformas y Acabados')
    .reduce((s, m) => s + m.amount, 0);

  const avaluosIngresos = completed
    .filter((m) => m.category === 'Avalúo Inmobiliario')
    .reduce((s, m) => s + m.amount, 0);

  const otrosIngresos = completed
    .filter(
      (m) =>
        m.type === 'ingreso' &&
        ![
          'Comisión por Venta Inmueble',
          'Comisión Administración Arriendo',
          'Canon de Arrendamiento Recaudado',
          'Intermediación Servicio Mudanza',
          'Servicio Reformas y Acabados',
          'Avalúo Inmobiliario',
          'Aporte de Capital de Socios',
        ].includes(m.category)
    )
    .reduce((s, m) => s + m.amount, 0);

  // Group expenses
  const dispersionPropietarios = completed
    .filter((m) => m.category === 'Dispersión / Pago a Propietarios (Cánones)')
    .reduce((s, m) => s + m.amount, 0);

  const publicidadPortales = completed
    .filter((m) => m.category === 'Publicidad Portales (Finca Raíz, Metrocuadrado, Ads)')
    .reduce((s, m) => s + m.amount, 0);

  const comisionesAsesores = completed
    .filter((m) => m.category === 'Comisión a Asesores / Corredores MOAI')
    .reduce((s, m) => s + m.amount, 0);

  const produccionAudiovisual = completed
    .filter((m) => m.category === 'Fotografía, Video y Dron Inmobiliario')
    .reduce((s, m) => s + m.amount, 0);

  const sedeServicios = completed
    .filter((m) => m.category === 'Sede / Coworking Medellín y Servicios')
    .reduce((s, m) => s + m.amount, 0);

  const softwareSistemas = completed
    .filter((m) => m.category === 'Licencias Software Inmobiliario y CRM')
    .reduce((s, m) => s + m.amount, 0);

  const dividendosSocios = completed
    .filter((m) => m.category === 'Retiro de Utilidades / Dividendos Socios')
    .reduce((s, m) => s + m.amount, 0);

  const impuestos = completed
    .filter((m) => m.category === 'Impuestos (ICA Medellín, ReteFuente, IVA)')
    .reduce((s, m) => s + m.amount, 0);

  const otrosGastos = completed
    .filter(
      (m) =>
        m.type === 'egreso' &&
        ![
          'Dispersión / Pago a Propietarios (Cánones)',
          'Publicidad Portales (Finca Raíz, Metrocuadrado, Ads)',
          'Comisión a Asesores / Corredores MOAI',
          'Fotografía, Video y Dron Inmobiliario',
          'Sede / Coworking Medellín y Servicios',
          'Licencias Software Inmobiliario y CRM',
          'Retiro de Utilidades / Dividendos Socios',
          'Impuestos (ICA Medellín, ReteFuente, IVA)',
        ].includes(m.category)
    )
    .reduce((s, m) => s + m.amount, 0);

  // Backup handlers
  const handleExportFullBackup = () => {
    const backup = {
      app: 'MOAI-Kash',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      repository: 'https://github.com/daniagudelo06/MOAI-Kash',
      movements,
      partners,
      properties,
      budgets,
    };
    triggerFileDownload(
      JSON.stringify(backup, null, 2),
      `MOAI-Kash_Backup_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.movements && Array.isArray(parsed.movements)) {
          onImportBackup({
            movements: parsed.movements,
            partners: parsed.partners || partners,
            properties: parsed.properties || properties,
          });
          alert('¡Respaldo importado correctamente!');
        } else {
          alert('El archivo no contiene un formato válido de MOAI-Kash.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#383B3D] tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#e10b17]" />
            <span>Estado de Resultados (P&L) & Reporte Contable</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Informe financiero consolidado de rentabilidad inmobiliaria y herramientas de respaldo para GitHub.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() =>
              exportCompleteAccountingToExcel(
                movements,
                scheduledPayments,
                budgets,
                partners,
                properties
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            title="Descargar informe contable consolidado con todas las hojas en Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Descargar Informe en Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Importar respaldo JSON"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Restaurar Base</span>
          </button>

          <button
            onClick={handleExportFullBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Descargar copia para repositorio GitHub"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Backup JSON</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#383B3D] hover:bg-black text-white transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Informe</span>
          </button>
        </div>
      </div>

      {/* Financial Statement P&L Sheet */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs max-w-4xl mx-auto">
        {/* Statement Title */}
        <div className="text-center pb-6 border-b border-slate-200">
          <div className="font-extrabold text-2xl text-[#383B3D] tracking-tight">
            INMOBILIARIA MOAI SAS
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            NIT: 901.845.291-3 · Medellín, Antioquia · Sistema MOAI-Kash
          </div>
          <div className="inline-block mt-3 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-800">
            ESTADO DE RESULTADOS OPERACIONAL · PERÍODO ACTUAL (COP)
          </div>
        </div>

        {/* 1. Ingresos Operacionales */}
        <div className="py-5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-sm font-extrabold text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg">
            <span>1. INGRESOS OPERACIONALES NETOS INMOBILIARIOS</span>
            <span>{formatCOP(summary.agencyNetRevenue)}</span>
          </div>

          <div className="pl-4 space-y-1.5 pt-1 text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(+) Comisiones por Venta de Inmuebles (3% - 5%)</span>
              <span className="font-semibold text-slate-900">{formatCOP(ventaComisiones)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(+) Comisiones por Administración de Arriendos</span>
              <span className="font-semibold text-slate-900">{formatCOP(arriendoComisiones)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(+) Intermediación Servicios de Mudanza</span>
              <span className="font-semibold text-slate-900">{formatCOP(mudanzasIngresos)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(+) Margen Obras, Reformas y Acabados</span>
              <span className="font-semibold text-slate-900">{formatCOP(reformasIngresos)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(+) Honorarios Avalúos Comerciales RAA</span>
              <span className="font-semibold text-slate-900">{formatCOP(avaluosIngresos)}</span>
            </div>
            {otrosIngresos > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>(+) Otros Ingresos y Asesorías Legales</span>
                <span className="font-semibold text-slate-900">{formatCOP(otrosIngresos)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Gastos Operativos de la Agencia */}
        <div className="py-5 space-y-2 text-xs border-t border-slate-200">
          <div className="flex justify-between items-center text-sm font-extrabold text-rose-800 bg-rose-50/70 p-2.5 rounded-lg">
            <span>2. GASTOS OPERACIONALES & COMERCIALES</span>
            <span>
              {formatCOP(
                summary.totalExpense - dispersionPropietarios - dividendosSocios
              )}
            </span>
          </div>

          <div className="pl-4 space-y-1.5 pt-1 text-slate-700">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(-) Comisiones a Asesores y Corredores MOAI</span>
              <span className="font-semibold text-rose-700">{formatCOP(comisionesAsesores)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(-) Pauta Publicitaria Portales (Finca Raíz, Metrocuadrado, Ads)</span>
              <span className="font-semibold text-rose-700">{formatCOP(publicidadPortales)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(-) Fotografía, Video y Recorridos Dron</span>
              <span className="font-semibold text-rose-700">{formatCOP(produccionAudiovisual)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(-) Sede Medellín, Coworking y Servicios</span>
              <span className="font-semibold text-rose-700">{formatCOP(sedeServicios)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>(-) Software Inmobiliario, CRM y Hosting</span>
              <span className="font-semibold text-rose-700">{formatCOP(softwareSistemas)}</span>
            </div>
            {impuestos > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>(-) Impuestos y Retenciones (ICA / DIAN)</span>
                <span className="font-semibold text-rose-700">{formatCOP(impuestos)}</span>
              </div>
            )}
            {otrosGastos > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>(-) Otros Gastos Operativos y de Representación</span>
                <span className="font-semibold text-rose-700">{formatCOP(otrosGastos)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Utilidad Operativa Neta */}
        <div className="py-4 bg-amber-50 rounded-xl p-4 border border-amber-200 flex justify-between items-center text-sm font-extrabold text-amber-950">
          <span>(=) UTILIDAD OPERATIVA DISTRIBUIBLE (EBITDA)</span>
          <span className="text-xl text-[#e10b17]">{formatCOP(summary.netOperativeSurplus)}</span>
        </div>

        {/* 4. Repartición de Utilidades a Socios */}
        <div className="py-5 space-y-2 text-xs border-t border-slate-200 mt-4">
          <div className="flex justify-between items-center text-sm font-extrabold text-slate-800 bg-slate-100 p-2.5 rounded-lg">
            <span>3. DISTRIBUCIÓN PACTADA ENTRE SOCIOS</span>
            <span>{formatCOP(dividendosSocios)} ejecutados</span>
          </div>

          <div className="pl-4 space-y-2 pt-2 text-slate-700">
            {partners.map((p) => {
              const share = (summary.netOperativeSurplus * p.equityPercentage) / 100;
              return (
                <div key={p.id} className="flex justify-between items-center py-1 border-b border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800">{p.name}</span>
                    <span className="text-slate-500 ml-1">({p.equityPercentage}% - {p.role})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatCOP(Math.max(0, share))}</span>
                    <div className="text-[10px] text-slate-600">Porción estatutaria</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Cuentas de Orden / Pasos a Terceros (Cánones de Arrendamiento) */}
        <div className="py-4 border-t border-slate-200 text-xs text-slate-500">
          <div className="font-bold text-slate-700 mb-1">Cuentas de Mandato y Arrendamiento (Paso a Terceros):</div>
          <div className="flex justify-between py-0.5">
            <span>Total Cánones de Arriendo Brutos Recaudados:</span>
            <span className="font-mono">{formatCOP(canonesBrutos)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Total Cánones Netos Dispersados a Propietarios:</span>
            <span className="font-mono">{formatCOP(dispersionPropietarios)}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-10 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-[10px] text-slate-500 border-t border-slate-200 mt-6">
          <div className="border-t border-slate-400 pt-1.5">
            <div className="font-bold text-slate-800">Dani Agudelo</div>
            <div>Socio Fundador & Representante Legal</div>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <div className="font-bold text-slate-800">Mateo Restrepo</div>
            <div>Socio Director Comercial</div>
          </div>
          <div className="border-t border-slate-400 pt-1.5">
            <div className="font-bold text-slate-800">Carolina Correa</div>
            <div>Socia Directora Financiera</div>
          </div>
        </div>
      </div>
    </div>
  );
};
