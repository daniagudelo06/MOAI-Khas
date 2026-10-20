import React, { useState, useEffect } from 'react';
import { ViewTab, Movement, ScheduledPayment, BudgetCategory, Partner, PropertyManaged } from './types';
import { 
  INITIAL_MOVEMENTS, 
  INITIAL_SCHEDULED_PAYMENTS, 
  INITIAL_BUDGETS, 
  INITIAL_PARTNERS, 
  INITIAL_PROPERTIES 
} from './data/initialData';
import { getScheduledStatus } from './utils/financial';
import { exportCompleteAccountingToExcel } from './utils/excelExport';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MovementsView } from './components/MovementsView';
import { ScheduledView } from './components/ScheduledView';
import { BudgetsView } from './components/BudgetsView';
import { PartnersView } from './components/PartnersView';
import { PropertiesView } from './components/PropertiesView';
import { ReportsView } from './components/ReportsView';
import { MovementModal } from './components/MovementModal';
import { FileSpreadsheet, RotateCcw } from 'lucide-react';

const STORAGE_VERSION_KEY = 'moai_kash_version_clean_v2';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');

  // Core Financial State initialized with clean $0 amounts so owner builds the database
  const [movements, setMovements] = useState<Movement[]>(() => {
    try {
      const isCleanVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      if (!isCleanVersion) {
        localStorage.setItem(STORAGE_VERSION_KEY, 'true');
        return INITIAL_MOVEMENTS;
      }
      const saved = localStorage.getItem('moai_kash_movements');
      return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
    } catch {
      return INITIAL_MOVEMENTS;
    }
  });

  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>(() => {
    try {
      const isCleanVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      if (!isCleanVersion) return INITIAL_SCHEDULED_PAYMENTS;
      const saved = localStorage.getItem('moai_kash_scheduled');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULED_PAYMENTS;
    } catch {
      return INITIAL_SCHEDULED_PAYMENTS;
    }
  });

  const [budgets, setBudgets] = useState<BudgetCategory[]>(() => {
    try {
      const isCleanVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      if (!isCleanVersion) return INITIAL_BUDGETS;
      const saved = localStorage.getItem('moai_kash_budgets');
      return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  });

  const [partners, setPartners] = useState<Partner[]>(() => {
    try {
      const isCleanVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      if (!isCleanVersion) return INITIAL_PARTNERS;
      const saved = localStorage.getItem('moai_kash_partners');
      return saved ? JSON.parse(saved) : INITIAL_PARTNERS;
    } catch {
      return INITIAL_PARTNERS;
    }
  });

  const [properties, setProperties] = useState<PropertyManaged[]>(() => {
    try {
      const isCleanVersion = localStorage.getItem(STORAGE_VERSION_KEY);
      if (!isCleanVersion) return INITIAL_PROPERTIES;
      const saved = localStorage.getItem('moai_kash_properties');
      return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
    } catch {
      return INITIAL_PROPERTIES;
    }
  });

  // Modals state
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);

  // Sync to LocalStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('moai_kash_movements', JSON.stringify(movements));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [movements]);

  useEffect(() => {
    try {
      localStorage.setItem('moai_kash_scheduled', JSON.stringify(scheduledPayments));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [scheduledPayments]);

  useEffect(() => {
    try {
      localStorage.setItem('moai_kash_budgets', JSON.stringify(budgets));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem('moai_kash_partners', JSON.stringify(partners));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [partners]);

  useEffect(() => {
    try {
      localStorage.setItem('moai_kash_properties', JSON.stringify(properties));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [properties]);

  // Urgent scheduled count for Navbar alert badge
  const urgentScheduledCount = scheduledPayments.filter(
    (s) => s.status === 'Pendiente' && getScheduledStatus(s.dueDate, s.status).isUrgent
  ).length;

  // Add / Edit Movement Handler
  const handleSaveMovement = (movementData: Omit<Movement, 'id' | 'createdAt'>, id?: string) => {
    if (id) {
      setMovements((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, ...movementData, updatedAt: new Date().toISOString() }
            : m
        )
      );
    } else {
      const newMovement: Movement = {
        ...movementData,
        id: `mov-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setMovements((prev) => [newMovement, ...prev]);
    }
  };

  // Delete Movement
  const handleDeleteMovement = (id: string) => {
    if (window.confirm('¿Deseas eliminar este registro contable?')) {
      setMovements((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Duplicate Movement
  const handleDuplicateMovement = (m: Movement) => {
    const duplicated: Movement = {
      ...m,
      id: `mov-${Date.now()}`,
      voucherNumber: `DUP-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().slice(0, 10),
    };
    setMovements((prev) => [duplicated, ...prev]);
  };

  // Quick Pay Scheduled Item -> Generates completed movement & updates schedule
  const handleQuickPayScheduled = (item: ScheduledPayment) => {
    const newMovement: Movement = {
      id: `mov-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      type: item.type === 'cobro_canon' ? 'ingreso' : 'egreso',
      category: item.category,
      amount: item.amount,
      description: item.title,
      thirdParty: item.beneficiaryOrPayer,
      propertyCode: item.propertyCode,
      paymentMethod: 'Bancolombia Transferencia',
      status: 'Completado',
      voucherNumber: `PROG-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      notes: `Asentado desde fecha programada: ${item.notes || ''}`,
    };

    setMovements((prev) => [newMovement, ...prev]);

    setScheduledPayments((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, status: 'Pagado' } : s))
    );
  };

  // Add Scheduled Item
  const handleAddScheduled = (payment: Omit<ScheduledPayment, 'id'>) => {
    const newItem: ScheduledPayment = {
      ...payment,
      id: `sched-${Date.now()}`,
    };
    setScheduledPayments((prev) => [...prev, newItem]);
  };

  // Delete Scheduled Item
  const handleDeleteScheduled = (id: string) => {
    setScheduledPayments((prev) => prev.filter((s) => s.id !== id));
  };

  // Update Budget Amount
  const handleUpdateBudget = (id: string, newAmount: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, monthlyBudget: newAmount } : b))
    );
  };

  // Add Budget
  const handleAddBudget = (newBudget: Omit<BudgetCategory, 'id'>) => {
    const item: BudgetCategory = {
      ...newBudget,
      id: `b-${Date.now()}`,
    };
    setBudgets((prev) => [...prev, item]);
  };

  // Execute Partner Dividend Distribution
  const handleExecuteDistribution = (
    payouts: { partnerId: string; amount: number; name: string }[]
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const newMovements: Movement[] = payouts.map((p, index) => ({
      id: `mov-div-${Date.now()}-${index}`,
      date: today,
      type: 'egreso',
      category: 'Retiro de Utilidades / Dividendos Socios',
      amount: p.amount,
      description: `Dispersión de utilidades período - ${p.name}`,
      thirdParty: `${p.name} (Socio)`,
      paymentMethod: 'Bancolombia Transferencia',
      status: 'Completado',
      partnerId: p.partnerId,
      voucherNumber: `DIV-${Date.now().toString().slice(-4)}-${index + 1}`,
      createdAt: new Date().toISOString(),
      notes: 'Aprobado en junta de socios MOAI.',
    }));

    setMovements((prev) => [...newMovements, ...prev]);

    setPartners((prev) =>
      prev.map((partner) => {
        const payout = payouts.find((p) => p.partnerId === partner.id);
        if (payout) {
          return {
            ...partner,
            totalWithdrawn: partner.totalWithdrawn + payout.amount,
          };
        }
        return partner;
      })
    );
  };

  // Add Property
  const handleAddProperty = (prop: Omit<PropertyManaged, 'id'>) => {
    const newProp: PropertyManaged = {
      ...prop,
      id: `prop-${Date.now()}`,
    };
    setProperties((prev) => [newProp, ...prev]);
  };

  // Filter movements by property code
  const handleFilterMovementsByProperty = (_code: string) => {
    setCurrentTab('movements');
  };

  // Import Full Backup
  const handleImportBackup = (backupData: {
    movements: Movement[];
    partners: Partner[];
    properties: PropertyManaged[];
  }) => {
    if (backupData.movements) setMovements(backupData.movements);
    if (backupData.partners) setPartners(backupData.partners);
    if (backupData.properties) setProperties(backupData.properties);
  };

  // Export Complete Excel Workbook handler
  const handleExportCompleteExcel = () => {
    exportCompleteAccountingToExcel(
      movements,
      scheduledPayments,
      budgets,
      partners,
      properties
    );
  };

  // Reset to clean zeros
  const handleResetToZero = () => {
    if (window.confirm('¿Deseas reiniciar todos los montos a cero para empezar tu contabilidad limpia?')) {
      setMovements([]);
      setScheduledPayments([]);
      setBudgets(INITIAL_BUDGETS.map((b) => ({ ...b, monthlyBudget: 0 })));
      setPartners(INITIAL_PARTNERS.map((p) => ({ ...p, totalContributed: 0, totalWithdrawn: 0 })));
      setProperties(INITIAL_PROPERTIES.map((pr) => ({ ...pr, rentalCanon: 0, salePrice: 0 })));
      localStorage.setItem('moai_kash_movements', '[]');
      localStorage.setItem('moai_kash_scheduled', '[]');
      alert('Base de datos reiniciada a cero correctamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col selection:bg-[#e10b17] selection:text-white">
      {/* Navbar with brand identity and direct Excel button */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewMovement={() => {
          setEditingMovement(null);
          setIsMovementModalOpen(true);
        }}
        onExportExcel={handleExportCompleteExcel}
        urgentScheduledCount={urgentScheduledCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            movements={movements}
            scheduledPayments={scheduledPayments}
            budgets={budgets}
            partners={partners}
            properties={properties}
            onNavigate={setCurrentTab}
            onOpenNewMovement={() => {
              setEditingMovement(null);
              setIsMovementModalOpen(true);
            }}
            onQuickPayScheduled={handleQuickPayScheduled}
          />
        )}

        {currentTab === 'movements' && (
          <MovementsView
            movements={movements}
            properties={properties}
            partners={partners}
            onOpenNewMovement={() => {
              setEditingMovement(null);
              setIsMovementModalOpen(true);
            }}
            onEditMovement={(m) => {
              setEditingMovement(m);
              setIsMovementModalOpen(true);
            }}
            onDeleteMovement={handleDeleteMovement}
            onDuplicateMovement={handleDuplicateMovement}
          />
        )}

        {currentTab === 'scheduled' && (
          <ScheduledView
            scheduledPayments={scheduledPayments}
            properties={properties}
            onAddScheduled={handleAddScheduled}
            onQuickPay={handleQuickPayScheduled}
            onDeleteScheduled={handleDeleteScheduled}
          />
        )}

        {currentTab === 'budgets' && (
          <BudgetsView
            budgets={budgets}
            movements={movements}
            onUpdateBudget={handleUpdateBudget}
            onAddBudget={handleAddBudget}
          />
        )}

        {currentTab === 'partners' && (
          <PartnersView
            partners={partners}
            movements={movements}
            onExecuteDistribution={handleExecuteDistribution}
          />
        )}

        {currentTab === 'properties' && (
          <PropertiesView
            properties={properties}
            movements={movements}
            onAddProperty={handleAddProperty}
            onFilterMovementsByProperty={handleFilterMovementsByProperty}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            movements={movements}
            scheduledPayments={scheduledPayments}
            partners={partners}
            budgets={budgets}
            properties={properties}
            onImportBackup={handleImportBackup}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#383B3D]">MOAI Kash</span>
            <span>· Sistema Contable Inmobiliario</span>
            <span className="text-slate-300">|</span>
            <span>Medellín, Colombia</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] flex-wrap">
            <a
              href="https://www.inmobiliariamoai.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#e10b17] transition-colors"
            >
              inmobiliariamoai.com
            </a>
            <span>•</span>
            <a
              href="https://github.com/daniagudelo06/MOAI-Kash"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-900 transition-colors font-mono"
            >
              GitHub: daniagudelo06/MOAI-Kash
            </a>
            <span>•</span>
            <button
              onClick={handleExportCompleteExcel}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Informe Excel (.xlsx)</span>
            </button>
            <span>•</span>
            <button
              onClick={handleResetToZero}
              className="text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
              title="Limpiar la base de datos y reiniciar valores en cero"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reiniciar a Cero</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Add / Edit Movement Modal */}
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setEditingMovement(null);
        }}
        onSave={handleSaveMovement}
        editingMovement={editingMovement}
        properties={properties}
        partners={partners}
      />
    </div>
  );
}
