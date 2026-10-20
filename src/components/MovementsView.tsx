import React, { useState, useMemo } from 'react';
import { Movement, MovementType, PropertyManaged, Partner, Category } from '../types';
import { formatCOP, formatDate, exportMovementsToCSV, triggerFileDownload } from '../utils/financial';
import { exportMovementsOnlyToExcel } from '../utils/excelExport';
import { 
  Search, 
  Filter, 
  Download, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Building2, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  Copy, 
  Receipt, 
  FileCheck2, 
  CheckCircle2, 
  Clock, 
  X,
  FileText
} from 'lucide-react';

interface MovementsViewProps {
  movements: Movement[];
  properties: PropertyManaged[];
  partners: Partner[];
  onOpenNewMovement: () => void;
  onEditMovement: (m: Movement) => void;
  onDeleteMovement: (id: string) => void;
  onDuplicateMovement: (m: Movement) => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  movements,
  properties,
  partners,
  onOpenNewMovement,
  onEditMovement,
  onDeleteMovement,
  onDuplicateMovement,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | MovementType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [selectedPartner, setSelectedPartner] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Movement | null>(null);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // Tab filter
      if (activeTab !== 'all' && m.type !== activeTab) return false;

      // Property filter
      if (selectedProperty !== 'all' && m.propertyCode !== selectedProperty) return false;

      // Category filter
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;

      // Method filter
      if (selectedMethod !== 'all' && m.paymentMethod !== selectedMethod) return false;

      // Partner filter
      if (selectedPartner !== 'all' && m.partnerId !== selectedPartner) return false;

      // Search text filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchDesc = m.description.toLowerCase().includes(query);
        const matchThird = m.thirdParty.toLowerCase().includes(query);
        const matchCat = m.category.toLowerCase().includes(query);
        const matchCode = (m.propertyCode || '').toLowerCase().includes(query);
        const matchVoucher = (m.voucherNumber || '').toLowerCase().includes(query);
        if (!matchDesc && !matchThird && !matchCat && !matchCode && !matchVoucher) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [movements, activeTab, selectedProperty, selectedCategory, selectedMethod, selectedPartner, searchQuery]);

  // Aggregate stats for current view
  const stats = useMemo(() => {
    const inc = filteredMovements
      .filter((m) => m.type === 'ingreso' && m.status === 'Completado')
      .reduce((s, m) => s + m.amount, 0);
    const exp = filteredMovements
      .filter((m) => m.type === 'egreso' && m.status === 'Completado')
      .reduce((s, m) => s + m.amount, 0);
    return {
      income: inc,
      expense: exp,
      net: inc - exp,
      count: filteredMovements.length,
    };
  }, [filteredMovements]);

  // Handle Export Excel (.xlsx)
  const handleExportExcel = () => {
    exportMovementsOnlyToExcel(filteredMovements);
  };

  // Handle Export CSV
  const handleExportCSV = () => {
    const csv = exportMovementsToCSV(filteredMovements);
    triggerFileDownload(csv, `MOAI-Kash_Movimientos_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  // Handle Export JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredMovements, null, 2);
    triggerFileDownload(jsonStr, `MOAI-Kash_Movimientos_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
  };

  // Unique categories in movements
  const allCategories = useMemo(() => {
    return Array.from(new Set(movements.map((m) => m.category))).sort();
  }, [movements]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Action controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#383B3D] tracking-tight">
            Libro Diario de Movimientos Contables
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Registro estructurado tipo Eduplata: a medida que agregas transacciones se construye la base de datos contable.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Excel Export button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
            title="Exportar movimientos filtrados a formato Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Descargar Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Exportar a formato CSV"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Descargar copia JSON de seguridad"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>JSON</span>
          </button>

          <button
            onClick={onOpenNewMovement}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#e10b17] hover:bg-[#c00510] text-white transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nuevo Registro</span>
          </button>
        </div>
      </div>

      {/* Filter and Tab Navigation */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        {/* Main Movement Type Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({movements.length})
            </button>
            <button
              onClick={() => setActiveTab('ingreso')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'ingreso'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Ingresos ({movements.filter((m) => m.type === 'ingreso').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('egreso')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'egreso'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Egresos ({movements.filter((m) => m.type === 'egreso').length})</span>
            </button>
          </div>

          {/* Quick search input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, inmueble, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17] focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Multi-dropdown filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Property Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Inmueble / Proyecto</label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#e10b17]"
            >
              <option value="all">Todos los Inmuebles</option>
              {properties.map((p) => (
                <option key={p.id} value={p.code}>
                  {p.code} - {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Línea / Categoría</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#e10b17]"
            >
              <option value="all">Todas las Categorías</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cuenta / Método</label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#e10b17]"
            >
              <option value="all">Todos los Métodos</option>
              <option value="Bancolombia Transferencia">Bancolombia Transferencia</option>
              <option value="Cuenta Corriente MOAI">Cuenta Corriente MOAI</option>
              <option value="Caja Menor / Efectivo">Caja Menor / Efectivo</option>
              <option value="Wompi / PSE">Wompi / PSE</option>
              <option value="Consignación Bancaria">Consignación Bancaria</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          {/* Partner Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Socio Asignado</label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#e10b17]"
            >
              <option value="all">Todos los Socios</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.equityPercentage}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Aggregate summary ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 bg-slate-50/80 -mx-4 -mb-4 p-3 rounded-b-xl">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Registros visibles</div>
            <div className="text-base font-bold text-slate-800">{stats.count} movimientos</div>
          </div>
          <div>
            <div className="text-[10px] text-emerald-600 uppercase font-semibold">Ingresos filtrados</div>
            <div className="text-base font-bold text-emerald-700">{formatCOP(stats.income)}</div>
          </div>
          <div>
            <div className="text-[10px] text-rose-600 uppercase font-semibold">Egresos filtrados</div>
            <div className="text-base font-bold text-rose-700">{formatCOP(stats.expense)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Balance neto filtro</div>
            <div className={`text-base font-bold ${stats.net >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {formatCOP(stats.net)}
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Fecha</th>
                <th className="py-3 px-3.5">Comprobante</th>
                <th className="py-3 px-3.5">Tipo</th>
                <th className="py-3 px-3.5">Categoría Inmobiliaria</th>
                <th className="py-3 px-3.5">Inmueble / Ref</th>
                <th className="py-3 px-3.5">Tercero / Cliente</th>
                <th className="py-3 px-3.5">Método de Pago</th>
                <th className="py-3 px-3.5 text-right">Monto (COP)</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Filter className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">No se encontraron movimientos con los filtros seleccionados.</p>
                    <p className="text-xs text-slate-400 mt-1">Intenta cambiar la búsqueda o restablecer filtros.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isIncome = m.type === 'ingreso';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Fecha */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 font-medium">
                        {formatDate(m.date)}
                      </td>

                      {/* Comprobante */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {m.voucherNumber || 'S/N'}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isIncome ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isIncome ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-3.5 text-slate-800 font-medium max-w-[200px] truncate" title={m.category}>
                        {m.category}
                      </td>

                      {/* Inmueble */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {m.propertyCode ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#e10b17] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            <Building2 className="w-3 h-3" />
                            {m.propertyCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Corporativo</span>
                        )}
                      </td>

                      {/* Tercero */}
                      <td className="py-3 px-3.5 text-slate-700 max-w-[180px] truncate" title={m.thirdParty}>
                        <div className="font-medium truncate">{m.thirdParty}</div>
                        <div className="text-[10px] text-slate-600 truncate">{m.description}</div>
                      </td>

                      {/* Método */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-600 text-[11px]">
                        {m.paymentMethod}
                      </td>

                      {/* Monto */}
                      <td
                        className={`py-3 px-3.5 whitespace-nowrap text-right font-extrabold text-sm ${
                          isIncome ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCOP(m.amount)}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            m.status === 'Completado'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.status === 'Programado'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {m.status === 'Completado' && <CheckCircle2 className="w-3 h-3" />}
                          {m.status === 'Programado' && <Clock className="w-3 h-3" />}
                          {m.status}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                          {/* Ver comprobante / recibo */}
                          <button
                            onClick={() => setSelectedReceipt(m)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            title="Ver Recibo de Caja / Comprobante"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          {/* Editar */}
                          <button
                            onClick={() => onEditMovement(m)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar registro"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {/* Duplicar */}
                          <button
                            onClick={() => onDuplicateMovement(m)}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Duplicar movimiento"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {/* Eliminar */}
                          <button
                            onClick={() => onDeleteMovement(m.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Eliminar movimiento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt / Voucher Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center pb-4 border-b border-slate-200">
              <div className="flex justify-center mb-2">
                <span className="font-extrabold text-2xl tracking-tight text-[#383B3D]">
                  MOAI <span className="text-[#e10b17]">Kash</span>
                </span>
              </div>
              <div className="text-xs text-slate-500">Inmobiliaria MOAI · Medellín, Antioquia</div>
              <div className="text-xs text-slate-500">NIT: 901.845.291-3 · www.inmobiliariamoai.com</div>
              <div className="mt-2 inline-block font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {selectedReceipt.type === 'ingreso' ? 'RECIBO DE CAJA / INGRESO' : 'COMPROBANTE DE EGRESO'} #{' '}
                {selectedReceipt.voucherNumber || selectedReceipt.id.slice(0, 8)}
              </div>
            </div>

            {/* Receipt Body */}
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Fecha de Registro:</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedReceipt.date)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Tercero / Cliente:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.thirdParty}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Concepto / Categoría:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.category}</span>
              </div>

              {selectedReceipt.propertyCode && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Inmueble / Referencia:</span>
                  <span className="font-mono font-bold text-[#e10b17]">{selectedReceipt.propertyCode}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Forma de Pago:</span>
                <span className="font-medium text-slate-800">{selectedReceipt.paymentMethod}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Detalle / Notas:</span>
                <span className="text-slate-700 text-right max-w-[260px]">{selectedReceipt.description}</span>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">TOTAL:</span>
                <span className="text-lg font-black text-[#e10b17]">{formatCOP(selectedReceipt.amount)}</span>
              </div>
            </div>

            {/* Footer with Print Button */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-600 flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" /> Aprobado Contabilidad MOAI
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#383B3D] hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
