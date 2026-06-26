'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    BadgeIndianRupee,
    BriefcaseBusiness,
    CalendarClock,
    FileSpreadsheet,
    Pencil,
    RefreshCcw,
    Save,
    Search,
    Trash2,
    Upload,
    Wallet,
} from 'lucide-react';
import {
    normalizeRecurringCsvRows,
    PAYMENT_METHODS,
    RECURRING_PAYMENT_CYCLES,
    RECURRING_PAYMENT_STATUSES,
    RECURRING_PAYMENT_TYPES,
} from '@/lib/finance';

const TYPE_LABELS = {
    salary: 'Salary',
    subscription: 'Subscription',
};

const STATUS_LABELS = {
    active: 'Active',
    paused: 'Paused',
    ended: 'Ended',
};

const CYCLE_LABELS = {
    monthly: 'Monthly',
    annual: 'Annual',
};

const PAYMENT_METHOD_LABELS = {
    bank_transfer: 'Bank Transfer',
    upi: 'UPI',
    credit_card: 'Credit Card',
    debit_card: 'Debit Card',
    cash: 'Cash',
    auto_debit: 'Auto Debit',
    cheque: 'Cheque',
    other: 'Other',
};

function todayValue() {
    return new Date().toISOString().slice(0, 10);
}

function createEmptyForm() {
    return {
        id: '',
        externalId: '',
        name: '',
        type: 'salary',
        cycle: 'monthly',
        amount: '',
        currency: 'INR',
        startDate: todayValue(),
        endDate: '',
        status: 'active',
        paymentMethod: 'bank_transfer',
        ownerName: '',
        department: '',
        employeeCode: '',
        employeeEmail: '',
        vendorName: '',
        notes: '',
        autoRenew: false,
        seatCount: '0',
        source: 'manual',
    };
}

function formatCurrency(value, currency = 'INR') {
    const numericValue = Number(value || 0);
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        maximumFractionDigits: 0,
    }).format(numericValue);
}

function MetricCard({ icon: Icon, label, value, helper }) {
    return (
        <article className="rounded-[24px] border border-[#111]/10 bg-white p-5 shadow-[0_12px_0_rgba(17,17,17,0.03),0_22px_48px_rgba(17,17,17,0.07)]">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">{label}</p>
                    <p className="mt-3 text-[1.85rem] font-bold leading-none tracking-tight text-[#111]">{value}</p>
                    <p className="mt-2 text-xs font-medium text-[#6b7280]">{helper}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#111]/10 bg-[#f8f8f8] text-[#111]">
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </article>
    );
}

function FinanceSelect({ value, options, onChange, className = '', disabled = false }) {
    return (
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            className={`h-11 rounded-2xl border border-[#111]/14 bg-white px-4 text-sm font-semibold text-[#111] outline-none shadow-[0_6px_0_rgba(17,17,17,0.03),0_12px_24px_rgba(17,17,17,0.05)] focus:border-[#111]/35 focus:ring-4 focus:ring-black/5 disabled:opacity-50 ${className}`}
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function PaymentBadge({ value, palette = 'default' }) {
    const tone = palette === 'dark'
        ? 'bg-[#111] text-white'
        : 'border border-[#111]/10 bg-[#fafafa] text-[#374151]';

    return (
        <span className={`inline-flex h-9 items-center rounded-2xl px-3 text-xs font-bold uppercase tracking-[0.08em] ${tone}`}>
            {value}
        </span>
    );
}

function formFromPayment(payment) {
    return {
        id: payment.id,
        externalId: payment.externalId || '',
        name: payment.name || '',
        type: payment.type || 'salary',
        cycle: payment.cycle || 'monthly',
        amount: String(payment.amount || ''),
        currency: payment.currency || 'INR',
        startDate: payment.startDate || todayValue(),
        endDate: payment.endDate || '',
        status: payment.status || 'active',
        paymentMethod: payment.paymentMethod || 'bank_transfer',
        ownerName: payment.ownerName || '',
        department: payment.department || '',
        employeeCode: payment.employeeCode || '',
        employeeEmail: payment.employeeEmail || '',
        vendorName: payment.vendorName || '',
        notes: payment.notes || '',
        autoRenew: Boolean(payment.autoRenew),
        seatCount: String(payment.seatCount || 0),
        source: payment.source || 'manual',
    };
}

export default function FinancePanel({ canWrite, isSuperAdmin, refreshToken = 0 }) {
    const [snapshot, setSnapshot] = useState({ payments: [], summary: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState('');
    const [message, setMessage] = useState('');
    const [query, setQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [form, setForm] = useState(createEmptyForm());
    const [csvText, setCsvText] = useState('');
    const [csvFileName, setCsvFileName] = useState('');
    const [csvMode, setCsvMode] = useState('upsert');
    const [csvPreviewCount, setCsvPreviewCount] = useState(0);

    async function loadFinance() {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/finance/recurring', { cache: 'no-store' });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Unable to load finance data.');
            }
            setSnapshot({
                payments: Array.isArray(payload.payments) ? payload.payments : [],
                summary: payload.summary || null,
            });
        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void loadFinance();
    }, [refreshToken]);

    const summary = snapshot.summary || {
        totalRecords: 0,
        activeCount: 0,
        salaryCount: 0,
        subscriptionCount: 0,
        monthlyRecurringBurn: 0,
        monthlyPayrollRunRate: 0,
        annualSubscriptionCommitment: 0,
        accruedLiability: 0,
        dueInNext30DaysCount: 0,
        dueInNext30DaysAmount: 0,
    };

    const filteredPayments = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return snapshot.payments.filter((payment) => {
            if (typeFilter !== 'all' && payment.type !== typeFilter) {
                return false;
            }
            if (statusFilter !== 'all' && payment.status !== statusFilter) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            return [
                payment.name,
                payment.type,
                payment.cycle,
                payment.ownerName,
                payment.department,
                payment.employeeCode,
                payment.employeeEmail,
                payment.vendorName,
                payment.notes,
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery);
        });
    }, [query, snapshot.payments, statusFilter, typeFilter]);

    function resetForm() {
        setForm(createEmptyForm());
    }

    function updateForm(key, value) {
        setForm((current) => {
            const next = { ...current, [key]: value };
            if (key === 'type') {
                if (value === 'salary') {
                    next.cycle = 'monthly';
                    next.autoRenew = false;
                    next.vendorName = '';
                } else if (value === 'subscription' && !current.id) {
                    next.autoRenew = true;
                }
            }
            return next;
        });
    }

    async function submitForm(event) {
        event.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const endpoint = form.id
                ? `/api/admin/finance/recurring/${form.id}`
                : '/api/admin/finance/recurring';
            const method = form.id ? 'PATCH' : 'POST';
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    seatCount: Number(form.seatCount || 0),
                    amount: Number(form.amount || 0),
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Unable to save recurring payment.');
            }

            setMessage(form.id ? 'Recurring payment updated.' : 'Recurring payment created.');
            resetForm();
            await loadFinance();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    }

    async function deletePayment(id) {
        const confirmed = window.confirm('Delete this recurring payment? This cannot be undone.');
        if (!confirmed) {
            return;
        }

        setDeletingId(id);
        setMessage('');

        try {
            const response = await fetch(`/api/admin/finance/recurring/${id}`, {
                method: 'DELETE',
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Unable to delete recurring payment.');
            }

            if (form.id === id) {
                resetForm();
            }
            setMessage('Recurring payment deleted.');
            await loadFinance();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setDeletingId('');
        }
    }

    async function handleCsvFile(event) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const nextText = await file.text();
            const previewRows = normalizeRecurringCsvRows(nextText);
            setCsvText(nextText);
            setCsvFileName(file.name);
            setCsvPreviewCount(previewRows.length);
            setMessage(`Loaded ${previewRows.length} CSV rows from ${file.name}.`);
        } catch (error) {
            setCsvText('');
            setCsvFileName('');
            setCsvPreviewCount(0);
            setMessage(error.message || 'Unable to read CSV file.');
        }
    }

    async function importCsv() {
        if (!csvText.trim()) {
            setMessage('Choose a CSV file before importing.');
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const response = await fetch('/api/admin/finance/recurring/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    csvText,
                    mode: csvMode,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'Unable to import CSV.');
            }

            setSnapshot(payload.snapshot || { payments: [], summary: null });
            setMessage(
                `CSV import complete. ${payload.createdCount} created, ${payload.updatedCount} updated.`,
            );
            setCsvText('');
            setCsvFileName('');
            setCsvPreviewCount(0);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setSaving(false);
        }
    }

    function downloadTemplate() {
        const template = [
            'externalId,type,cycle,name,amount,currency,startDate,endDate,status,paymentMethod,ownerName,department,employeeCode,employeeEmail,vendorName,autoRenew,seatCount,notes',
            'EMP-001,salary,monthly,Payroll - Priya Sharma,65000,INR,2025-01-10,,active,bank_transfer,Finance,Operations,EMP-001,priya@example.com,,false,1,Operations manager',
            'SUB-001,subscription,annual,Google Workspace,180000,INR,2025-01-01,,active,auto_debit,IT,Technology,,,Google,true,42,Annual workspace renewal',
        ].join('\n');

        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'finance-recurring-template.csv';
        anchor.click();
        URL.revokeObjectURL(url);
    }

    return (
        <section className="mt-7 scroll-mt-8 space-y-6">
            {message ? (
                <p className="rounded-2xl border border-[#111]/10 bg-white px-5 py-3 text-sm font-bold text-[#111] shadow-[0_12px_28px_rgba(17,17,17,0.08)]">
                    {message}
                </p>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-4">
                <MetricCard
                    icon={Wallet}
                    label="Monthly Burn"
                    value={formatCurrency(summary.monthlyRecurringBurn)}
                    helper={`${summary.totalRecords} recurring commitments`}
                />
                <MetricCard
                    icon={BriefcaseBusiness}
                    label="Payroll Run Rate"
                    value={formatCurrency(summary.monthlyPayrollRunRate)}
                    helper={`${summary.salaryCount} salary records`}
                />
                <MetricCard
                    icon={CalendarClock}
                    label="Accrued Liability"
                    value={formatCurrency(summary.accruedLiability)}
                    helper="Calculated from start date until today"
                />
                <MetricCard
                    icon={BadgeIndianRupee}
                    label="Due In 30 Days"
                    value={formatCurrency(summary.dueInNext30DaysAmount)}
                    helper={`${summary.dueInNext30DaysCount} upcoming payments`}
                />
            </div>

            <div className="grid gap-6 2xl:grid-cols-[1.25fr_0.95fr]">
                <section className="rounded-[30px] border border-[#111]/10 bg-white shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08)]">
                    <div className="flex flex-col gap-5 border-b border-[#111]/10 px-7 py-6 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Finance</p>
                            <h2 className="mt-1 text-2xl font-bold text-[#111]">Recurring Payments</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7280]">
                                Track payroll and subscriptions with live accrued totals, due windows, and structured operational metadata.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 xl:flex-row">
                            <div className="relative min-w-[260px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search finance records..."
                                    className="h-11 w-full rounded-2xl border border-[#111]/14 bg-white pl-10 pr-4 text-sm font-medium text-[#111] outline-none shadow-[0_6px_0_rgba(17,17,17,0.03),0_12px_24px_rgba(17,17,17,0.05)] focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
                            </div>
                            <FinanceSelect
                                value={typeFilter}
                                onChange={setTypeFilter}
                                options={[
                                    { value: 'all', label: 'All Types' },
                                    ...RECURRING_PAYMENT_TYPES.map((value) => ({
                                        value,
                                        label: TYPE_LABELS[value],
                                    })),
                                ]}
                            />
                            <FinanceSelect
                                value={statusFilter}
                                onChange={setStatusFilter}
                                options={[
                                    { value: 'all', label: 'All Statuses' },
                                    ...RECURRING_PAYMENT_STATUSES.map((value) => ({
                                        value,
                                        label: STATUS_LABELS[value],
                                    })),
                                ]}
                            />
                            <button
                                type="button"
                                onClick={loadFinance}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#111]/10 bg-white px-4 text-sm font-bold text-[#111] shadow-[0_7px_0_rgba(17,17,17,0.04),0_16px_32px_rgba(17,17,17,0.06)] transition hover:-translate-y-0.5"
                            >
                                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[760px] overflow-auto">
                        <table className="w-full min-w-[1120px] border-collapse text-left">
                            <thead className="sticky top-0 z-10 bg-[#f7f7f7] text-xs uppercase tracking-[0.1em] text-[#6b7280]">
                                <tr>
                                    <th className="px-7 py-4 font-bold">Record</th>
                                    <th className="px-7 py-4 font-bold">Type</th>
                                    <th className="px-7 py-4 font-bold">Amount</th>
                                    <th className="px-7 py-4 font-bold">Accrued</th>
                                    <th className="px-7 py-4 font-bold">Next Due</th>
                                    <th className="px-7 py-4 font-bold">Status</th>
                                    <th className="px-7 py-4 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#111]/10 text-sm">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="align-top transition hover:bg-[#fafafa]">
                                        <td className="px-7 py-5">
                                            <div className="max-w-[300px]">
                                                <p className="font-bold text-[#111]">{payment.name}</p>
                                                <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[#6b7280]">
                                                    {payment.type === 'salary'
                                                        ? [payment.department, payment.employeeCode].filter(Boolean).join(' • ') || 'Employee payroll'
                                                        : [payment.vendorName, payment.ownerName].filter(Boolean).join(' • ') || 'Vendor subscription'}
                                                </p>
                                                {(payment.employeeEmail || payment.notes) ? (
                                                    <p className="mt-2 text-xs leading-5 text-[#6b7280]">
                                                        {payment.employeeEmail || payment.notes}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-7 py-5">
                                            <div className="flex flex-col gap-2">
                                                <PaymentBadge value={TYPE_LABELS[payment.type]} />
                                                <PaymentBadge value={CYCLE_LABELS[payment.cycle]} palette="dark" />
                                            </div>
                                        </td>
                                        <td className="px-7 py-5">
                                            <p className="font-bold text-[#111]">{formatCurrency(payment.amount, payment.currency)}</p>
                                            <p className="mt-1 text-xs text-[#6b7280]">
                                                Monthly eq. {formatCurrency(payment.metrics.monthlyEquivalent, payment.currency)}
                                            </p>
                                        </td>
                                        <td className="px-7 py-5">
                                            <p className="font-bold text-[#111]">{formatCurrency(payment.metrics.accruedAmount, payment.currency)}</p>
                                            <p className="mt-1 text-xs text-[#6b7280]">
                                                {payment.metrics.currentPeriodStart} to {payment.metrics.currentPeriodEnd}
                                            </p>
                                        </td>
                                        <td className="px-7 py-5">
                                            <p className="font-bold text-[#111]">{payment.metrics.nextDueDate || 'N/A'}</p>
                                            <p className="mt-1 text-xs text-[#6b7280]">
                                                {payment.status === 'active'
                                                    ? `${payment.metrics.daysUntilDue} days remaining`
                                                    : 'Inactive timeline'}
                                            </p>
                                        </td>
                                        <td className="px-7 py-5">
                                            <PaymentBadge value={STATUS_LABELS[payment.status]} />
                                        </td>
                                        <td className="px-7 py-5">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setForm(formFromPayment(payment))}
                                                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#111]/10 bg-white px-3 text-xs font-bold text-[#111]"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deletePayment(payment.id)}
                                                    disabled={deletingId === payment.id}
                                                    className="inline-flex h-10 items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-7 py-8 text-center text-sm font-medium text-[#6b7280]">
                                            No recurring payments match the current filters.
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="space-y-6">
                    <section className="rounded-[30px] border border-[#111]/10 bg-white p-6 shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Manual Entry</p>
                                <h3 className="mt-1 text-2xl font-bold text-[#111]">
                                    {form.id ? 'Edit Recurring Payment' : 'Add Recurring Payment'}
                                </h3>
                            </div>
                            {form.id ? (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]"
                                >
                                    Clear
                                </button>
                            ) : null}
                        </div>

                        <form onSubmit={submitForm} className="mt-5 grid gap-3">
                            <div className="grid gap-3 md:grid-cols-2">
                                <FinanceSelect
                                    value={form.type}
                                    onChange={(value) => updateForm('type', value)}
                                    options={RECURRING_PAYMENT_TYPES.map((value) => ({
                                        value,
                                        label: TYPE_LABELS[value],
                                    }))}
                                />
                                <FinanceSelect
                                    value={form.cycle}
                                    onChange={(value) => updateForm('cycle', value)}
                                    disabled={form.type === 'salary'}
                                    options={RECURRING_PAYMENT_CYCLES.map((value) => ({
                                        value,
                                        label: CYCLE_LABELS[value],
                                    }))}
                                />
                            </div>

                            <input
                                value={form.name}
                                onChange={(event) => updateForm('name', event.target.value)}
                                placeholder={form.type === 'salary' ? 'Employee / salary record name' : 'Subscription name'}
                                className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                            />

                            <div className="grid gap-3 md:grid-cols-[1fr_110px]">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={(event) => updateForm('amount', event.target.value)}
                                    placeholder="Amount"
                                    className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
                                <input
                                    value={form.currency}
                                    onChange={(event) => updateForm('currency', event.target.value.toUpperCase())}
                                    maxLength={3}
                                    placeholder="INR"
                                    className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium uppercase text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <input
                                    type="date"
                                    value={form.startDate}
                                    onChange={(event) => updateForm('startDate', event.target.value)}
                                    className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
                                <input
                                    type="date"
                                    value={form.endDate}
                                    onChange={(event) => updateForm('endDate', event.target.value)}
                                    className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <FinanceSelect
                                    value={form.status}
                                    onChange={(value) => updateForm('status', value)}
                                    options={RECURRING_PAYMENT_STATUSES.map((value) => ({
                                        value,
                                        label: STATUS_LABELS[value],
                                    }))}
                                />
                                <FinanceSelect
                                    value={form.paymentMethod}
                                    onChange={(value) => updateForm('paymentMethod', value)}
                                    options={PAYMENT_METHODS.map((value) => ({
                                        value,
                                        label: PAYMENT_METHOD_LABELS[value],
                                    }))}
                                />
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <input
                                    value={form.ownerName}
                                    onChange={(event) => updateForm('ownerName', event.target.value)}
                                    placeholder="Owner / budget owner"
                                    className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
                                <input
                                    value={form.externalId}
                                    onChange={(event) => updateForm('externalId', event.target.value)}
                                    placeholder="External ID"
                                    className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
                            </div>

                            {form.type === 'salary' ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <input
                                        value={form.department}
                                        onChange={(event) => updateForm('department', event.target.value)}
                                        placeholder="Department"
                                        className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    />
                                    <input
                                        value={form.employeeCode}
                                        onChange={(event) => updateForm('employeeCode', event.target.value)}
                                        placeholder="Employee code"
                                        className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    />
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    <input
                                        value={form.vendorName}
                                        onChange={(event) => updateForm('vendorName', event.target.value)}
                                        placeholder="Vendor / provider"
                                        className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    />
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.seatCount}
                                        onChange={(event) => updateForm('seatCount', event.target.value)}
                                        placeholder="Seats / licenses"
                                        className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    />
                                </div>
                            )}

                            <input
                                value={form.employeeEmail}
                                onChange={(event) => updateForm('employeeEmail', event.target.value)}
                                placeholder={form.type === 'salary' ? 'Employee email' : 'Billing contact email'}
                                className="h-11 rounded-2xl border border-[#111]/14 px-4 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                            />

                            {form.type === 'subscription' ? (
                                <label className="flex items-center gap-3 rounded-2xl border border-[#111]/10 bg-[#fafafa] px-4 py-3 text-sm font-medium text-[#374151]">
                                    <input
                                        type="checkbox"
                                        checked={form.autoRenew}
                                        onChange={(event) => updateForm('autoRenew', event.target.checked)}
                                        className="h-4 w-4 rounded border-[#111]/20"
                                    />
                                    Auto renew this subscription
                                </label>
                            ) : null}

                            <textarea
                                value={form.notes}
                                onChange={(event) => updateForm('notes', event.target.value)}
                                rows={4}
                                placeholder="Notes, justification, or payroll context"
                                className="rounded-2xl border border-[#111]/14 px-4 py-3 text-sm font-medium text-[#111] outline-none focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                            />

                            <button
                                type="submit"
                                disabled={saving || !canWrite}
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#111] px-5 text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_18px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : form.id ? 'Update Payment' : 'Create Payment'}
                            </button>
                        </form>
                    </section>

                    <section className="rounded-[30px] border border-[#111]/10 bg-white p-6 shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Bulk Update</p>
                                <h3 className="mt-1 text-2xl font-bold text-[#111]">CSV Import</h3>
                            </div>
                            <button
                                type="button"
                                onClick={downloadTemplate}
                                className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]"
                            >
                                Template
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <label className="flex cursor-pointer items-center justify-between rounded-[24px] border border-dashed border-[#111]/18 bg-[#fafafa] px-4 py-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#111] shadow-[0_6px_0_rgba(17,17,17,0.03)]">
                                        <FileSpreadsheet className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-[#111]">
                                            {csvFileName || 'Choose finance CSV'}
                                        </p>
                                        <p className="text-xs text-[#6b7280]">
                                            {csvPreviewCount > 0 ? `${csvPreviewCount} rows ready` : 'Upload salaries and subscriptions in one shot'}
                                        </p>
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={handleCsvFile}
                                    className="hidden"
                                />
                                <span className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#111] px-4 text-xs font-bold uppercase tracking-[0.08em] text-white">
                                    <Upload className="h-4 w-4" />
                                    Upload
                                </span>
                            </label>

                            <FinanceSelect
                                value={csvMode}
                                onChange={setCsvMode}
                                options={[
                                    { value: 'upsert', label: 'Upsert Existing Records' },
                                    ...(isSuperAdmin ? [{ value: 'replace_all', label: 'Replace Entire Finance Register' }] : []),
                                ]}
                            />

                            <button
                                type="button"
                                onClick={importCsv}
                                disabled={saving || !csvText.trim()}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111] px-5 text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_18px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 disabled:opacity-50"
                            >
                                <Upload className="h-4 w-4" />
                                {saving ? 'Importing...' : 'Import CSV'}
                            </button>

                            <div className="rounded-2xl border border-[#111]/10 bg-[#fafafa] px-4 py-4 text-xs leading-6 text-[#6b7280]">
                                Accepted columns:
                                <br />
                                `externalId`, `type`, `cycle`, `name`, `amount`, `currency`, `startDate`, `endDate`, `status`, `paymentMethod`, `ownerName`, `department`, `employeeCode`, `employeeEmail`, `vendorName`, `autoRenew`, `seatCount`, `notes`
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </section>
    );
}
