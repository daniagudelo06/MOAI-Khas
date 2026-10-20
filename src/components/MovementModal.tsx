import React, { useState, useEffect } from 'react';
import { Movement, MovementType, Category, PaymentMethod, MovementStatus, PropertyManaged, Partner, IncomeCategory, ExpenseCategory } from '../types';
import { formatCOP } from '../utils/financial';
import { X, Building2, Calculator, CheckCircle2, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (movementData: Omit<Movement, 'id' | 'createdAt'>, id?: string) => void;
  editingMovement?: Movement | null;
  properties: PropertyManaged[];
  partners: Partner[];
}

const INCOME_CATEGORIES: IncomeCategory[] = [
  'Comisión por Venta Inmueble',
  'Comisión Administración Arriendo',
  'Canon de Arrendamiento Recaudado',
  'Intermediación Servicio Mudanza',
  'Servicio Reformas y Acabados',
  'Mantenimiento Cobrado a Inquilino',
  'Asesoría Jurídica y Financiera',
  'Comisión Crédito Hipotecario / Préstamos',
  'Avalúo Inmobiliario',
  'Aporte de Capital de Socios',
  'Rendimientos Financieros',
  'Otros Ingresos Inmobiliarios',
];

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Dispersión / Pago a Propietarios (Cánones)',
  'Póliza Seguros Arrendamiento (Sura / Libertador)',
  'Comisión a Asesores / Corredores MOAI',
  'Publicidad Portales (Finca Raíz, Metrocuadrado, Ads)',
  'Fotografía, Video y Dron Inmobiliario',
  'Mantenimiento / Reparaciones Locativas',
  'Materiales y Contratistas Reformas',
  'Gastos Notariales, Curaduría y Registro',
  'Nómina Administrativa y Seguridad Social',
  'Sede / Coworking Medellín y Servicios',
  'Licencias Software Inmobiliario y CRM',
  'Impuestos (ICA Medellín, ReteFuente, IVA)',
  'Retiro de Utilidades / Dividendos Socios',
  'Gastos de Representación y Transporte',
  'Otros Gastos Operacionales',
];

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMovement,
  properties,
  partners,
}) => {
  const [type, setType] = useState<MovementType>('ingreso');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<Category>('Comisión Administración Arriendo');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [thirdParty, setThirdParty] = useState('');
  const [propertyCode, setPropertyCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bancolombia Transferencia');
  const [status, setStatus] = useState<MovementStatus>('Completado');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-calculation helper for real estate commissions
  const [calcBase, setCalcBase] = useState<number>(0);
  const [calcPct, setCalcPct] = useState<number>(3);

  useEffect(() => {
    if (editingMovement) {
      setType(editingMovement.type);
      setDate(editingMovement.date);
      setCategory(editingMovement.category);
      setAmount(editingMovement.amount);
      setDescription(editingMovement.description);
      setThirdParty(editingMovement.thirdParty);
      setPropertyCode(editingMovement.propertyCode || '');
      setPaymentMethod(editingMovement.paymentMethod);
      setStatus(editingMovement.status);
      setVoucherNumber(editingMovement.voucherNumber || '');
      setPartnerId(editingMovement.partnerId || '');
      setNotes(editingMovement.notes || '');
    } else {
      // Default new
      setType('ingreso');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory('Comisión por Venta Inmueble');
      setAmount(0);
      setDescription('');
      setThirdParty('');
      setPropertyCode('');
      setPaymentMethod('Bancolombia Transferencia');
      setStatus('Completado');
      setVoucherNumber(`MOV-${Date.now().toString().slice(-4)}`);
      setPartnerId(partners[0]?.id || '');
      setNotes('');
    }
  }, [editingMovement, isOpen, partners]);

  // When type changes, adjust default category
  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    if (newType === 'ingreso') {
      setCategory('Comisión por Venta Inmueble');
    } else {
      setCategory('Publicidad Portales (Finca Raíz, Metrocuadrado, Ads)');
    }
  };

  // When property is chosen, auto-fill third party or canon
  const handlePropertyChange = (code: string) => {
    setPropertyCode(code);
    const prop = properties.find((p) => p.code === code);
    if (prop) {
      if (category === 'Canon de Arrendamiento Recaudado' && prop.rentalCanon) {
        setAmount(prop.rentalCanon);
        if (prop.tenantName) setThirdParty(prop.tenantName);
        setDescription(`Recaudo canon arrendamiento ${prop.code} - ${prop.title}`);
      } else if (category === 'Comisión Administración Arriendo' && prop.rentalCanon) {
        const fee = Math.round((prop.rentalCanon * prop.adminFeePercent) / 100);
        setAmount(fee);
        setDescription(`Comisión administración ${prop.adminFeePercent}% ${prop.code}`);
        setThirdParty(prop.ownerName);
      } else if (category === 'Dispersión / Pago a Propietarios (Cánones)' && prop.rentalCanon) {
        const net = Math.round(prop.rentalCanon * (1 - prop.adminFeePercent / 100));
        setAmount(net);
        setThirdParty(prop.ownerName);
        setDescription(`Giro neto mensual a propietario ${prop.ownerName} (${prop.code})`);
      }
    }
  };

  // Helper to apply calculated commission
  const applyCommission = () => {
    if (calcBase > 0 && calcPct > 0) {
      const calculated = Math.round((calcBase * calcPct) / 100);
      setAmount(calculated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !thirdParty || !description) return;

    onSave(
      {
        type,
        date,
        category,
        amount,
        description,
        thirdParty,
        propertyCode: propertyCode || undefined,
        paymentMethod,
        status,
        voucherNumber: voucherNumber || undefined,
        partnerId: partnerId || undefined,
        notes: notes || undefined,
      },
      editingMovement?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-extrabold text-[#383B3D]">
              {editingMovement ? 'Editar Movimiento Contable' : 'Registrar Nuevo Movimiento · MOAI-Kash'}
            </h2>
            <p className="text-xs text-slate-500">
              Asienta transacciones inmobiliarias con cálculo de comisiones e impacto en el flujo de caja.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Movement Type Toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleTypeChange('ingreso')}
              className={`flex-1 py-2 rounded-md font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                type === 'ingreso'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Ingreso</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('egreso')}
              className={`flex-1 py-2 rounded-md font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
                type === 'egreso'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Egreso / Gasto</span>
            </button>
          </div>

          {/* Date and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fecha Contable</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoría Inmobiliaria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
              >
                {type === 'ingreso'
                  ? INCOME_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))
                  : EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {/* Amount & Quick Real Estate Commission Calculator */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-extrabold text-slate-800 text-sm">
                Monto de la Transacción (COP) *
              </label>
              <span className="font-extrabold text-base text-[#e10b17]">
                {formatCOP(amount)}
              </span>
            </div>

            <input
              type="number"
              required
              min={1}
              step={1000}
              placeholder="Ej: 8500000"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full p-2.5 text-base font-extrabold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#e10b17]"
            />

            {/* Quick helper for commission calculation */}
            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Calculator className="w-3.5 h-3.5 text-slate-500" />
                Calcular Comisión:
              </span>
              <input
                type="number"
                placeholder="Valor base (ej. 300M)"
                value={calcBase || ''}
                onChange={(e) => setCalcBase(Number(e.target.value))}
                className="w-36 p-1 bg-white border border-slate-300 rounded text-xs"
              />
              <span className="font-semibold">x</span>
              <select
                value={calcPct}
                onChange={(e) => setCalcPct(Number(e.target.value))}
                className="p-1 bg-white border border-slate-300 rounded text-xs"
              >
                <option value={3}>3% (Venta Urbana)</option>
                <option value={4}>4% (Venta Rural)</option>
                <option value={9.5}>9.5% (Admin Arriendo)</option>
                <option value={10}>10% (Admin Arriendo)</option>
                <option value={15}>15% (Comisión Mudanza)</option>
              </select>
              <button
                type="button"
                onClick={applyCommission}
                className="px-2.5 py-1 bg-[#383B3D] hover:bg-black text-white font-semibold rounded text-xs"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Inmueble & Tercero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Inmueble / Propiedad MOAI (Opcional)
              </label>
              <select
                value={propertyCode}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
              >
                <option value="">Gasto General / Corporativo</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.code} - {p.title} ({p.operation})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tercero (Cliente / Inquilino / Notaría / Proveedor) *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Inversiones Castropol / Notaría 14 / Sura"
                value={thirdParty}
                onChange={(e) => setThirdParty(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Descripción / Concepto *</label>
            <input
              type="text"
              required
              placeholder="Ej: Pago comisión corretaje por venta de propiedad en Envigado"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
            />
          </div>

          {/* Payment Method & Voucher & Partner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cuenta / Forma de Pago</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
              >
                <option value="Bancolombia Transferencia">Bancolombia Transferencia</option>
                <option value="Cuenta Corriente MOAI">Cuenta Corriente MOAI</option>
                <option value="Caja Menor / Efectivo">Caja Menor / Efectivo</option>
                <option value="Wompi / PSE">Wompi / PSE</option>
                <option value="Consignación Bancaria">Consignación Bancaria</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">N° Comprobante / Recibo</label>
              <input
                type="text"
                placeholder="RC-2026-1045"
                value={voucherNumber}
                onChange={(e) => setVoucherNumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Socio Asignado</label>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
              >
                <option value="">Corporativo / Sin asignar</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.equityPercentage}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notas Internas</label>
            <textarea
              rows={2}
              placeholder="Detalles adicionales, número de escritura, póliza, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#e10b17]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#e10b17] hover:bg-[#c00510] text-white rounded-lg font-bold shadow-xs active:scale-98 transition-all"
            >
              {editingMovement ? 'Guardar Cambios' : 'Asentar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
