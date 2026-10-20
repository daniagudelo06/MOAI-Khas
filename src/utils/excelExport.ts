import * as XLSX from 'xlsx';
import { Movement, ScheduledPayment, BudgetCategory, Partner, PropertyManaged } from '../types';
import { calculateFinancialSummary } from './financial';

/**
 * Generates and downloads a complete multi-sheet Excel (.xlsx) accounting report
 */
export function exportCompleteAccountingToExcel(
  movements: Movement[],
  scheduledPayments: ScheduledPayment[],
  budgets: BudgetCategory[],
  partners: Partner[],
  properties: PropertyManaged[]
) {
  const summary = calculateFinancialSummary(movements);
  const reportDate = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const wb = XLSX.utils.book_new();

  // ----------------------------------------------------
  // HOJA 1: RESUMEN EJECUTIVO & P&L
  // ----------------------------------------------------
  const summaryRows = [
    ['INMOBILIARIA MOAI SAS - REPORTE CONTABLE Y FINANCIERO'],
    ['Sistema de Gestión MOAI-Kash'],
    ['Fecha de Generación:', reportDate],
    ['Sitio Web:', 'https://www.inmobiliariamoai.com/'],
    ['Repositorio:', 'https://github.com/daniagudelo06/MOAI-Kash'],
    [],
    ['INDICADORES PRINCIPALES (COP)', 'VALOR'],
    ['Total Ingresos Registrados', summary.totalIncome],
    ['Total Egresos Registrados', summary.totalExpense],
    ['Saldo Disponible en Caja / Bancos', summary.netCashFlow],
    ['Ingresos Operacionales Netos MOAI (Comisiones + Servicios)', summary.agencyNetRevenue],
    ['Superávit Operativo Distribuible (Utilidad Neta)', summary.netOperativeSurplus],
    ['Total Dividendos Retirados por Socios', summary.totalPartnerWithdrawals],
    ['Total Movimientos Asentados', summary.movementsCount],
    [],
    ['PARTICIPACIÓN DE SOCIOS', '% EQUITY', 'CAPITAL APORTADO', 'RETIROS HISTÓRICOS', 'UTILIDAD ESTIMADA'],
    ...partners.map((p) => [
      p.name,
      `${p.equityPercentage}%`,
      p.totalContributed,
      p.totalWithdrawn,
      Math.max(0, Math.round((summary.netOperativeSurplus * p.equityPercentage) / 100)),
    ]),
    [],
    ['ESTADO DE LA CARTERA INMOBILIARIA', 'CANTIDAD'],
    ['Inmuebles Registrados en Base de Datos', properties.length],
    ['Fechas / Vencimientos Programados Pendientes', scheduledPayments.filter((s) => s.status === 'Pendiente').length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Ejecutivo');

  // ----------------------------------------------------
  // HOJA 2: LIBRO DIARIO DE MOVIMIENTOS
  // ----------------------------------------------------
  const movementHeaders = [
    'ID',
    'Fecha',
    'Comprobante / Recibo',
    'Tipo',
    'Categoría Inmobiliaria',
    'Código Inmueble',
    'Tercero / Cliente',
    'Descripción / Concepto',
    'Forma de Pago',
    'Monto (COP)',
    'Estado',
    'Socio Asignado',
    'Notas',
  ];

  const partnerMap = new Map(partners.map((p) => [p.id, p.name]));

  const movementRows = movements.map((m) => [
    m.id,
    m.date,
    m.voucherNumber || 'S/N',
    m.type === 'ingreso' ? 'Ingreso' : 'Egreso',
    m.category,
    m.propertyCode || 'Corporativo',
    m.thirdParty,
    m.description,
    m.paymentMethod,
    m.amount,
    m.status,
    m.partnerId ? partnerMap.get(m.partnerId) || m.partnerId : 'Sin asignar',
    m.notes || '',
  ]);

  const wsMovements = XLSX.utils.aoa_to_sheet([movementHeaders, ...movementRows]);
  wsMovements['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 16 },
    { wch: 10 },
    { wch: 32 },
    { wch: 16 },
    { wch: 28 },
    { wch: 40 },
    { wch: 24 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMovements, 'Libro_Movimientos');

  // ----------------------------------------------------
  // HOJA 3: PROGRAMACIÓN DE FECHAS Y VENCIMIENTOS
  // ----------------------------------------------------
  const scheduledHeaders = [
    'ID',
    'Título del Vencimiento',
    'Tipo de Evento',
    'Fecha Límite',
    'Monto Estimado (COP)',
    'Periodicidad',
    'Beneficiario / Pagador',
    'Inmueble Asociado',
    'Categoría Asociada',
    'Estado',
    'Notas',
  ];

  const scheduledRows = scheduledPayments.map((s) => [
    s.id,
    s.title,
    s.type,
    s.dueDate,
    s.amount,
    s.recurrence,
    s.beneficiaryOrPayer,
    s.propertyCode || 'Gasto General',
    s.category,
    s.status,
    s.notes || '',
  ]);

  const wsScheduled = XLSX.utils.aoa_to_sheet([scheduledHeaders, ...scheduledRows]);
  wsScheduled['!cols'] = [
    { wch: 12 },
    { wch: 35 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 28 },
    { wch: 16 },
    { wch: 30 },
    { wch: 12 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsScheduled, 'Fechas_Programadas');

  // ----------------------------------------------------
  // HOJA 4: CONTROL PRESUPUESTAL Y METAS
  // ----------------------------------------------------
  const actualByCategory = movements
    .filter((m) => m.status === 'Completado')
    .reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + m.amount;
      return acc;
    }, {} as Record<string, number>);

  const budgetHeaders = [
    'Categoría / Rubro',
    'Tipo',
    'Presupuesto / Meta Mensual (COP)',
    'Real Ejecutado (COP)',
    'Variación / Diferencia (COP)',
    '% Cumplimiento',
    'Notas',
  ];

  const budgetRows = budgets.map((b) => {
    const actual = actualByCategory[b.category] || 0;
    const diff = b.type === 'ingreso_meta' ? actual - b.monthlyBudget : b.monthlyBudget - actual;
    const pct = b.monthlyBudget > 0 ? `${Math.round((actual / b.monthlyBudget) * 100)}%` : '0%';
    return [
      b.category,
      b.type === 'ingreso_meta' ? 'Meta de Ingreso' : 'Presupuesto de Gasto',
      b.monthlyBudget,
      actual,
      diff,
      pct,
      b.notes || '',
    ];
  });

  const wsBudgets = XLSX.utils.aoa_to_sheet([budgetHeaders, ...budgetRows]);
  wsBudgets['!cols'] = [
    { wch: 35 },
    { wch: 22 },
    { wch: 24 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsBudgets, 'Presupuestos_y_Metas');

  // ----------------------------------------------------
  // HOJA 5: CARTERA DE INMUEBLES
  // ----------------------------------------------------
  const propertyHeaders = [
    'Código MOAI',
    'Título de la Propiedad',
    'Tipo',
    'Operación',
    'Zona / Sector',
    'Dirección',
    'Propietario',
    'Teléfono Propietario',
    'Cuenta Bancaria Dispersión',
    'Inquilino Actual',
    'Teléfono Inquilino',
    'Canon Mensual (COP)',
    '% Admin MOAI',
    'Precio Venta (COP)',
    'Póliza de Afianzamiento',
    'Estado',
  ];

  const propertyRows = properties.map((p) => [
    p.code,
    p.title,
    p.type,
    p.operation,
    p.zone,
    p.address,
    p.ownerName,
    p.ownerPhone,
    p.ownerBankInfo,
    p.tenantName || 'N/A',
    p.tenantPhone || 'N/A',
    p.rentalCanon || 0,
    `${p.adminFeePercent}%`,
    p.salePrice || 0,
    p.insurancePolicy || '',
    p.status,
  ]);

  const wsProperties = XLSX.utils.aoa_to_sheet([propertyHeaders, ...propertyRows]);
  wsProperties['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 28 },
    { wch: 24 },
    { wch: 18 },
    { wch: 28 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 24 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsProperties, 'Cartera_Inmuebles');

  // Generate file and trigger browser download
  const fileName = `MOAI-Kash_Informe_Contable_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports just the movements table to Excel (.xlsx)
 */
export function exportMovementsOnlyToExcel(movements: Movement[]) {
  const wb = XLSX.utils.book_new();
  const headers = [
    'Fecha',
    'Comprobante',
    'Tipo',
    'Categoría',
    'Inmueble',
    'Tercero',
    'Descripción',
    'Método de Pago',
    'Monto (COP)',
    'Estado',
    'Notas',
  ];

  const rows = movements.map((m) => [
    m.date,
    m.voucherNumber || 'S/N',
    m.type === 'ingreso' ? 'Ingreso' : 'Egreso',
    m.category,
    m.propertyCode || 'Corporativo',
    m.thirdParty,
    m.description,
    m.paymentMethod,
    m.amount,
    m.status,
    m.notes || '',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 30 },
    { wch: 14 },
    { wch: 25 },
    { wch: 35 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  XLSX.writeFile(wb, `MOAI-Kash_Movimientos_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Exports individual property statement to Excel (.xlsx)
 */
export function exportPropertyStatementToExcel(property: PropertyManaged, movements: Movement[]) {
  const wb = XLSX.utils.book_new();
  const propMovements = movements.filter((m) => m.propertyCode === property.code);

  const canon = property.rentalCanon || 0;
  const adminPct = property.adminFeePercent || 0;
  const comisionMOAI = Math.round((canon * adminPct) / 100);
  const netoGirar = canon - comisionMOAI;

  const rows = [
    ['INMOBILIARIA MOAI SAS - EXTRACTO MENSUAL DE ARRENDAMIENTO'],
    ['Inmueble:', `${property.code} - ${property.title}`],
    ['Dirección:', property.address],
    ['Propietario:', property.ownerName],
    ['Cuenta de Abono:', property.ownerBankInfo],
    ['Inquilino:', property.tenantName || 'N/A'],
    ['Póliza Afianzamiento:', property.insurancePolicy || 'N/A'],
    ['Fecha de Emisión:', new Date().toISOString().slice(0, 10)],
    [],
    ['LIQUIDACIÓN DEL CANON', 'MONTO (COP)'],
    ['Canon Mensual Recaudado', canon],
    [`(-) Comisión Administración MOAI (${adminPct}%)`, -comisionMOAI],
    ['(=) NETO A DISPERSAR AL PROPIETARIO', netoGirar],
    [],
    ['HISTORIAL DE MOVIMIENTOS ASOCIADOS'],
    ['Fecha', 'Comprobante', 'Tipo', 'Concepto', 'Monto (COP)', 'Estado'],
    ...propMovements.map((m) => [
      m.date,
      m.voucherNumber || '',
      m.type,
      m.description,
      m.amount,
      m.status,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws, `Extracto_${property.code}`);
  XLSX.writeFile(wb, `MOAI_Extracto_${property.code}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
