export type MovementType = 'ingreso' | 'egreso' | 'transferencia';

export type MovementStatus = 'Completado' | 'Programado' | 'Pendiente' | 'Anulado';

export type PaymentMethod = 
  | 'Bancolombia Transferencia' 
  | 'Cuenta Corriente MOAI' 
  | 'Caja Menor / Efectivo' 
  | 'Wompi / PSE' 
  | 'Consignación Bancaria' 
  | 'Cheque';

export type IncomeCategory =
  | 'Comisión por Venta Inmueble'
  | 'Comisión Administración Arriendo'
  | 'Canon de Arrendamiento Recaudado'
  | 'Intermediación Servicio Mudanza'
  | 'Servicio Reformas y Acabados'
  | 'Mantenimiento Cobrado a Inquilino'
  | 'Asesoría Jurídica y Financiera'
  | 'Comisión Crédito Hipotecario / Préstamos'
  | 'Avalúo Inmobiliario'
  | 'Aporte de Capital de Socios'
  | 'Rendimientos Financieros'
  | 'Otros Ingresos Inmobiliarios';

export type ExpenseCategory =
  | 'Dispersión / Pago a Propietarios (Cánones)'
  | 'Póliza Seguros Arrendamiento (Sura / Libertador)'
  | 'Comisión a Asesores / Corredores MOAI'
  | 'Publicidad Portales (Finca Raíz, Metrocuadrado, Ads)'
  | 'Fotografía, Video y Dron Inmobiliario'
  | 'Mantenimiento / Reparaciones Locativas'
  | 'Materiales y Contratistas Reformas'
  | 'Gastos Notariales, Curaduría y Registro'
  | 'Nómina Administrativa y Seguridad Social'
  | 'Sede / Coworking Medellín y Servicios'
  | 'Licencias Software Inmobiliario y CRM'
  | 'Impuestos (ICA Medellín, ReteFuente, IVA)'
  | 'Retiro de Utilidades / Dividendos Socios'
  | 'Gastos de Representación y Transporte'
  | 'Otros Gastos Operacionales';

export type Category = IncomeCategory | ExpenseCategory;

export interface Movement {
  id: string;
  date: string; // YYYY-MM-DD
  type: MovementType;
  category: Category;
  amount: number; // in COP
  description: string;
  thirdParty: string; // Inquilino, Propietario, Notaría, Proveedor, etc.
  propertyCode?: string; // e.g. "MOAI-104"
  propertyTitle?: string;
  paymentMethod: PaymentMethod;
  status: MovementStatus;
  voucherNumber?: string; // Recibo de caja / Factura / N° transferencia
  partnerId?: string; // If registered or assigned to specific partner
  dueDate?: string; // For scheduled movements
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ScheduledType = 
  | 'cobro_canon' 
  | 'pago_propietario' 
  | 'comision_asesor' 
  | 'poliza_arriendo' 
  | 'pauta_portales' 
  | 'impuestos' 
  | 'reforma_pago' 
  | 'otro';

export type RecurrenceType = 'Unica vez' | 'Mensual' | 'Bimestral' | 'Trimestral' | 'Anual';

export interface ScheduledPayment {
  id: string;
  title: string;
  type: ScheduledType;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  recurrence: RecurrenceType;
  status: 'Pendiente' | 'Pagado' | 'Vencido' | 'Abonado';
  beneficiaryOrPayer: string;
  propertyCode?: string;
  reminderDaysBefore: number;
  category: Category;
  notes?: string;
  associatedMovementId?: string;
}

export interface BudgetCategory {
  id: string;
  category: Category;
  type: 'ingreso_meta' | 'gasto_presupuestado';
  monthlyBudget: number; // Monto presupuestado para el mes
  alertThresholdPercent: number; // e.g. 85%
  notes?: string;
}

export interface Partner {
  id: string;
  name: string;
  role: string; // e.g. 'Socio Director General', 'Socio Operaciones & Arriendos', 'Socio Inversionista'
  equityPercentage: number; // percentage (sum must equal 100%)
  totalContributed: number; // Capital aportado histórico
  totalWithdrawn: number; // Retiros de dividendos acumulados
  email: string;
  phone: string;
  avatarColor: string;
}

export interface PropertyManaged {
  id: string;
  code: string; // e.g. "MOAI-042"
  title: string;
  type: 'Apartamento' | 'Casa' | 'Oficina / Local' | 'Lote' | 'Finca';
  operation: 'Arriendo' | 'Venta' | 'Ambos';
  zone: string; // 'El Poblado', 'Laureles', 'Envigado', 'Sabaneta', 'Rionegro', 'Bello', etc.
  address: string;
  ownerName: string;
  ownerPhone: string;
  ownerBankInfo: string;
  tenantName?: string;
  tenantPhone?: string;
  rentalCanon?: number; // Canon mensual
  adminFeePercent: number; // Comisión de administración (e.g. 9.5%)
  salePrice?: number;
  insurancePolicy?: string; // e.g. "Seguros Sura - Póliza #984321"
  policyExpiration?: string;
  status: 'Activo' | 'En Trámite' | 'Finalizado';
}

export type ViewTab = 
  | 'dashboard' 
  | 'movements' 
  | 'scheduled' 
  | 'budgets' 
  | 'partners' 
  | 'properties' 
  | 'reports';
