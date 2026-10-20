import React, { useState } from 'react';
import { PropertyManaged, Movement } from '../types';
import { formatCOP, formatCompactCOP, formatDate } from '../utils/financial';
import { exportPropertyStatementToExcel } from '../utils/excelExport';
import { 
  Building2, 
  PlusCircle, 
  FileSpreadsheet, 
  ShieldCheck, 
  MapPin, 
  User, 
  Phone, 
  ExternalLink, 
  Search,
  CheckCircle2,
  Receipt,
  Printer
} from 'lucide-react';

interface PropertiesViewProps {
  properties: PropertyManaged[];
  movements: Movement[];
  onAddProperty: (prop: Omit<PropertyManaged, 'id'>) => void;
  onFilterMovementsByProperty: (code: string) => void;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  movements,
  onAddProperty,
  onFilterMovementsByProperty,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<'all' | 'Arriendo' | 'Venta' | 'Ambos'>('all');
  const [selectedPropertyStatement, setSelectedPropertyStatement] = useState<PropertyManaged | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New property form state
  const [code, setCode] = useState(`MOAI-${100 + properties.length + 1}`);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PropertyManaged['type']>('Apartamento');
  const [operation, setOperation] = useState<PropertyManaged['operation']>('Arriendo');
  const [zone, setZone] = useState('El Poblado');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerBankInfo, setOwnerBankInfo] = useState('');
  const [rentalCanon, setRentalCanon] = useState<number>(0);
  const [adminFeePercent, setAdminFeePercent] = useState<number>(9.5);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [insurancePolicy, setInsurancePolicy] = useState('Seguros Sura');

  // Filtered properties
  const filtered = properties.filter((p) => {
    if (selectedOperation !== 'all' && p.operation !== selectedOperation && p.operation !== 'Ambos') {
      return false;
    }
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchCode = p.code.toLowerCase().includes(q);
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchZone = p.zone.toLowerCase().includes(q);
      const matchOwner = p.ownerName.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchZone && !matchOwner) return false;
    }
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !ownerName) return;

    onAddProperty({
      code,
      title,
      type,
      operation,
      zone,
      address,
      ownerName,
      ownerPhone,
      ownerBankInfo,
      rentalCanon: rentalCanon > 0 ? rentalCanon : undefined,
      adminFeePercent,
      salePrice: salePrice > 0 ? salePrice : undefined,
      insurancePolicy,
      status: 'Activo',
    });

    setIsModalOpen(false);
    // Reset
    setTitle('');
    setAddress('');
    setOwnerName('');
    setOwnerPhone('');
    setOwnerBankInfo('');
    setRentalCanon(0);
    setSalePrice(0);
  };

  // Extract movements related to a property
  const getMovementsForProperty = (propCode: string) => {
    return movements.filter((m) => m.propertyCode === propCode);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#383B3D] tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#e10b17]" />
            <span>Cartera Inmobiliaria MOAI & Estados de Cuenta</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control de propiedades en arriendo y venta, comisiones de administración, pólizas y extractos para propietarios.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-[#e10b17] hover:bg-[#c00510] text-white transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Registrar Inmueble</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setSelectedOperation('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedOperation === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
            }`}
          >
            Todos ({properties.length})
          </button>
          <button
            onClick={() => setSelectedOperation('Arriendo')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedOperation === 'Arriendo' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
            }`}
          >
            En Arriendo
          </button>
          <button
            onClick={() => setSelectedOperation('Venta')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedOperation === 'Venta' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
            }`}
          >
            En Venta
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, zona, dueño..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
          />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((prop) => {
          const propMovements = getMovementsForProperty(prop.code);
          const totalRecaudado = propMovements
            .filter((m) => m.type === 'ingreso' && m.status === 'Completado')
            .reduce((s, m) => s + m.amount, 0);

          const totalDispersado = propMovements
            .filter((m) => m.type === 'egreso' && m.status === 'Completado')
            .reduce((s, m) => s + m.amount, 0);

          return (
            <div
              key={prop.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black text-white bg-[#e10b17] px-2 py-0.5 rounded-md shadow-xs">
                    {prop.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {prop.type} · {prop.operation}
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#383B3D] mb-1">{prop.title}</h3>

                <div className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{prop.address || prop.zone}</span>
                </div>

                {/* Financial Values */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 space-y-2 text-xs mb-4">
                  {prop.rentalCanon && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Canon Mensual:</span>
                      <span className="font-extrabold text-slate-900">{formatCOP(prop.rentalCanon)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Comisión MOAI:</span>
                    <span className="font-bold text-[#e10b17]">{prop.adminFeePercent}% mensual</span>
                  </div>

                  {prop.salePrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Precio Venta:</span>
                      <span className="font-extrabold text-slate-900">{formatCompactCOP(prop.salePrice)}</span>
                    </div>
                  )}

                  {prop.insurancePolicy && (
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Póliza:
                      </span>
                      <span className="font-medium text-slate-700 truncate max-w-[140px]">{prop.insurancePolicy}</span>
                    </div>
                  )}
                </div>

                {/* Owner & Tenant Info */}
                <div className="text-xs space-y-1 mb-4 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span><strong>Propietario:</strong> {prop.ownerName}</span>
                  </div>
                  {prop.tenantName && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      <span><strong>Inquilino:</strong> {prop.tenantName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedPropertyStatement(prop)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                  title="Ver extracto mensual para el propietario"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Estado de Cuenta</span>
                </button>

                <button
                  onClick={() => onFilterMovementsByProperty(prop.code)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-[#e10b17] transition-colors"
                  title="Ver movimientos en libro diario"
                >
                  Movimientos ({propMovements.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Property Owner Statement Modal (Extracto de Arrendamiento) */}
      {selectedPropertyStatement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#e10b17] tracking-wider">
                  Inmobiliaria MOAI · Extracto de Liquidación
                </span>
                <h2 className="text-lg font-bold text-[#383B3D]">
                  Estado de Cuenta · {selectedPropertyStatement.code}
                </h2>
                <p className="text-xs text-slate-500">{selectedPropertyStatement.title}</p>
              </div>
              <button
                onClick={() => setSelectedPropertyStatement(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div><strong>Propietario:</strong> {selectedPropertyStatement.ownerName}</div>
                <div><strong>Cuenta de Abono:</strong> {selectedPropertyStatement.ownerBankInfo || 'Bancolombia'}</div>
                <div><strong>Inquilino Actual:</strong> {selectedPropertyStatement.tenantName || 'N/A'}</div>
                <div><strong>Póliza de Afianzamiento:</strong> {selectedPropertyStatement.insurancePolicy || 'Sura'}</div>
              </div>

              <h4 className="font-bold text-slate-800 pt-2">Movimientos del Inmueble:</h4>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {getMovementsForProperty(selectedPropertyStatement.code).map((m) => (
                  <div key={m.id} className="p-2.5 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{m.category}</div>
                      <div className="text-[10px] text-slate-600">{formatDate(m.date)} · {m.description}</div>
                    </div>
                    <div className={`font-extrabold ${m.type === 'ingreso' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {m.type === 'ingreso' ? '+' : '-'}{formatCOP(m.amount)}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPropertyStatement.rentalCanon && (
                <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Canon Bruto Recaudado:</span>
                    <span className="font-bold">{formatCOP(selectedPropertyStatement.rentalCanon)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>(-) Comisión de Administración MOAI ({selectedPropertyStatement.adminFeePercent}%):</span>
                    <span className="font-bold">
                      -{formatCOP((selectedPropertyStatement.rentalCanon * selectedPropertyStatement.adminFeePercent) / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-1 border-t border-slate-200">
                    <span>Neto Girado a Propietario:</span>
                    <span className="text-emerald-700">
                      {formatCOP(
                        selectedPropertyStatement.rentalCanon -
                          (selectedPropertyStatement.rentalCanon * selectedPropertyStatement.adminFeePercent) / 100
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => exportPropertyStatementToExcel(selectedPropertyStatement, movements)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Descargar extracto en Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Descargar en Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#383B3D] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Extracto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Property Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#383B3D] mb-1">Registrar Nuevo Inmueble en Cartera</h2>
            <p className="text-xs text-slate-500 mb-4">
              Agrega una propiedad para controlar sus cánones, comisiones administrativas y pólizas de afianzamiento.
            </p>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código de Referencia MOAI</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-[#e10b17]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Operación</label>
                  <select
                    value={operation}
                    onChange={(e) => setOperation(e.target.value as PropertyManaged['operation'])}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Arriendo">Arriendo</option>
                    <option value="Venta">Venta</option>
                    <option value="Ambos">Ambos (Arriendo o Venta)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título / Nombre del Inmueble</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Apartamento Laureles Parque 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Propiedad</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as PropertyManaged['type'])}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Apartamento">Apartamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Oficina / Local">Oficina / Local</option>
                    <option value="Lote">Lote</option>
                    <option value="Finca">Finca</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Zona / Sector</label>
                  <input
                    type="text"
                    placeholder="El Poblado, Laureles, Envigado..."
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Canon Mensual (COP)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ej: 3200000"
                    value={rentalCanon || ''}
                    onChange={(e) => setRentalCanon(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">% Administración MOAI</label>
                  <input
                    type="number"
                    step={0.5}
                    value={adminFeePercent}
                    onChange={(e) => setAdminFeePercent(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Propietario</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellidos"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono Propietario</label>
                  <input
                    type="text"
                    placeholder="+57 300 000 0000"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cuenta Bancaria para Dispersión</label>
                  <input
                    type="text"
                    placeholder="Bancolombia Ahorros #..."
                    value={ownerBankInfo}
                    onChange={(e) => setOwnerBankInfo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e10b17] hover:bg-[#c00510] text-white rounded-lg font-semibold"
                >
                  Guardar Inmueble
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
