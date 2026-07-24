'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { FadeIn } from '@/components/motion';
import { Badge } from '@/components/ui/badge';
import {
  apiAdminPlans,
  apiAdminUpdateBillingSettings,
  apiAdminUpdatePlan,
  apiBillingPlans,
  type Plan,
  type PlanInput,
} from '@/lib/api';
import { formatCurrency, formatPeriod } from '@/lib/billing-format';
import { getAccessToken } from '@/lib/auth-storage';

type PlanFormValues = {
  priceAmount: string;
  currency: string;
  discountPct: string;
  highlightLabel: string;
  promoText: string;
  sortOrder: string;
  benefits: string;
  active: boolean;
};

function planToFormValues(plan: Plan): PlanFormValues {
  return {
    priceAmount: String(plan.priceAmount),
    currency: plan.currency,
    discountPct: plan.discountPct != null ? String(plan.discountPct) : '',
    highlightLabel: plan.highlightLabel ?? '',
    promoText: plan.promoText ?? '',
    sortOrder: String(plan.sortOrder),
    benefits: plan.benefits.join('\n'),
    active: plan.active,
  };
}

function formValuesToInput(values: PlanFormValues): PlanInput {
  return {
    priceAmount: Number(values.priceAmount),
    currency: values.currency || 'CLP',
    discountPct: values.discountPct ? Number(values.discountPct) : null,
    highlightLabel: values.highlightLabel || null,
    promoText: values.promoText || null,
    sortOrder: Number(values.sortOrder),
    benefits: values.benefits
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean),
    active: values.active,
  };
}

export default function AdminPlanesPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [trialDaysInput, setTrialDaysInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingTrial, setSavingTrial] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    Promise.all([apiAdminPlans(token), apiBillingPlans()])
      .then(([adminPlans, publicPlans]) => {
        setPlans(adminPlans);
        setTrialDays(publicPlans.trialDays);
        setTrialDaysInput(String(publicPlans.trialDays));
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveTrialDays(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    const days = Number(trialDaysInput);
    if (!token || !Number.isFinite(days) || days < 0) return;
    setSavingTrial(true);
    setError('');
    try {
      const res = await apiAdminUpdateBillingSettings(token, days);
      setTrialDays(res.trialDays);
      setTrialDaysInput(String(res.trialDays));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el período de prueba');
    } finally {
      setSavingTrial(false);
    }
  }

  async function handleSavePlan(id: string, values: PlanFormValues) {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const updated = await apiAdminUpdatePlan(token, id, formValuesToInput(values));
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el plan');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(plan: Plan) {
    const token = getAccessToken();
    if (!token) return;
    setError('');
    try {
      const updated = await apiAdminUpdatePlan(token, plan.id, { active: !plan.active });
      setPlans((prev) => prev.map((p) => (p.id === plan.id ? updated : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el plan');
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="auth-spinner" aria-hidden />
        <p>Cargando planes…</p>
      </div>
    );
  }

  return (
    <FadeIn>
      <AdminPageHeader
        title="Planes"
        description="Precios, descuentos y beneficios de cada plan de suscripción."
      />

      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

      <section className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Período de prueba global</h2>
            <p className="admin-card__subtitle">
              Días de prueba gratuita para nuevos registros
              {trialDays != null ? ` · actual: ${trialDays} días` : ''}
            </p>
          </div>
        </div>
        <form
          className="admin-plan-form"
          onSubmit={handleSaveTrialDays}
          style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}
        >
          <div className="admin-field" style={{ maxWidth: '10rem' }}>
            <label className="admin-field__label" htmlFor="trial-days">
              Días de prueba
            </label>
            <input
              id="trial-days"
              type="number"
              min={0}
              value={trialDaysInput}
              onChange={(e) => setTrialDaysInput(e.target.value)}
            />
          </div>
          <button type="submit" className="admin-btn" disabled={savingTrial}>
            {savingTrial ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      </section>

      <section className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">{plans.length} planes</h2>
            <p className="admin-card__subtitle">Activos e inactivos, ordenados por posición</p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--wide admin-table--plans">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Precio</th>
                <th>Descuento</th>
                <th>Estado</th>
                <th>Orden</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  editing={editingId === plan.id}
                  saving={saving}
                  onEdit={() => setEditingId(plan.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onToggleActive={() => handleToggleActive(plan)}
                  onSave={(values) => handleSavePlan(plan.id, values)}
                />
              ))}
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table__empty">
                    Sin planes configurados
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </FadeIn>
  );
}

function PlanRow({
  plan,
  editing,
  saving,
  onEdit,
  onCancelEdit,
  onToggleActive,
  onSave,
}: {
  plan: Plan;
  editing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onToggleActive: () => void;
  onSave: (values: PlanFormValues) => void;
}) {
  return (
    <>
      <tr>
        <td className="admin-table__primary">
          <span className="admin-table__name">{plan.name}</span>
          <span className="admin-table__meta">{formatPeriod(plan.periodMonths)}</span>
        </td>
        <td>{formatCurrency(plan.priceAmount, plan.currency)}</td>
        <td className="admin-table__muted">{plan.discountPct != null ? `${plan.discountPct}%` : '—'}</td>
        <td>
          <button type="button" className="admin-badge-toggle" onClick={onToggleActive}>
            <Badge variant={plan.active ? 'success' : 'muted'}>{plan.active ? 'Activo' : 'Inactivo'}</Badge>
          </button>
        </td>
        <td className="admin-table__muted">{plan.sortOrder}</td>
        <td>
          <button type="button" className="admin-btn" onClick={editing ? onCancelEdit : onEdit}>
            {editing ? 'Cerrar' : 'Editar'}
          </button>
        </td>
      </tr>
      {editing ? (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <PlanForm initial={planToFormValues(plan)} saving={saving} onCancel={onCancelEdit} onSave={onSave} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function PlanForm({
  initial,
  saving,
  onCancel,
  onSave,
}: {
  initial: PlanFormValues;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: PlanFormValues) => void;
}) {
  const [values, setValues] = useState(initial);

  function set<K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="admin-plan-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(values);
      }}
    >
      <div className="admin-field-grid">
        <div className="admin-field">
          <label className="admin-field__label" htmlFor="plan-price">
            Precio
          </label>
          <input
            id="plan-price"
            type="number"
            min={0}
            value={values.priceAmount}
            onChange={(e) => set('priceAmount', e.target.value)}
            required
          />
        </div>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor="plan-currency">
            Moneda
          </label>
          <input
            id="plan-currency"
            value={values.currency}
            onChange={(e) => set('currency', e.target.value.toUpperCase())}
            maxLength={8}
          />
        </div>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor="plan-discount">
            Descuento (%)
          </label>
          <input
            id="plan-discount"
            type="number"
            min={0}
            max={100}
            value={values.discountPct}
            onChange={(e) => set('discountPct', e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor="plan-highlight">
            Etiqueta destacada
          </label>
          <input
            id="plan-highlight"
            value={values.highlightLabel}
            onChange={(e) => set('highlightLabel', e.target.value)}
            maxLength={40}
            placeholder="Más elegido"
          />
        </div>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor="plan-promo">
            Texto promocional
          </label>
          <input
            id="plan-promo"
            value={values.promoText}
            onChange={(e) => set('promoText', e.target.value)}
            maxLength={80}
            placeholder="Ahorra 22% vs. mensual"
          />
        </div>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor="plan-sort">
            Orden
          </label>
          <input id="plan-sort" type="number" value={values.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
        </div>
      </div>

      <div className="admin-field" style={{ marginTop: '1rem' }}>
        <label className="admin-field__label" htmlFor="plan-benefits">
          Beneficios (uno por línea)
        </label>
        <textarea id="plan-benefits" value={values.benefits} onChange={(e) => set('benefits', e.target.value)} />
      </div>

      <label className="admin-checkbox-row" style={{ marginTop: '1rem' }}>
        <input type="checkbox" checked={values.active} onChange={(e) => set('active', e.target.checked)} />
        Plan activo (visible en /precios)
      </label>

      <div className="admin-plan-form__actions">
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" className="admin-btn" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
