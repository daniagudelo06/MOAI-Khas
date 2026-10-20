import { Movement, ScheduledPayment, BudgetCategory, Partner, PropertyManaged } from '../types';

/**
 * Format currency to Colombian Pesos (COP)
 */
export function formatCOP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format compact COP (e.g. $ 27.5M COP)
 */
export function formatCompactCOP(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `$ ${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `$ ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `$ ${(amount / 1_000).toFixed(0)}k`;
  }
  return formatCOP(amount);
}

/**
 * Format date for Colombia (e.g. "20 Oct 2026")
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return dateStr;
}

/**
 * Summary calculations
 */
export function calculateFinancialSummary(movements: Movement[]) {
  const completedMovements = movements.filter((m) => m.status === 'Completado');

  const totalIncome = completedMovements
    .filter((m) => m.type === 'ingreso')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalExpense = completedMovements
    .filter((m) => m.type === 'egreso')
    .reduce((sum, m) => sum + m.amount, 0);

  const netCashFlow = totalIncome - totalExpense;

  // Breakdown of pure MOAI operational revenue (excluding pass-through full rent collections)
  // MOAI Net Agency Revenues = Sales commissions + Admin fees + Moving + Renovation margin + Appraisals + Advisory
  const agencyNetRevenue = completedMovements
    .filter(
      (m) =>
        m.type === 'ingreso' &&
        m.category !== 'Aporte de Capital de Socios' &&
        m.category !== 'Canon de Arrendamiento Recaudado' // Full rent is pass-through
    )
    .reduce((sum, m) => sum + m.amount, 0) +
    completedMovements
      .filter((m) => m.category === 'Comisión Administración Arriendo')
      .reduce((sum, m) => sum + m.amount, 0);

  // Partner withdrawals
  const totalPartnerWithdrawals = completedMovements
    .filter((m) => m.category === 'Retiro de Utilidades / Dividendos Socios')
    .reduce((sum, m) => sum + m.amount, 0);

  // Distributable profit (Operative surplus before dividends)
  const operativeExpensesWithoutDividends = completedMovements
    .filter(
      (m) =>
        m.type === 'egreso' &&
        m.category !== 'Retiro de Utilidades / Dividendos Socios' &&
        m.category !== 'Dispersión / Pago a Propietarios (Cánones)'
    )
    .reduce((sum, m) => sum + m.amount, 0);

  const netOperativeSurplus = agencyNetRevenue - operativeExpensesWithoutDividends;

  return {
    totalIncome,
    totalExpense,
    netCashFlow,
    agencyNetRevenue,
    totalPartnerWithdrawals,
    netOperativeSurplus,
    movementsCount: completedMovements.length,
  };
}

/**
 * Check if scheduled payment is overdue or upcoming
 */
export function getScheduledStatus(dueDate: string, currentStatus: string): {
  label: string;
  badgeClass: string;
  isUrgent: boolean;
} {
  if (currentStatus === 'Pagado') {
    return {
      label: 'Pagado',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      isUrgent: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = dueDate.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Vencido hace ${Math.abs(diffDays)}d`,
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse',
      isUrgent: true,
    };
  } else if (diffDays === 0) {
    return {
      label: '¡Vence Hoy!',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-semibold',
      isUrgent: true,
    };
  } else if (diffDays <= 3) {
    return {
      label: `Vence en ${diffDays} días`,
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      isUrgent: true,
    };
  } else if (diffDays <= 7) {
    return {
      label: `En ${diffDays} días`,
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      isUrgent: false,
    };
  } else {
    return {
      label: `Para ${formatDate(dueDate)}`,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      isUrgent: false,
    };
  }
}

/**
 * Export data to CSV string
 */
export function exportMovementsToCSV(movements: Movement[]): string {
  const headers = [
    'ID',
    'Fecha',
    'Tipo',
    'Categoría Inmobiliaria',
    'Monto (COP)',
    'Descripción',
    'Tercero',
    'Código Inmueble',
    'Método Pago',
    'Estado',
    'Nro Comprobante',
    'Notas',
  ];

  const rows = movements.map((m) => [
    m.id,
    m.date,
    m.type,
    `"${m.category}"`,
    m.amount,
    `"${m.description.replace(/"/g, '""')}"`,
    `"${m.thirdParty.replace(/"/g, '""')}"`,
    m.propertyCode || '',
    `"${m.paymentMethod}"`,
    m.status,
    m.voucherNumber || '',
    `"${(m.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Download file trigger
 */
export function triggerFileDownload(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

