'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    BarChart3,
    Building2,
    CalendarDays,
    CalendarCheck2,
    CheckCircle2,
    Copy,
    Download,
    Home,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageSquare,
    Eye,
    EyeOff,
    PhoneCall,
    RefreshCcw,
    Search,
    ShieldCheck,
    UserPlus,
    UsersRound,
    X,
} from 'lucide-react';
import { RiArrowDownSLine } from 'react-icons/ri';
import {
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';
import {
    ADMIN_FEEDBACK_BUDGET_OPTIONS,
    ADMIN_FEEDBACK_CONFIGURATION_OPTIONS,
    getAdminFeedbackFieldErrors,
} from '@/lib/admin-feedback';
import {
    getWhatsAppDeliveryStatusLabel,
    isWhatsAppDeliverySuccessStatus,
} from '@/lib/whatsapp-delivery';

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    manager: 'Manager',
    channel_partner: 'Channel Partner',
    lead_partner: 'Lead Partner',
};

const PARTNER_KEY_OPTIONS = [
    { value: 'super_admin', label: 'Super Admin', role: 'super_admin' },
    { value: 'manager', label: 'Manager', role: 'manager' },
    { value: 'channel_partner', label: 'Channel Partner', role: 'channel_partner' },
    { value: 'aurum_analytica', label: 'Aurum Analytica Leads', role: 'lead_partner', leadSource: 'aurum_analytica' },
    { value: '99acres', label: '99acres Leads', role: 'lead_partner', leadSource: '99acres' },
    { value: 'magicbricks', label: 'MagicBricks Leads', role: 'lead_partner', leadSource: 'magicbricks' },
];

const LEAD_SOURCE_LABELS = {
    aurum_analytica: 'Aurum Analytica',
    '99acres': '99acres',
    magicbricks: 'MagicBricks',
};

const STATUS_OPTIONS = ['available', 'reserved', 'blocked', 'sold out'];

const STATUS_COLORS = {
    available: '#111111',
    reserved: '#4b5563',
    blocked: '#9ca3af',
    'sold out': '#d1d5db',
};

function normalizeStatus(status) {
    return STATUS_OPTIONS.includes(status) ? status : 'available';
}

const TYPE_COLORS = ['#111111', '#6b7280', '#a3a3a3', '#d4d4d4'];
const CHANNEL_LABELS = {
    contact_form: 'Website Form',
    whatsapp_form: 'WhatsApp Form',
    portal_lead: 'External Lead',
};

const LEAD_TEMPERATURES = {
    cold: { label: 'Cold', description: '0–2 responses', className: 'border-slate-200 bg-slate-50 text-slate-700' },
    warm: { label: 'Warm', description: '3–4 responses', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    hot: { label: 'Hot', description: '5+ responses', className: 'border-red-200 bg-red-50 text-red-700' },
};

const ADMIN_NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', section: 'dashboard' },
    { icon: MessageSquare, label: 'Leads', section: 'leads' },
    { icon: Home, label: 'Inventory', section: 'inventory' },
    { icon: UsersRound, label: 'RBAC Users', section: 'users' },
    { icon: KeyRound, label: 'Signup Keys', section: 'keys' },
    { icon: BarChart3, label: 'Reports', section: 'reports' },
];

function isActiveAdminSection(activeSection, section) {
    return activeSection === section || (section === 'users' && activeSection === 'keys');
}

function formatAdminDate(value) {
    if (!value) return 'Not available';

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
    }).format(new Date(value));
}

function getLeadJourneySummary(lead) {
    const journey = lead?.metadata?.whatsappJourney;

    if (!journey) {
        return 'Website enquiry saved.';
    }

    const parts = [
        journey.selectedOption ? `Intent: ${journey.selectedOption}` : '',
        journey.unitType ? `Unit: ${journey.unitType}` : '',
        journey.budget ? `Budget: ${journey.budget}` : '',
        journey.visitTime ? `Visit: ${journey.visitTime}` : '',
        journey.callTime ? `Call: ${journey.callTime}` : '',
    ].filter(Boolean);

    return parts.length ? parts.join(' | ') : 'WhatsApp flow started.';
}

function getLeadTemperature(lead) {
    return lead?.whatsapp?.temperature || 'cold';
}

function LeadTemperaturePill({ lead }) {
    const temperature = getLeadTemperature(lead);
    const meta = LEAD_TEMPERATURES[temperature];
    const score = lead?.whatsapp?.score || 0;

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${meta.className}`}>
            {meta.label} · {score}
        </span>
    );
}

function createEmptyRemarkForm() {
    return {
        budget: '',
        configuration: '',
        location: '',
        notes: '',
    };
}

function getRemarkMetaText(remark) {
    const parts = [
        remark?.configuration || '',
        remark?.budget || '',
        remark?.location || '',
    ].filter(Boolean);

    return parts.join(' · ');
}

function LeadActivityPanel({ lead, onClose, canWrite, onRemarkSaved }) {
    const [remarkForm, setRemarkForm] = useState(createEmptyRemarkForm);
    const [savingRemark, setSavingRemark] = useState(false);
    const [remarkErrors, setRemarkErrors] = useState({});

    if (!lead) return null;

    const whatsapp = lead.whatsapp || {};
    const activity = Array.isArray(lead.activity) ? lead.activity : [];
    const remarks = Array.isArray(lead.salesRemarks) ? lead.salesRemarks : [];
    const temperature = getLeadTemperature(lead);
    const meta = LEAD_TEMPERATURES[temperature];

    function updateRemarkField(name, value) {
        setRemarkForm((current) => ({ ...current, [name]: value }));
        setRemarkErrors((current) => {
            if (!current[name] && !current.form) {
                return current;
            }

            const next = { ...current };
            delete next[name];
            delete next.form;
            return next;
        });
    }

    async function saveRemark(event) {
        event.preventDefault();
        const fieldErrors = getAdminFeedbackFieldErrors(remarkForm);
        if (Object.keys(fieldErrors).length) {
            setRemarkErrors(fieldErrors);
            return;
        }

        setSavingRemark(true);
        setRemarkErrors({});
        try {
            const response = await fetch(`/api/admin/leads/${lead.id}/remarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(remarkForm),
            });
            const payload = await response.json();
            if (!response.ok) {
                if (payload?.fieldErrors) {
                    setRemarkErrors(payload.fieldErrors);
                }
                throw new Error(payload.error || 'Unable to save remark.');
            }
            onRemarkSaved(payload.remark);
            setRemarkForm(createEmptyRemarkForm());
        } catch (error) {
            setRemarkErrors((current) => ({
                ...current,
                form: error.message,
            }));
        } finally {
            setSavingRemark(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[1000] flex justify-end bg-black/35 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Lead activity">
            <button type="button" aria-label="Close lead activity" onClick={onClose} className="absolute inset-0 cursor-default" />
            <aside className="editorial-detail relative flex h-full w-full max-w-2xl flex-col bg-[#fbfbfa] shadow-[-24px_0_70px_rgba(17,17,17,0.22)] sm:rounded-[30px] sm:border sm:border-[#111]/10">
                <div className="flex items-start justify-between gap-4 border-b border-[#111]/10 px-5 py-5 sm:px-7 sm:py-6">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Lead activity</p>
                        <h3 className="mt-1 text-2xl font-bold text-[#111]">{lead.name || 'Unknown lead'}</h3>
                        <p className="mt-1 text-sm text-[#6b7280]">{lead.phone || 'No phone'} · {lead.source || 'website'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#111]/10 bg-white text-xl font-medium text-[#111]">×</button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${meta.className}`}>{meta.label} lead</span>
                        <span className="rounded-full border border-[#111]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#374151]">{whatsapp.score || 0} meaningful responses</span>
                        {whatsapp.callbackRequested ? <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"><PhoneCall className="h-3.5 w-3.5" /> Callback requested</span> : null}
                        {whatsapp.siteVisitRequested ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CalendarCheck2 className="h-3.5 w-3.5" /> Site visit requested</span> : null}
                    </div>

                    <section className="mt-6 rounded-[24px] border border-[#111]/10 bg-white p-4 shadow-[0_8px_20px_rgba(17,17,17,0.04)] sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Sales remarks</p>
                            <span className="text-xs font-bold text-[#6b7280]">{remarks.length}</span>
                        </div>
                        {remarks.length ? (
                            <div className="mt-4 space-y-4">
                                {remarks.map((item) => (
                                    <article key={item.id} className="border-l-2 border-[#111] pl-4">
                                        {getRemarkMetaText(item) ? (
                                            <p className="text-sm font-bold text-[#111]">{getRemarkMetaText(item)}</p>
                                        ) : null}
                                        {item.notes ? (
                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#374151]">{item.notes}</p>
                                        ) : item.text ? (
                                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#374151]">{item.text}</p>
                                        ) : null}
                                        <p className="mt-2 text-xs font-bold text-[#6b7280]">{item.authorName} · {formatAdminDate(item.createdAt)}</p>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-[#6b7280]">No sales remarks added yet.</p>
                        )}
                        {canWrite ? (
                            <form onSubmit={saveRemark} className="mt-5 border-t border-[#111]/10 pt-4">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">Add calling feedback</p>
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Budget</span>
                                        <select
                                            value={remarkForm.budget}
                                            onChange={(event) => updateRemarkField('budget', event.target.value)}
                                            className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-[#fafafa] px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                        >
                                            <option value="">Select budget</option>
                                            {ADMIN_FEEDBACK_BUDGET_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        {remarkErrors.budget ? <p className="mt-2 text-xs font-bold text-red-600">{remarkErrors.budget}</p> : null}
                                    </label>
                                    <label className="block">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Configuration</span>
                                        <select
                                            value={remarkForm.configuration}
                                            onChange={(event) => updateRemarkField('configuration', event.target.value)}
                                            className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-[#fafafa] px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                        >
                                            <option value="">Select configuration</option>
                                            {ADMIN_FEEDBACK_CONFIGURATION_OPTIONS.map((option) => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        {remarkErrors.configuration ? <p className="mt-2 text-xs font-bold text-red-600">{remarkErrors.configuration}</p> : null}
                                    </label>
                                </div>
                                <label className="mt-3 block">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Location</span>
                                    <input
                                        type="text"
                                        value={remarkForm.location}
                                        onChange={(event) => updateRemarkField('location', event.target.value)}
                                        maxLength={120}
                                        placeholder="Customer preferred location"
                                        className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-[#fafafa] px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    />
                                    {remarkErrors.location ? <p className="mt-2 text-xs font-bold text-red-600">{remarkErrors.location}</p> : null}
                                </label>
                                <label className="mt-3 block">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Notes</span>
                                    <textarea
                                        value={remarkForm.notes}
                                        onChange={(event) => updateRemarkField('notes', event.target.value)}
                                        maxLength={5000}
                                        rows={4}
                                        placeholder="Call outcome, customer requirement, follow-up details..."
                                        className="mt-2 w-full resize-y rounded-2xl border border-[#111]/14 bg-[#fafafa] px-4 py-3 text-sm leading-6 text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    />
                                    {remarkErrors.notes ? <p className="mt-2 text-xs font-bold text-red-600">{remarkErrors.notes}</p> : null}
                                </label>
                                {remarkErrors.form ? <p className="mt-3 text-xs font-bold text-red-600">{remarkErrors.form}</p> : null}
                                <button
                                    type="submit"
                                    disabled={savingRemark || !remarkForm.budget || !remarkForm.configuration || !remarkForm.location.trim()}
                                    className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-[#111] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                    {savingRemark ? 'Saving...' : 'Save remark'}
                                </button>
                            </form>
                        ) : null}
                    </section>

                    <div className="mt-7">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Activity flow</p>
                        {activity.length ? (
                            <ol className="mt-4 border-l border-[#111]/15 pl-5">
                                {activity.map((event, index) => (
                                    <li key={`${event.type}-${event.occurredAt}-${index}`} className="relative pb-6 last:pb-0">
                                        <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white ${event.status === 'failed' ? 'bg-red-500' : event.type === 'customer_selection' ? 'bg-violet-500' : 'bg-[#111]'}`} />
                                        <p className="font-bold text-[#111]">{event.title}</p>
                                        {event.detail ? <p className="mt-1 text-sm leading-6 text-[#4b5563]">{event.detail}</p> : null}
                                        <p className="mt-1.5 text-xs font-bold text-[#6b7280]">{formatAdminDate(event.occurredAt)}</p>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div className="mt-3 rounded-2xl border border-dashed border-[#111]/15 bg-white px-4 py-5 text-sm text-[#6b7280]">No activity has been recorded for this lead yet.</div>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
}

function AdminSidebar({ user, activeSection, onNavigate, onClose = null, className = '' }) {
    const navItems = user?.role === 'lead_partner'
        ? ADMIN_NAV_ITEMS.filter((item) => item.section === 'leads')
        : ADMIN_NAV_ITEMS;

    return (
        <aside className={className}>
            <div className="flex h-20 items-center justify-between gap-3 border-b border-[#111]/10 px-5 sm:h-24 sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111] text-white shadow-[0_10px_0_rgba(17,17,17,0.12),0_22px_32px_rgba(17,17,17,0.18)]">
                        <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-display text-base font-bold text-[#111] sm:text-lg">Aadhya Admin</p>
                        <p className="text-xs font-bold text-[#6b7280]">
                            {user?.role === 'lead_partner' ? 'Partner leads' : 'Serene inventory'}
                        </p>
                    </div>
                </div>
                {onClose ? (
                    <button
                        type="button"
                        aria-label="Close navigation menu"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#111]/10 bg-white text-[#111] shadow-[0_7px_0_rgba(17,17,17,0.04),0_16px_32px_rgba(17,17,17,0.06)] lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                ) : null}
            </div>

            <nav className="flex-1 space-y-2 px-4 py-5 sm:px-5 sm:py-7">
                {navItems.map(({ icon: Icon, label, section }) => (
                    <button
                        key={label}
                        type="button"
                        onClick={() => onNavigate(section)}
                        className={`flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-bold transition ${
                            isActiveAdminSection(activeSection, section)
                                ? 'bg-[#111] text-white shadow-[0_8px_0_rgba(17,17,17,0.08),0_18px_32px_rgba(17,17,17,0.16)]'
                                : 'text-[#6b7280] hover:bg-white hover:text-[#111] hover:shadow-[0_10px_24px_rgba(17,17,17,0.07)]'
                        }`}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{label}</span>
                    </button>
                ))}
            </nav>

            <div className="border-t border-[#111]/10 p-4 sm:p-5">
                <div className="rounded-[24px] border border-[#111]/10 bg-white p-4 shadow-[0_10px_0_rgba(17,17,17,0.035),inset_0_1px_0_rgba(255,255,255,1)]">
                    <p className="truncate text-sm font-bold text-[#111]">{user.name}</p>
                    <p className="mt-1 text-xs font-medium text-[#6b7280]">{ROLE_LABELS[user.role]}</p>
                </div>
            </div>
        </aside>
    );
}

function AuthPanel({ onAuthed }) {
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'channel_partner',
        secretKey: '',
    });
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setMessage('');

        try {
            const endpoint = mode === 'login' ? '/api/admin/auth/login' : '/api/admin/auth/signup';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const payload = await response.json();

            if (mode === 'login' && payload?.debug) {
                const method = response.ok ? 'info' : 'error';
                console[method]('[admin-login-debug-browser]', payload.debug);
            }

            if (!response.ok) {
                throw new Error(payload.error || 'Authentication failed.');
            }

            onAuthed(payload.user);
        } catch (error) {
            setMessage(error.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="font-display fixed inset-0 z-[999] overflow-y-auto bg-[#f4f4f2] text-[#111] lg:grid lg:min-h-screen lg:grid-cols-[520px_1fr] lg:overflow-hidden">
            <section className="flex flex-col justify-between gap-8 bg-[#fbfbfa] px-5 py-6 shadow-[12px_0_40px_rgba(17,17,17,0.06)] sm:px-8 sm:py-8 lg:min-h-screen">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#111] text-white shadow-[0_8px_0_rgba(17,17,17,0.1)]">
                            <Building2 className="h-5 w-5" />
                        </span>
                        <div>
                            <p className="text-lg font-bold text-[#111]">Aadhya Serene</p>
                            <p className="text-xs font-medium text-[#6b7280]">Inventory Admin</p>
                        </div>
                    </div>

                    <div className="mt-10 max-w-md sm:mt-16">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                            Secure dashboard
                        </p>
                        <h1 className="mt-4 text-3xl font-bold leading-tight text-[#111] sm:text-4xl">
                            Manage every flat from one clean control room.
                        </h1>
                        <p className="mt-4 text-sm leading-6 text-[#6b7280]">
                            Role-based access, live inventory, signup keys, and status updates backed by MongoDB.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#111]/10 bg-white p-4 shadow-[0_8px_0_rgba(17,17,17,0.035)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7280]">Access levels</p>
                    <div className="mt-3 grid gap-2 text-sm text-[#374151]">
                        <p>Super Admin: full control and signup keys</p>
                        <p>Manager: edit inventory status</p>
                        <p>Channel Partner: read-only inventory</p>
                    </div>
                </div>
            </section>

            <section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
                <form
                    onSubmit={submit}
                    className="w-full max-w-lg rounded-3xl border border-[#111]/10 bg-white p-5 shadow-[0_12px_0_rgba(17,17,17,0.04),0_24px_70px_rgba(17,17,17,0.08)] sm:p-7 lg:max-w-md"
                >
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-[#111]">
                            {mode === 'login' ? 'Welcome back' : 'Create admin account'}
                        </h2>
                        <p className="mt-1 text-sm text-[#6b7280]">
                            {mode === 'login' ? 'Sign in to continue.' : 'Signup requires a Super Admin key.'}
                        </p>
                    </div>

                    <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-[#f3f3f3] p-1">
                        {['login', 'signup'].map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setMode(item)}
                                className={`rounded-lg px-4 py-2.5 text-sm font-semibold capitalize transition ${
                                    mode === item
                                        ? 'bg-white text-[#111] shadow-[0_8px_18px_rgba(17,17,17,0.08)]'
                                        : 'text-[#6b7280]'
                                }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {mode === 'signup' ? (
                            <input
                                value={form.name}
                                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                placeholder="Full name"
                                className="h-12 w-full rounded-xl border border-[#111]/14 bg-white px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                            />
                        ) : null}
                        <input
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                            placeholder="Email"
                            className="h-12 w-full rounded-xl border border-[#111]/14 bg-white px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                        />
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                placeholder="Password"
                                className="h-12 w-full rounded-xl border border-[#111]/14 bg-white px-4 pr-12 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((current) => !current)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-[#6b7280] transition hover:text-[#111]"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {mode === 'signup' ? (
                            <>
                                <SelectControl
                                    value={form.role}
                                    onChange={(role) => setForm((current) => ({ ...current, role }))}
                                    options={Object.entries(ROLE_LABELS).map(([role, label]) => ({
                                        value: role,
                                        label,
                                    }))}
                                />
                                <input
                                    value={form.secretKey}
                                    onChange={(event) => setForm((current) => ({ ...current, secretKey: event.target.value }))}
                                    placeholder="Signup secret key"
                                    className="h-12 w-full rounded-xl border border-[#111]/14 bg-white px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
                            </>
                        ) : null}
                    </div>

                    {message ? (
                        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {message}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={busy}
                        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111] px-5 text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_16px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 disabled:opacity-55"
                    >
                        {mode === 'signup' ? <UserPlus className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
                        {busy ? 'Please wait' : mode === 'signup' ? 'Create Account' : 'Login'}
                    </button>
                </form>
            </section>
        </main>
    );
}

function KpiCard({ label, value, helper, icon: Icon }) {
    return (
        <article className="group relative overflow-hidden rounded-[24px] border border-[#111]/10 bg-white p-5 shadow-[0_18px_0_rgba(17,17,17,0.04),0_28px_60px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)] sm:rounded-[26px] sm:p-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white" />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">{label}</p>
                    <p className="mt-4 font-display text-[2.1rem] font-bold leading-none tracking-tight text-[#111] sm:text-[2.55rem]">{value}</p>
                    <p className="mt-3 text-xs font-bold text-[#111]/70">{helper}</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#111]/10 bg-[#f7f7f7] text-[#111] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_8px_0_rgba(17,17,17,0.04)]">
                    <Icon className="h-5 w-5" />
                </span>
            </div>
        </article>
    );
}

function PremiumPieChart({ title, subtitle, entries, total }) {
    return (
        <div className="rounded-[24px] border border-[#111]/10 bg-white p-4 shadow-[0_16px_0_rgba(17,17,17,0.035),0_26px_54px_rgba(17,17,17,0.07)] sm:rounded-[26px] sm:p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">{subtitle}</p>
                    <h3 className="mt-1 font-display text-xl font-bold text-[#111]">{title}</h3>
                </div>
                <span className="rounded-full border border-[#111]/10 bg-[#f7f7f7] px-3 py-1 text-xs font-bold text-[#111]">
                    {total} units
                </span>
            </div>

            <div className="mt-5 grid items-center gap-5 lg:grid-cols-[1fr_190px]">
                <div className="h-[220px] min-w-0 sm:h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip
                                cursor={false}
                                contentStyle={{
                                    borderRadius: '16px',
                                    border: '1px solid rgba(17,17,17,0.12)',
                                    boxShadow: '0 16px 40px rgba(17,17,17,0.12)',
                                }}
                            />
                            <Pie
                                data={entries}
                                dataKey="value"
                                nameKey="label"
                                innerRadius={64}
                                outerRadius={92}
                                paddingAngle={entries.length > 1 ? 3 : 0}
                                cornerRadius={8}
                                stroke="#ffffff"
                                strokeWidth={4}
                            >
                                {entries.map((entry) => (
                                    <Cell key={entry.label} fill={entry.color} />
                                ))}
                            </Pie>
                            <Legend
                                verticalAlign="bottom"
                                iconType="circle"
                                formatter={(value) => (
                                    <span className="text-xs font-bold capitalize text-[#4b5563]">{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid gap-2">
                    {entries.map((entry) => (
                        <div key={entry.label} className="flex items-center justify-between gap-4 rounded-2xl border border-[#111]/10 bg-[#fafafa] px-3 py-2">
                            <div className="flex min-w-0 items-center gap-3">
                                <span
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{ background: entry.color }}
                                />
                                <span className="truncate text-sm font-bold capitalize text-[#374151]">{entry.label}</span>
                            </div>
                            <span className="text-sm font-bold text-[#111]">{entry.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SelectControl({ value, options, onChange, disabled = false, className = '' }) {
    return (
        <div className={`relative ${className}`}>
            <select
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className="h-12 w-full appearance-none rounded-[24px] border border-[#111]/14 bg-white py-0 pl-5 pr-12 text-sm font-bold capitalize text-[#1f2937] outline-none shadow-[0_7px_0_rgba(17,17,17,0.035),0_16px_32px_rgba(17,17,17,0.06),inset_0_1px_0_rgba(255,255,255,1)] transition hover:border-[#111]/22 focus:border-[#111]/35 focus:ring-4 focus:ring-black/5 disabled:opacity-50"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <RiArrowDownSLine className="pointer-events-none absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#374151]" />
        </div>
    );
}

function DeliveryPill({ label, state }) {
    const status = state?.status || 'pending';
    const sentAt = state?.sentAt ? formatAdminDate(state.sentAt) : '';
    const error = state?.error || '';
    const metaStatus = state?.metaStatus || '';
    const metaStatusAt = state?.metaStatusAt ? formatAdminDate(state.metaStatusAt) : '';
    const statusLabel =
        label === 'WhatsApp' ? getWhatsAppDeliveryStatusLabel(status) : status;
    const tone =
        ['accepted', 'sent'].includes(status)
            ? 'border-sky-200 bg-sky-50 text-sky-700'
            : ['delivered', 'read'].includes(status)
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : status === 'failed'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-[#111]/10 bg-[#fafafa] text-[#6b7280]';

    return (
        <div className={`rounded-2xl border px-3 py-2 text-xs font-bold ${tone}`}>
            <p>{label}: {statusLabel}</p>
            {label === 'WhatsApp' && metaStatus ? <p className="mt-1 font-medium">Meta: {metaStatus}</p> : null}
            {label === 'WhatsApp' && metaStatusAt ? <p className="mt-1 font-medium">{metaStatusAt}</p> : null}
            {sentAt ? <p className="mt-1 font-medium">{sentAt}</p> : null}
            {error ? <p className="mt-1 break-words font-medium">{error}</p> : null}
        </div>
    );
}

export default function AdminPage() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [flats, setFlats] = useState([]);
    const [leads, setLeads] = useState([]);
    const [busyFlat, setBusyFlat] = useState('');
    const [keyRole, setKeyRole] = useState('channel_partner');
    const [latestKey, setLatestKey] = useState('');
    const [notice, setNotice] = useState('');
    const [query, setQuery] = useState('');
    const [leadQuery, setLeadQuery] = useState('');
    const [leadTemperature, setLeadTemperature] = useState('cold');
    const [leadDateRange, setLeadDateRange] = useState({ startDate: '', endDate: '' });
    const [dateFilterOpen, setDateFilterOpen] = useState(false);
    const [dateFilterDraft, setDateFilterDraft] = useState({ startDate: '', endDate: '' });
    const [selectedLead, setSelectedLead] = useState(null);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const contentRef = useRef(null);
    const dashboardRef = useRef(null);
    const leadsRef = useRef(null);
    const reportsRef = useRef(null);
    const keysRef = useRef(null);
    const inventoryRef = useRef(null);

    const canWrite = user && ['super_admin', 'manager'].includes(user.role);
    const isSuperAdmin = user?.role === 'super_admin';
    const isLeadPartner = user?.role === 'lead_partner';

    async function loadFlats() {
        const response = await fetch('/api/admin/flats', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        setFlats(Array.isArray(payload.flats) ? payload.flats : []);
    }

    async function loadLeads() {
        const params = new URLSearchParams();
        if (leadDateRange.startDate) params.set('startDate', leadDateRange.startDate);
        if (leadDateRange.endDate) params.set('endDate', leadDateRange.endDate);
        const query = params.toString();
        const response = await fetch(`/api/admin/leads${query ? `?${query}` : ''}`, { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        setLeads(Array.isArray(payload.leads) ? payload.leads : []);
    }

    async function refreshAll() {
        if (isLeadPartner) {
            await loadLeads();
            return;
        }

        await Promise.all([loadFlats(), loadLeads()]);
    }

    useEffect(() => {
        let cancelled = false;

        async function bootstrap() {
            try {
                const response = await fetch('/api/admin/auth/me', { cache: 'no-store' });
                const payload = await response.json();
                if (!cancelled && response.ok) {
                    setUser(payload.user);
                }
            } finally {
                if (!cancelled) {
                    setChecking(false);
                }
            }
        }

        void bootstrap();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!user) return undefined;

        void refreshAll();
        const intervalId = window.setInterval(refreshAll, 30000);
        return () => window.clearInterval(intervalId);
    }, [user, isLeadPartner, leadDateRange]);

    useEffect(() => {
        if (isLeadPartner) {
            setActiveSection('leads');
        }
    }, [isLeadPartner]);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;

        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [sidebarOpen]);

    useEffect(() => {
        function handleResize() {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(false);
            }
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const stats = useMemo(() => {
        const byStatus = STATUS_OPTIONS.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
        const byType = {};
        const byFloor = {};

        flats.forEach((flat) => {
            byStatus[normalizeStatus(flat.status)] += 1;
            byType[flat.type] = (byType[flat.type] || 0) + 1;
            byFloor[flat.floor] = (byFloor[flat.floor] || 0) + 1;
        });

        return {
            total: flats.length,
            byStatus,
            byType,
            byFloor,
            available: byStatus.available,
        };
    }, [flats]);

    const visibleFlats = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return flats;

        return flats.filter((flat) =>
            [flat.flat, flat.type, flat.floor, flat.facing, flat.status]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery),
        );
    }, [flats, query]);

    const leadStats = useMemo(() => {
        return leads.reduce(
            (acc, lead) => {
                acc.total += 1;
                acc[lead.channel] = (acc[lead.channel] || 0) + 1;
                acc[getLeadTemperature(lead)] += 1;

                if (lead.emailDelivery?.status === 'sent') {
                    acc.emailSent += 1;
                }

                if (isWhatsAppDeliverySuccessStatus(lead.whatsappDelivery?.status)) {
                    acc.whatsappSent += 1;
                }

                return acc;
            },
            {
                total: 0,
                contact_form: 0,
                whatsapp_form: 0,
                portal_lead: 0,
                cold: 0,
                warm: 0,
                hot: 0,
                emailSent: 0,
                whatsappSent: 0,
            },
        );
    }, [leads]);

    const visibleLeads = useMemo(() => {
        const normalizedQuery = leadQuery.trim().toLowerCase();
        const temperatureLeads = leads.filter((lead) => getLeadTemperature(lead) === leadTemperature);
        if (!normalizedQuery) return temperatureLeads;

        return temperatureLeads.filter((lead) =>
            [
                lead.name,
                lead.phone,
                lead.email,
                lead.source,
                lead.channel,
                lead.requestLabel,
                lead.message,
                lead.preferredTime,
                getLeadJourneySummary(lead),
                ...(lead.whatsapp?.responses || []).map((response) => response.label),
                lead.whatsapp?.callbackRequested ? 'callback requested' : '',
                lead.whatsapp?.siteVisitRequested ? 'site visit requested' : '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery),
        );
    }, [leadQuery, leadTemperature, leads]);

    const statusEntries = useMemo(
        () =>
            STATUS_OPTIONS.map((status) => ({
                label: status,
                value: stats.byStatus[status],
                color: STATUS_COLORS[status],
            })),
        [stats.byStatus],
    );

    const typeEntries = useMemo(
        () =>
            Object.entries(stats.byType).map(([type, value], index) => ({
                label: type,
                value,
                color: TYPE_COLORS[index % TYPE_COLORS.length],
            })),
        [stats.byType],
    );

    const sectionMeta = {
        dashboard: {
            eyebrow: 'Inventory dashboard',
            title: `Welcome back, ${user?.name || 'Admin'}`,
        },
        leads: {
            eyebrow: 'Lead management',
            title: isLeadPartner
                ? `${LEAD_SOURCE_LABELS[user?.leadSource] || 'Partner'} Leads`
                : 'Website and WhatsApp Leads',
        },
        inventory: {
            eyebrow: 'Inventory control',
            title: 'Flat Status Management',
        },
        users: {
            eyebrow: 'Access management',
            title: 'RBAC Users',
        },
        keys: {
            eyebrow: 'Access management',
            title: 'Signup Keys',
        },
        reports: {
            eyebrow: 'Reporting',
            title: 'Inventory Analytics',
        },
    };

    const activeSectionMeta = sectionMeta[activeSection] || sectionMeta.dashboard;

    function goToSection(section) {
        setSidebarOpen(false);

        if (isLeadPartner && section !== 'leads') {
            return;
        }

        if (section === 'leads') {
            setActiveSection('leads');
            contentRef.current?.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
            return;
        }

        const sectionRefs = {
            dashboard: dashboardRef,
            inventory: inventoryRef,
            users: keysRef,
            keys: keysRef,
            reports: reportsRef,
        };

        setActiveSection(section);
        window.requestAnimationFrame(() => {
            if (section === 'dashboard') {
                contentRef.current?.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                });
                return;
            }

            sectionRefs[section]?.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    }

    async function updateStatus(flatId, status) {
        setBusyFlat(flatId);
        setNotice('');

        try {
            const response = await fetch(`/api/admin/flats/${flatId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || 'Unable to update flat.');
            }

            setFlats((current) =>
                current.map((flat) => (flat.flat === flatId ? payload.flat : flat)),
            );
            setNotice(`Flat ${flatId} updated to ${status}.`);
        } catch (error) {
            setNotice(error.message);
        } finally {
            setBusyFlat('');
        }
    }

    async function createSignupKey() {
        const keyOption = PARTNER_KEY_OPTIONS.find((option) => option.value === keyRole)
            || PARTNER_KEY_OPTIONS[2];
        const response = await fetch('/api/admin/signup-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: keyOption.role,
                leadSource: keyOption.leadSource || '',
            }),
        });
        const payload = await response.json();

        if (response.ok) {
            setLatestKey(payload.key.key);
            await navigator.clipboard?.writeText(payload.key.key).catch(() => {});
        } else {
            setNotice(payload.error || 'Unable to create signup key.');
        }
    }

    function handleRemarkSaved(remark) {
        if (!remark || !selectedLead) return;

        const updateLead = (lead) =>
            lead.id === selectedLead.id
                ? { ...lead, salesRemarks: [...(lead.salesRemarks || []), remark] }
                : lead;

        setSelectedLead((current) => (current ? updateLead(current) : current));
        setLeads((current) => current.map(updateLead));
    }

    async function logout() {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        setSidebarOpen(false);
        setUser(null);
        setFlats([]);
        setLeads([]);
    }

    function downloadLeadCsv() {
        const params = new URLSearchParams();
        if (leadDateRange.startDate) params.set('startDate', leadDateRange.startDate);
        if (leadDateRange.endDate) params.set('endDate', leadDateRange.endDate);
        window.location.assign(`/api/admin/leads/export${params.toString() ? `?${params}` : ''}`);
    }

    function openDateFilter() {
        setDateFilterDraft(leadDateRange);
        setDateFilterOpen(true);
    }

    function applyDateFilter() {
        if (
            dateFilterDraft.startDate
            && dateFilterDraft.endDate
            && dateFilterDraft.startDate > dateFilterDraft.endDate
        ) {
            setNotice('End date cannot be before start date.');
            return;
        }
        setLeadDateRange(dateFilterDraft);
        setDateFilterOpen(false);
        setNotice('');
    }

    if (checking) {
        return (
            <main className="font-display fixed inset-0 z-[999] flex min-h-screen items-center justify-center bg-[#f4f4f2] text-[#111]">
                <p className="text-sm font-medium text-[#6b7280]">Checking admin session...</p>
            </main>
        );
    }

    if (!user) {
        return <AuthPanel onAuthed={setUser} />;
    }

    return (
        <main className="editorial-admin font-display fixed inset-0 z-[999] flex min-h-screen overflow-hidden bg-[#f4f4f2] text-[#111]">
            {sidebarOpen ? (
                <button
                    type="button"
                    aria-label="Close navigation menu"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-black/35 lg:hidden"
                />
            ) : null}

            <AdminSidebar
                user={user}
                activeSection={activeSection}
                onNavigate={goToSection}
                className="editorial-sidebar hidden w-[292px] shrink-0 border-r border-[#111]/10 bg-[#fbfbfa] shadow-[18px_0_55px_rgba(17,17,17,0.06)] lg:flex lg:flex-col"
            />

            <AdminSidebar
                user={user}
                activeSection={activeSection}
                onNavigate={goToSection}
                onClose={() => setSidebarOpen(false)}
                className={`editorial-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(86vw,292px)] flex-col border-r border-[#111]/10 bg-[#fbfbfa] shadow-[18px_0_55px_rgba(17,17,17,0.14)] transition-transform duration-300 lg:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            />

            <section className="flex min-w-0 flex-1 flex-col">
                <header className="editorial-header flex min-h-[88px] shrink-0 flex-wrap items-start justify-between gap-4 border-b border-[#111]/10 bg-[#fbfbfa] px-4 py-4 shadow-[0_14px_40px_rgba(17,17,17,0.05)] sm:px-6 lg:h-24 lg:flex-nowrap lg:items-center lg:px-9">
                    <div className="flex min-w-0 items-start gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#111]/10 bg-white text-[#111] shadow-[0_7px_0_rgba(17,17,17,0.04),0_16px_32px_rgba(17,17,17,0.06)] lg:hidden"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="min-w-0">
                            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">
                                {activeSectionMeta.eyebrow}
                            </p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#111] sm:text-3xl">
                                {activeSectionMeta.title}
                            </h1>
                        </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={refreshAll}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#111]/10 bg-white px-4 text-sm font-bold text-[#111] shadow-[0_7px_0_rgba(17,17,17,0.04),0_16px_32px_rgba(17,17,17,0.06)] transition hover:-translate-y-0.5 sm:w-auto"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#111] px-5 text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_18px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </header>

                <div ref={contentRef} className="editorial-content min-h-0 flex-1 scroll-smooth overflow-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-0 lg:py-0">
                    {notice ? (
                        <p className="mb-5 rounded-2xl border border-[#111]/10 bg-white px-4 py-3 text-sm font-bold text-[#111] shadow-[0_12px_28px_rgba(17,17,17,0.08)] sm:mb-6 sm:px-5">
                            {notice}
                        </p>
                    ) : null}

                    {activeSection === 'leads' || isLeadPartner ? (
                    <section ref={leadsRef} className="editorial-leads flex min-h-full flex-col scroll-mt-8 overflow-hidden rounded-[24px] border border-[#111]/10 bg-white shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)] sm:rounded-[30px]">
                        <div className="flex flex-col gap-5 border-b border-[#111]/10 px-4 py-5 sm:px-7 sm:py-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Lead Management</p>
                                    <h2 className="mt-1 font-display text-2xl font-bold text-[#111]">Lead directory</h2>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7280]">
                                        {isLeadPartner
                                            ? 'This account can view and export only leads submitted by your source.'
                                            : 'A live view of every enquiry, WhatsApp interaction, and sales follow-up.'}
                                    </p>
                                </div>
                                <div className="relative flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={openDateFilter}
                                        className={`inline-flex h-11 items-center justify-center gap-2 border px-4 text-sm font-bold transition ${
                                            leadDateRange.startDate || leadDateRange.endDate
                                                ? 'border-[#111] bg-[#111] text-white'
                                                : 'border-[#111]/15 bg-white text-[#111]'
                                        }`}
                                    >
                                        <CalendarDays className="h-4 w-4" />
                                        {leadDateRange.startDate || leadDateRange.endDate ? 'Date filter active' : 'Filter by date'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={downloadLeadCsv}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#111] px-5 text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_18px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download CSV
                                    </button>
                                    {dateFilterOpen ? (
                                        <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-full min-w-[300px] border border-[#111]/15 bg-[#fffefa] p-5 text-left shadow-[0_18px_35px_rgba(17,17,17,0.12)] sm:w-[350px]">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Date range</p>
                                                    <p className="mt-1 text-sm text-[#4b5563]">Filter by submitted date.</p>
                                                </div>
                                                <button type="button" onClick={() => setDateFilterOpen(false)} className="text-sm font-bold text-[#6b7280] hover:text-[#111]">Close</button>
                                            </div>
                                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                                    Start date
                                                    <input type="date" value={dateFilterDraft.startDate} onChange={(event) => setDateFilterDraft((current) => ({ ...current, startDate: event.target.value }))} className="mt-2 h-11 w-full border border-[#111]/15 bg-white px-3 text-sm font-bold text-[#111] outline-none focus:border-[#111]" />
                                                </label>
                                                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                                    End date
                                                    <input type="date" value={dateFilterDraft.endDate} onChange={(event) => setDateFilterDraft((current) => ({ ...current, endDate: event.target.value }))} className="mt-2 h-11 w-full border border-[#111]/15 bg-white px-3 text-sm font-bold text-[#111] outline-none focus:border-[#111]" />
                                                </label>
                                            </div>
                                            <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#111]/10 pt-4">
                                                <button type="button" onClick={() => { setDateFilterDraft({ startDate: '', endDate: '' }); setLeadDateRange({ startDate: '', endDate: '' }); setDateFilterOpen(false); }} className="text-sm font-bold text-[#6b7280] hover:text-[#111]">Clear filter</button>
                                                <button type="button" onClick={applyDateFilter} className="h-10 bg-[#111] px-4 text-sm font-bold text-white">Apply dates</button>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div className="inline-flex w-full rounded-2xl border border-[#111]/10 bg-[#f7f7f7] p-1 sm:w-auto">
                                    {Object.entries(LEAD_TEMPERATURES).map(([temperature, meta]) => (
                                        <button
                                            key={temperature}
                                            type="button"
                                            onClick={() => setLeadTemperature(temperature)}
                                            className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition sm:min-w-[150px] sm:flex-none ${
                                                leadTemperature === temperature
                                                    ? 'bg-white text-[#111] shadow-[0_8px_18px_rgba(17,17,17,0.08)]'
                                                    : 'text-[#6b7280] hover:text-[#111]'
                                            }`}
                                        >
                                            <span>{meta.label}</span>
                                            <span className="rounded-full border border-[#111]/10 bg-[#fafafa] px-2 py-0.5 text-xs text-[#111]">{leadStats[temperature]}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="relative w-full xl:w-[390px]">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                                    <input
                                        value={leadQuery}
                                        onChange={(event) => setLeadQuery(event.target.value)}
                                        placeholder="Search this lead group..."
                                        className="h-12 w-full rounded-2xl border border-[#111]/14 bg-white pl-10 pr-4 text-sm font-medium text-[#111] outline-none shadow-[0_7px_0_rgba(17,17,17,0.035),0_16px_32px_rgba(17,17,17,0.05)] transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="divide-y divide-[#111]/10 xl:hidden">
                            {visibleLeads.length ? (
                                visibleLeads.map((lead) => (
                                    <article key={lead.id} className="px-4 py-5 sm:px-6">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                                    {formatAdminDate(lead.createdAt)}
                                                </p>
                                                <h3 className="mt-2 text-lg font-bold text-[#111]">
                                                    {lead.name || 'Unknown lead'}
                                                </h3>
                                                <p className="mt-1 text-sm font-medium text-[#374151]">{lead.phone || 'No phone'}</p>
                                                <p className="mt-1 break-words text-sm text-[#6b7280]">{lead.email || 'No email captured'}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <LeadTemperaturePill lead={lead} />
                                                <span className="inline-flex items-center gap-2 rounded-2xl border border-[#111]/10 bg-[#fafafa] px-4 py-2 text-xs font-bold text-[#111]">
                                                    <MessageSquare className="h-4 w-4" />
                                                    {CHANNEL_LABELS[lead.channel] || lead.channel}
                                                </span>
                                                <span className="inline-flex items-center rounded-2xl border border-[#111]/10 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                                    {lead.source || 'website'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                            <div className="rounded-[22px] border border-[#111]/10 bg-[#fafafa] p-4">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Request</p>
                                                <p className="mt-2 font-bold text-[#111]">{lead.requestLabel || 'General Enquiry'}</p>
                                                <p className="mt-2 text-sm leading-6 text-[#4b5563]">{lead.message || 'No message provided.'}</p>
                                                {lead.preferredTime ? (
                                                    <p className="mt-2 text-xs font-bold text-[#6b7280]">
                                                        Preferred time: {lead.preferredTime}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="rounded-[22px] border border-[#111]/10 bg-[#fafafa] p-4">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">WhatsApp activity</p>
                                                <p className="mt-2 text-sm leading-6 text-[#374151]">{getLeadJourneySummary(lead)}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {lead.whatsapp?.callbackRequested ? <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700"><PhoneCall className="h-3 w-3" /> Callback</span> : null}
                                                    {lead.whatsapp?.siteVisitRequested ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><CalendarCheck2 className="h-3 w-3" /> Site visit</span> : null}
                                                </div>
                                                <button type="button" onClick={() => setSelectedLead(lead)} className="mt-3 text-sm font-bold text-[#111] underline decoration-[#111]/25 underline-offset-4">View lead activity</button>
                                                <p className="mt-3 text-xs font-medium text-[#6b7280]">
                                                    Updated {formatAdminDate(lead.updatedAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                            <DeliveryPill label="Email" state={lead.emailDelivery} />
                                            <DeliveryPill label="WhatsApp" state={lead.whatsappDelivery} />
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <div className="px-4 py-10 text-center text-sm font-medium text-[#6b7280] sm:px-6">
                                    No {LEAD_TEMPERATURES[leadTemperature].label.toLowerCase()} leads match your current search.
                                </div>
                            )}
                        </div>

                        <div className="hidden min-h-0 flex-1 overflow-auto xl:block">
                            <table className="w-full min-w-[1480px] border-collapse text-left">
                                <thead className="sticky top-0 z-10 bg-[#f7f7f7] text-xs uppercase tracking-[0.1em] text-[#6b7280]">
                                    <tr>
                                        <th className="px-7 py-5 font-bold">Submitted</th>
                                        <th className="px-7 py-5 font-bold">Lead</th>
                                        <th className="px-7 py-5 font-bold">Temperature</th>
                                        <th className="px-7 py-5 font-bold">Channel</th>
                                        <th className="px-7 py-5 font-bold">Request</th>
                                        <th className="px-7 py-5 font-bold">WhatsApp</th>
                                        <th className="px-7 py-5 font-bold">Delivery</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#111]/10 text-sm">
                                    {visibleLeads.map((lead) => (
                                        <tr key={lead.id} className="align-top transition hover:bg-[#fafafa]">
                                            <td className="px-7 py-5 font-medium text-[#6b7280]">
                                                <p className="font-bold text-[#111]">{formatAdminDate(lead.createdAt)}</p>
                                                <p className="mt-2 text-xs">Updated {formatAdminDate(lead.updatedAt)}</p>
                                            </td>
                                            <td className="px-7 py-5">
                                                <p className="font-bold text-[#111]">{lead.name || 'Unknown lead'}</p>
                                                <p className="mt-1 text-sm font-medium text-[#374151]">{lead.phone || 'No phone'}</p>
                                                <p className="mt-1 text-sm text-[#6b7280]">{lead.email || 'No email captured'}</p>
                                            </td>
                                            <td className="px-7 py-5">
                                                <LeadTemperaturePill lead={lead} />
                                                <p className="mt-3 text-xs font-medium text-[#6b7280]">
                                                    {lead.whatsapp?.score || 0} meaningful selections
                                                </p>
                                            </td>
                                            <td className="px-7 py-5">
                                                <span className="inline-flex items-center gap-2 rounded-2xl border border-[#111]/10 bg-[#fafafa] px-4 py-2 text-xs font-bold text-[#111]">
                                                    <MessageSquare className="h-4 w-4" />
                                                    {CHANNEL_LABELS[lead.channel] || lead.channel}
                                                </span>
                                                <p className="mt-3 text-xs font-medium uppercase tracking-[0.08em] text-[#6b7280]">
                                                    {lead.source || 'website'}
                                                </p>
                                            </td>
                                            <td className="px-7 py-5">
                                                <p className="font-bold text-[#111]">{lead.requestLabel || 'General Enquiry'}</p>
                                                <p className="mt-2 text-sm leading-6 text-[#4b5563]">
                                                    {lead.message || 'No message provided.'}
                                                </p>
                                                {lead.preferredTime ? (
                                                    <p className="mt-2 text-xs font-bold text-[#6b7280]">
                                                        Preferred time: {lead.preferredTime}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-7 py-5">
                                                <div className="flex flex-wrap gap-2">
                                                    {lead.whatsapp?.callbackRequested ? <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700"><PhoneCall className="h-3 w-3" /> Callback</span> : null}
                                                    {lead.whatsapp?.siteVisitRequested ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><CalendarCheck2 className="h-3 w-3" /> Site visit</span> : null}
                                                </div>
                                                <button type="button" onClick={() => setSelectedLead(lead)} className="mt-3 text-sm font-bold text-[#111] underline decoration-[#111]/25 underline-offset-4">
                                                    View lead activity
                                                </button>
                                            </td>
                                            <td className="px-7 py-5">
                                                <div className="grid gap-2">
                                                    <DeliveryPill label="Email" state={lead.emailDelivery} />
                                                    <DeliveryPill label="WhatsApp" state={lead.whatsappDelivery} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    ) : (
                    <>
                    <section ref={dashboardRef} className="scroll-mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard label="Total Flats" value={stats.total} helper="Live MongoDB inventory" icon={Building2} />
                        <KpiCard label="Available" value={stats.available} helper="Ready for sale" icon={CheckCircle2} />
                        <KpiCard label="Reserved" value={stats.byStatus.reserved} helper="Temporarily held" icon={ShieldCheck} />
                        <KpiCard label="Sold Out" value={stats.byStatus['sold out']} helper="Closed units" icon={Home} />
                    </section>

                    <section ref={reportsRef} className="mt-7 scroll-mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
                        <div className="rounded-[24px] border border-[#111]/10 bg-white p-4 shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)] sm:rounded-[30px] sm:p-6">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Overview</p>
                                    <h2 className="mt-1 font-display text-2xl font-bold text-[#111]">Inventory Analytics</h2>
                                </div>
                                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#111]/10 bg-[#f7f7f7] text-[#111]">
                                    <BarChart3 className="h-5 w-5" />
                                </span>
                            </div>

                            <div className="grid gap-5 2xl:grid-cols-2">
                                <PremiumPieChart
                                    title="Status Mix"
                                    subtitle="By status"
                                    entries={statusEntries}
                                    total={stats.total}
                                />
                                <PremiumPieChart
                                    title="Unit Types"
                                    subtitle="By configuration"
                                    entries={typeEntries}
                                    total={stats.total}
                                />
                            </div>
                        </div>

                        <aside ref={keysRef} className="scroll-mt-8 rounded-[24px] border border-[#111]/10 bg-white p-4 shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)] sm:rounded-[30px] sm:p-6">
                            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Super Admin Tools</p>
                            <h2 className="mt-1 font-display text-2xl font-bold text-[#111]">Signup Keys</h2>
                            {isSuperAdmin ? (
                                <div className="mt-6 space-y-4">
                                    <SelectControl
                                        value={keyRole}
                                        onChange={setKeyRole}
                                        options={PARTNER_KEY_OPTIONS}
                                    />
                                    <button
                                        type="button"
                                        onClick={createSignupKey}
                                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111] text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_18px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        <KeyRound className="h-4 w-4" />
                                        Create Key
                                    </button>
                                    {latestKey ? (
                                        <button
                                            type="button"
                                            onClick={() => navigator.clipboard?.writeText(latestKey)}
                                            className="flex w-full items-center gap-2 rounded-2xl border border-[#111]/10 bg-[#fafafa] px-4 py-4 text-left text-xs font-bold text-[#374151]"
                                        >
                                            <Copy className="h-4 w-4 shrink-0 text-[#111]" />
                                            <span className="min-w-0 break-all">{latestKey}</span>
                                        </button>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="mt-5 text-sm leading-6 text-[#6b7280]">
                                    Only a Super Admin can generate signup keys. Your current access is {ROLE_LABELS[user.role]}.
                                </p>
                            )}
                        </aside>
                    </section>

                    <section ref={inventoryRef} className="mt-7 scroll-mt-8 overflow-hidden rounded-[24px] border border-[#111]/10 bg-white shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)] sm:rounded-[30px]">
                        <div className="flex flex-col gap-5 border-b border-[#111]/10 px-4 py-5 sm:px-7 sm:py-6 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Inventory Control</p>
                                <h2 className="mt-1 font-display text-2xl font-bold text-[#111]">Flat Status Management</h2>
                            </div>
                            <div className="relative w-full xl:w-[420px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search flat, floor, type, status..."
                                    className="h-12 w-full rounded-2xl border border-[#111]/14 bg-white pl-10 pr-4 text-sm font-medium text-[#111] outline-none shadow-[0_7px_0_rgba(17,17,17,0.035),0_16px_32px_rgba(17,17,17,0.05)] transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 xl:hidden">
                            {visibleFlats.length ? (
                                visibleFlats.map((flat) => (
                                    <article key={flat.flat} className="rounded-[24px] border border-[#111]/10 bg-[#fafafa] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Flat</p>
                                                <h3 className="mt-2 text-xl font-bold tracking-[0.06em] text-[#111]">{flat.flat}</h3>
                                                <p className="mt-1 text-sm font-bold text-[#374151]">{flat.type}</p>
                                            </div>
                                            {!canWrite ? (
                                                <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#111]/10 bg-white px-4 py-2 text-sm font-bold capitalize text-[#374151]">
                                                    <CheckCircle2 className="h-4 w-4 text-[#111]" />
                                                    {normalizeStatus(flat.status)}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                            <div className="rounded-2xl border border-[#111]/10 bg-white px-3 py-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Floor</p>
                                                <p className="mt-1 font-bold text-[#111]">{flat.floor}</p>
                                            </div>
                                            <div className="rounded-2xl border border-[#111]/10 bg-white px-3 py-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Facing</p>
                                                <p className="mt-1 font-bold capitalize text-[#111]">{flat.facing}</p>
                                            </div>
                                            <div className="rounded-2xl border border-[#111]/10 bg-white px-3 py-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Area</p>
                                                <p className="mt-1 font-bold text-[#111]">{flat.area} sqft</p>
                                            </div>
                                            <div className="rounded-2xl border border-[#111]/10 bg-white px-3 py-3">
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Balconies</p>
                                                <p className="mt-1 font-bold text-[#111]">{flat.balconies}</p>
                                            </div>
                                        </div>

                                        {canWrite ? (
                                            <div className="mt-4">
                                                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Status</p>
                                                <SelectControl
                                                    value={normalizeStatus(flat.status)}
                                                    disabled={busyFlat === flat.flat}
                                                    onChange={(status) => updateStatus(flat.flat, status)}
                                                    options={STATUS_OPTIONS.map((status) => ({
                                                        value: status,
                                                        label: status,
                                                    }))}
                                                />
                                            </div>
                                        ) : null}
                                    </article>
                                ))
                            ) : (
                                <div className="col-span-full py-6 text-center text-sm font-medium text-[#6b7280]">
                                    No flats match your current search.
                                </div>
                            )}
                        </div>

                        <div className="hidden max-h-[560px] overflow-auto xl:block">
                            <table className="w-full min-w-[920px] border-collapse text-left">
                                <thead className="sticky top-0 z-10 bg-[#f7f7f7] text-xs uppercase tracking-[0.1em] text-[#6b7280]">
                                    <tr>
                                        <th className="px-7 py-5 font-bold">Flat</th>
                                        <th className="px-7 py-5 font-bold">Type</th>
                                        <th className="px-7 py-5 font-bold">Floor</th>
                                        <th className="px-7 py-5 font-bold">Facing</th>
                                        <th className="px-7 py-5 font-bold">Area</th>
                                        <th className="px-7 py-5 font-bold">Balconies</th>
                                        <th className="px-7 py-5 font-bold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#111]/10 text-sm">
                                    {visibleFlats.map((flat) => (
                                        <tr key={flat.flat} className="transition hover:bg-[#fafafa]">
                                            <td className="px-7 py-5 font-bold tracking-[0.08em] text-[#111]">{flat.flat}</td>
                                            <td className="px-7 py-5 font-bold text-[#374151]">{flat.type}</td>
                                            <td className="px-7 py-5 font-medium text-[#6b7280]">{flat.floor}</td>
                                            <td className="px-7 py-5 font-medium capitalize text-[#6b7280]">{flat.facing}</td>
                                            <td className="px-7 py-5 font-medium text-[#6b7280]">{flat.area} sqft</td>
                                            <td className="px-7 py-5 font-medium text-[#6b7280]">{flat.balconies}</td>
                                            <td className="px-7 py-5">
                                                {canWrite ? (
                                                    <SelectControl
                                                        value={normalizeStatus(flat.status)}
                                                        disabled={busyFlat === flat.flat}
                                                        onChange={(status) => updateStatus(flat.flat, status)}
                                                        options={STATUS_OPTIONS.map((status) => ({
                                                            value: status,
                                                            label: status,
                                                        }))}
                                                        className="w-[152px]"
                                                    />
                                                ) : (
                                                    <span className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#111]/10 bg-[#fafafa] px-4 text-sm font-bold capitalize text-[#374151]">
                                                        <CheckCircle2 className="h-4 w-4 text-[#111]" />
                                                        {normalizeStatus(flat.status)}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    </>
                    )}
                </div>
            </section>
            <LeadActivityPanel
                lead={selectedLead}
                canWrite={canWrite}
                onClose={() => setSelectedLead(null)}
                onRemarkSaved={handleRemarkSaved}
            />
        </main>
    );
}
