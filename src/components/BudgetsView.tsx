import React, { useState } from 'react';
import { BudgetCategory, Movement, Category } from '../types';
import { formatCOP, formatCompactCOP } from '../utils/financial';
import { 
  PieChart, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Target,
  Sparkles,
  Edit2
} from 'lucide-react';

interface BudgetsViewProps {
  budgets: BudgetCategory[];
  movements: Movement[];
  onUpdateBudget: (id: string, newAmount: number) => void;
  onAddBudget: (newBudget: Omit<BudgetCategory, 'id'>) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  movements,
  onUpdateBudget,
  onAddBudget,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'all' | 'ingreso_meta' | 'gasto_presupuestado'>('all');

  // Compute actual spent/collected per category from completed movements
  const actualByCategory = movements
    .filter((m) => m.status === 'Completado')
    .reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + m.amount;
      return acc;
    }, {} as Record<string, number>);

  // Split into Income Targets vs Expense Budgets
  const incomeTargets = budgets.filter((b) => b.type === 'ingreso_meta');
  const expenseBudgets = budgets.filter((b) => b.type === 'gasto_presupuestado');

  const totalIncomeTarget = incomeTargets.reduce((sum, b) => sum + b.monthlyBudget, 0);
  const totalIncomeActual = incomeTargets.reduce((sum, b) => sum + (actualByCategory[b.category] || 0), 0);
  const incomeExecutionPercent = totalIncomeTarget > 0 ? Math.round((totalIncomeActual / totalIncomeTarget) * 100) : 0;

  const totalExpenseBudget = expenseBudgets.reduce((sum, b) => sum + b.monthlyBudget, 0);
  const totalExpenseActual = expenseBudgets.reduce((sum, b) => sum + (actualByCategory[b.category] || 0), 0);
  const expenseExecutionPercent = totalExpenseBudget > 0 ? Math.round((totalExpenseActual / totalExpenseBudget) * 100) : 0;

  const handleStartEdit = (b: BudgetCategory) => {
    setEditingId(b.id);
    setEditAmount(b.monthlyBudget);
  };

  const handleSaveEdit = (id: string) => {
    if (editAmount > 0) {
      onUpdateBudget(id, editAmount);
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#383B3D] tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-[#e10b17]" />
            <span>Control Presupuestal & Metas Comerciales</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Seguimiento de metas de ingresos por comisiones inmobiliarias y topes de gasto operativo mensual para MOAI.
          </p>
        </div>
      </div>

      {/* Top 2 Cards: Metas vs Presupuesto Global */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Metas de Ingreso */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Meta de Ingresos Mensuales MOAI</h2>
                <span className="text-[11px] text-slate-400">Ventas, administración, reformas y mudanzas</span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {incomeExecutionPercent}% alcanzado
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-extrabold text-slate-900">{formatCOP(totalIncomeActual)}</div>
            <div className="text-xs text-slate-500">de {formatCOP(totalIncomeTarget)} proyectado</div>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                incomeExecutionPercent >= 100
                  ? 'bg-emerald-500'
                  : incomeExecutionPercent >= 70
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, incomeExecutionPercent)}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>Brecha para la meta:</span>
            <span className="font-semibold text-slate-800">
              {totalIncomeActual >= totalIncomeTarget
                ? '¡Meta mensual superada con éxito!'
                : `Faltan ${formatCOP(totalIncomeTarget - totalIncomeActual)}`}
            </span>
          </div>
        </div>

        {/* Card 2: Presupuestos de Gasto */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-50 text-[#e10b17] rounded-lg">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Presupuesto de Gastos Operativos</h2>
                <span className="text-[11px] text-slate-400">Portales, nómina, asesores, sede y software</span>
              </div>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                expenseExecutionPercent > 95
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : expenseExecutionPercent > 80
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {expenseExecutionPercent}% consumido
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-2">
            <div className="text-2xl font-extrabold text-slate-900">{formatCOP(totalExpenseActual)}</div>
            <div className="text-xs text-slate-500">de {formatCOP(totalExpenseBudget)} límite</div>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                expenseExecutionPercent > 95
                  ? 'bg-rose-600'
                  : expenseExecutionPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, expenseExecutionPercent)}%` }}
            />
          </div>

          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>Margen presupuestal restante:</span>
            <span className="font-semibold text-slate-800">
              {totalExpenseBudget >= totalExpenseActual
                ? `Disponible: ${formatCOP(totalExpenseBudget - totalExpenseActual)}`
                : `Excedido en: ${formatCOP(totalExpenseActual - totalExpenseBudget)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg text-xs font-medium w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            activeTab === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600'
          }`}
        >
          Todos los Rubros ({budgets.length})
        </button>
        <button
          onClick={() => setActiveTab('ingreso_meta')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            activeTab === 'ingreso_meta' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-600'
          }`}
        >
          Metas de Ingreso ({incomeTargets.length})
        </button>
        <button
          onClick={() => setActiveTab('gasto_presupuestado')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            activeTab === 'gasto_presupuestado' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-slate-600'
          }`}
        >
          Topes de Gasto ({expenseBudgets.length})
        </button>
      </div>

      {/* Budget Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets
          .filter((b) => activeTab === 'all' || b.type === activeTab)
          .map((b) => {
            const isIncome = b.type === 'ingreso_meta';
            const actual = actualByCategory[b.category] || 0;
            const percent = b.monthlyBudget > 0 ? Math.round((actual / b.monthlyBudget) * 100) : 0;
            const isEditing = editingId === b.id;

            return (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isIncome ? 'bg-emerald-500' : 'bg-[#e10b17]'
                        }`}
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {isIncome ? 'Meta de Ingreso' : 'Presupuesto de Gasto'}
                      </span>
                    </div>

                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(b)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
                        title="Modificar monto presupuestal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-[#383B3D] mb-1 leading-snug">{b.category}</h3>
                  {b.notes && <p className="text-[11px] text-slate-400 mb-3">{b.notes}</p>}

                  {/* Amounts */}
                  {isEditing ? (
                    <div className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(Number(e.target.value))}
                        className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded"
                      />
                      <button
                        onClick={() => handleSaveEdit(b.id)}
                        className="px-2 py-1 text-xs bg-emerald-600 text-white rounded font-bold"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-between mb-2 mt-2">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Real Ejecutado</div>
                        <div className={`text-base font-extrabold ${isIncome ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {formatCOP(actual)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Presupuestado</div>
                        <div className="text-xs font-bold text-slate-600">{formatCOP(b.monthlyBudget)}</div>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isIncome
                          ? percent >= 100
                            ? 'bg-emerald-500'
                            : percent >= 70
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                          : percent > 100
                          ? 'bg-rose-600'
                          : percent > 85
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Status */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 mt-2">
                  <span className="font-bold text-slate-700">{percent}% de ejecución</span>
                  {isIncome ? (
                    <span className={percent >= 100 ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                      {percent >= 100 ? '¡Alcanzada!' : `Resta ${formatCompactCOP(Math.max(0, b.monthlyBudget - actual))}`}
                    </span>
                  ) : (
                    <span className={percent > 100 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                      {percent > 100 ? '¡Excedido!' : `Margen: ${formatCompactCOP(Math.max(0, b.monthlyBudget - actual))}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
