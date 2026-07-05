'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    BarChart3,
    Building2,
    CheckCircle2,
    Copy,
    Download,
    Home,
    KeyRound,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageSquare,
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

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    manager: 'Manager',
    channel_partner: 'Channel Partner',
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

function AdminSidebar({ user, activeSection, onNavigate, onClose = null, className = '' }) {
    return (
        <aside className={className}>
            <div className="flex h-20 items-center justify-between gap-3 border-b border-[#111]/10 px-5 sm:h-24 sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#111] text-white shadow-[0_10px_0_rgba(17,17,17,0.12),0_22px_32px_rgba(17,17,17,0.18)]">
                        <Building2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-display text-base font-bold text-[#111] sm:text-lg">Aadhya Admin</p>
                        <p className="text-xs font-bold text-[#6b7280]">Serene inventory</p>
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
                {ADMIN_NAV_ITEMS.map(({ icon: Icon, label, section }) => (
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
                        <input
                            type="password"
                            value={form.password}
                            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                            placeholder="Password"
                            className="h-12 w-full rounded-xl border border-[#111]/14 bg-white px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                        />
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
    const tone =
        status === 'sent'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : status === 'failed'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-[#111]/10 bg-[#fafafa] text-[#6b7280]';

    return (
        <div className={`rounded-2xl border px-3 py-2 text-xs font-bold ${tone}`}>
            <p>{label}: {status}</p>
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

    async function loadFlats() {
        const response = await fetch('/api/admin/flats', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        setFlats(Array.isArray(payload.flats) ? payload.flats : []);
    }

    async function loadLeads() {
        const response = await fetch('/api/admin/leads', { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        setLeads(Array.isArray(payload.leads) ? payload.leads : []);
    }

    async function refreshAll() {
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
    }, [user]);

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

                if (lead.emailDelivery?.status === 'sent') {
                    acc.emailSent += 1;
                }

                if (lead.whatsappDelivery?.status === 'sent') {
                    acc.whatsappSent += 1;
                }

                return acc;
            },
            {
                total: 0,
                contact_form: 0,
                whatsapp_form: 0,
                emailSent: 0,
                whatsappSent: 0,
            },
        );
    }, [leads]);

    const visibleLeads = useMemo(() => {
        const normalizedQuery = leadQuery.trim().toLowerCase();
        if (!normalizedQuery) return leads;

        return leads.filter((lead) =>
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
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery),
        );
    }, [leadQuery, leads]);

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
            title: 'Website and WhatsApp Leads',
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
        const response = await fetch('/api/admin/signup-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: keyRole }),
        });
        const payload = await response.json();

        if (response.ok) {
            setLatestKey(payload.key.key);
            await navigator.clipboard?.writeText(payload.key.key).catch(() => {});
        } else {
            setNotice(payload.error || 'Unable to create signup key.');
        }
    }

    async function logout() {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        setSidebarOpen(false);
        setUser(null);
        setFlats([]);
        setLeads([]);
    }

    function downloadLeadCsv() {
        window.location.assign('/api/admin/leads/export');
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
        <main className="font-display fixed inset-0 z-[999] flex min-h-screen overflow-hidden bg-[#f4f4f2] text-[#111]">
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
                className="hidden w-[292px] shrink-0 border-r border-[#111]/10 bg-[#fbfbfa] shadow-[18px_0_55px_rgba(17,17,17,0.06)] lg:flex lg:flex-col"
            />

            <AdminSidebar
                user={user}
                activeSection={activeSection}
                onNavigate={goToSection}
                onClose={() => setSidebarOpen(false)}
                className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,292px)] flex-col border-r border-[#111]/10 bg-[#fbfbfa] shadow-[18px_0_55px_rgba(17,17,17,0.14)] transition-transform duration-300 lg:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            />

            <section className="flex min-w-0 flex-1 flex-col">
                <header className="flex min-h-[88px] shrink-0 flex-wrap items-start justify-between gap-4 border-b border-[#111]/10 bg-[#fbfbfa] px-4 py-4 shadow-[0_14px_40px_rgba(17,17,17,0.05)] sm:px-6 lg:h-24 lg:flex-nowrap lg:items-center lg:px-9">
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

                <div ref={contentRef} className="min-h-0 flex-1 scroll-smooth overflow-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-9 lg:py-7">
                    {notice ? (
                        <p className="mb-5 rounded-2xl border border-[#111]/10 bg-white px-4 py-3 text-sm font-bold text-[#111] shadow-[0_12px_28px_rgba(17,17,17,0.08)] sm:mb-6 sm:px-5">
                            {notice}
                        </p>
                    ) : null}

                    {activeSection === 'leads' ? (
                    <section ref={leadsRef} className="scroll-mt-8 overflow-hidden rounded-[24px] border border-[#111]/10 bg-white shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)] sm:rounded-[30px]">
                        <div className="flex flex-col gap-5 border-b border-[#111]/10 px-4 py-5 sm:px-7 sm:py-6">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div>
                                    <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Lead Management</p>
                                    <h2 className="mt-1 font-display text-2xl font-bold text-[#111]">Website and WhatsApp Leads</h2>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7280]">
                                        Every new website enquiry and WhatsApp lead now lands in MongoDB and can be exported as CSV.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={downloadLeadCsv}
                                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#111] px-5 text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_18px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
                                >
                                    <Download className="h-4 w-4" />
                                    Download CSV
                                </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-[24px] border border-[#111]/10 bg-[#fafafa] px-5 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">Total Leads</p>
                                    <p className="mt-3 text-3xl font-bold text-[#111]">{leadStats.total}</p>
                                </div>
                                <div className="rounded-[24px] border border-[#111]/10 bg-[#fafafa] px-5 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">Website Forms</p>
                                    <p className="mt-3 text-3xl font-bold text-[#111]">{leadStats.contact_form}</p>
                                </div>
                                <div className="rounded-[24px] border border-[#111]/10 bg-[#fafafa] px-5 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">WhatsApp Leads</p>
                                    <p className="mt-3 text-3xl font-bold text-[#111]">{leadStats.whatsapp_form}</p>
                                </div>
                                <div className="rounded-[24px] border border-[#111]/10 bg-[#fafafa] px-5 py-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">Messages Sent</p>
                                    <p className="mt-3 text-3xl font-bold text-[#111]">{leadStats.emailSent + leadStats.whatsappSent}</p>
                                </div>
                            </div>

                            <div className="relative w-full xl:w-[460px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                                <input
                                    value={leadQuery}
                                    onChange={(event) => setLeadQuery(event.target.value)}
                                    placeholder="Search by name, phone, email, source, request..."
                                    className="h-12 w-full rounded-2xl border border-[#111]/14 bg-white pl-10 pr-4 text-sm font-medium text-[#111] outline-none shadow-[0_7px_0_rgba(17,17,17,0.035),0_16px_32px_rgba(17,17,17,0.05)] transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                />
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
                                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Journey</p>
                                                <p className="mt-2 text-sm leading-6 text-[#374151]">{getLeadJourneySummary(lead)}</p>
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
                                    No leads match your current search.
                                </div>
                            )}
                        </div>

                        <div className="hidden max-h-[620px] overflow-auto xl:block">
                            <table className="w-full min-w-[1320px] border-collapse text-left">
                                <thead className="sticky top-0 z-10 bg-[#f7f7f7] text-xs uppercase tracking-[0.1em] text-[#6b7280]">
                                    <tr>
                                        <th className="px-7 py-5 font-bold">Submitted</th>
                                        <th className="px-7 py-5 font-bold">Lead</th>
                                        <th className="px-7 py-5 font-bold">Channel</th>
                                        <th className="px-7 py-5 font-bold">Request</th>
                                        <th className="px-7 py-5 font-bold">Journey</th>
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
                                                <p className="text-sm font-medium leading-6 text-[#374151]">
                                                    {getLeadJourneySummary(lead)}
                                                </p>
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
                                        options={Object.entries(ROLE_LABELS).map(([role, label]) => ({
                                            value: role,
                                            label,
                                        }))}
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
        </main>
    );
}
