'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    BarChart3,
    Building2,
    CheckCircle2,
    Copy,
    Home,
    KeyRound,
    LayoutDashboard,
    LogOut,
    RefreshCcw,
    Search,
    ShieldCheck,
    UserPlus,
    UsersRound,
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
        <main className="font-display fixed inset-0 z-[999] grid min-h-screen bg-[#f4f4f2] text-[#111] lg:grid-cols-[520px_1fr]">
            <section className="flex min-h-screen flex-col justify-between bg-[#fbfbfa] px-8 py-8 shadow-[12px_0_40px_rgba(17,17,17,0.06)]">
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

                    <div className="mt-16 max-w-sm">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                            Secure dashboard
                        </p>
                        <h1 className="mt-4 text-4xl font-bold leading-tight text-[#111]">
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

            <section className="flex items-center justify-center px-6 py-10">
                <form
                    onSubmit={submit}
                    className="w-full max-w-md rounded-3xl border border-[#111]/10 bg-white p-7 shadow-[0_12px_0_rgba(17,17,17,0.04),0_24px_70px_rgba(17,17,17,0.08)]"
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
        <article className="group relative overflow-hidden rounded-[26px] border border-[#111]/10 bg-white p-6 shadow-[0_18px_0_rgba(17,17,17,0.04),0_28px_60px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white" />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#6b7280]">{label}</p>
                    <p className="mt-4 font-display text-[2.55rem] font-bold leading-none tracking-tight text-[#111]">{value}</p>
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
        <div className="rounded-[26px] border border-[#111]/10 bg-white p-5 shadow-[0_16px_0_rgba(17,17,17,0.035),0_26px_54px_rgba(17,17,17,0.07)]">
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
                <div className="h-[240px] min-w-0">
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

export default function AdminPage() {
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(true);
    const [flats, setFlats] = useState([]);
    const [busyFlat, setBusyFlat] = useState('');
    const [keyRole, setKeyRole] = useState('channel_partner');
    const [latestKey, setLatestKey] = useState('');
    const [notice, setNotice] = useState('');
    const [query, setQuery] = useState('');
    const [activeSection, setActiveSection] = useState('dashboard');
    const contentRef = useRef(null);
    const dashboardRef = useRef(null);
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

        void loadFlats();
        const intervalId = window.setInterval(loadFlats, 30000);
        return () => window.clearInterval(intervalId);
    }, [user]);

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

    function goToSection(section) {
        const sectionRefs = {
            dashboard: dashboardRef,
            inventory: inventoryRef,
            users: keysRef,
            keys: keysRef,
            reports: reportsRef,
        };
        setActiveSection(section);
        sectionRefs[section]?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
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
        setUser(null);
        setFlats([]);
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
            <aside className="hidden w-[292px] shrink-0 border-r border-[#111]/10 bg-[#fbfbfa] shadow-[18px_0_55px_rgba(17,17,17,0.06)] lg:flex lg:flex-col">
                <div className="flex h-24 items-center gap-3 border-b border-[#111]/10 px-7">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111] text-white shadow-[0_10px_0_rgba(17,17,17,0.12),0_22px_32px_rgba(17,17,17,0.18)]">
                        <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="font-display text-lg font-bold text-[#111]">Aadhya Admin</p>
                        <p className="text-xs font-bold text-[#6b7280]">Serene inventory</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 px-5 py-7">
                    {[
                        [LayoutDashboard, 'Dashboard', 'dashboard'],
                        [Home, 'Inventory', 'inventory'],
                        [UsersRound, 'RBAC Users', 'users'],
                        [KeyRound, 'Signup Keys', 'keys'],
                        [BarChart3, 'Reports', 'reports'],
                    ].map(([Icon, label, section]) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => goToSection(section)}
                            className={`flex h-12 w-full items-center gap-3 rounded-2xl px-4 text-sm font-bold transition ${
                                activeSection === section || (section === 'users' && activeSection === 'keys')
                                    ? 'bg-[#111] text-white shadow-[0_8px_0_rgba(17,17,17,0.08),0_18px_32px_rgba(17,17,17,0.16)]'
                                    : 'text-[#6b7280] hover:bg-white hover:text-[#111] hover:shadow-[0_10px_24px_rgba(17,17,17,0.07)]'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="border-t border-[#111]/10 p-5">
                    <div className="rounded-[24px] border border-[#111]/10 bg-white p-4 shadow-[0_10px_0_rgba(17,17,17,0.035),inset_0_1px_0_rgba(255,255,255,1)]">
                        <p className="text-sm font-bold text-[#111]">{user.name}</p>
                        <p className="mt-1 text-xs font-medium text-[#6b7280]">{ROLE_LABELS[user.role]}</p>
                    </div>
                </div>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-24 shrink-0 items-center justify-between gap-4 border-b border-[#111]/10 bg-[#fbfbfa] px-6 shadow-[0_14px_40px_rgba(17,17,17,0.05)] lg:px-9">
                    <div className="min-w-0">
                        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Inventory dashboard</p>
                        <h1 className="mt-1 truncate font-display text-3xl font-bold tracking-tight text-[#111]">
                            Welcome back, {user.name}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={loadFlats}
                            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#111]/10 bg-white px-4 text-sm font-bold text-[#111] shadow-[0_7px_0_rgba(17,17,17,0.04),0_16px_32px_rgba(17,17,17,0.06)] transition hover:-translate-y-0.5"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#111] px-5 text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_18px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </div>
                </header>

                <div ref={contentRef} className="min-h-0 flex-1 scroll-smooth overflow-auto px-6 py-7 lg:px-9">
                    {notice ? (
                        <p className="mb-6 rounded-2xl border border-[#111]/10 bg-white px-5 py-3 text-sm font-bold text-[#111] shadow-[0_12px_28px_rgba(17,17,17,0.08)]">
                            {notice}
                        </p>
                    ) : null}

                    <section ref={dashboardRef} className="scroll-mt-8 grid gap-5 xl:grid-cols-4">
                        <KpiCard label="Total Flats" value={stats.total} helper="Live MongoDB inventory" icon={Building2} />
                        <KpiCard label="Available" value={stats.available} helper="Ready for sale" icon={CheckCircle2} />
                        <KpiCard label="Reserved" value={stats.byStatus.reserved} helper="Temporarily held" icon={ShieldCheck} />
                        <KpiCard label="Sold Out" value={stats.byStatus['sold out']} helper="Closed units" icon={Home} />
                    </section>

                    <section ref={reportsRef} className="mt-7 scroll-mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
                        <div className="rounded-[30px] border border-[#111]/10 bg-white p-6 shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)]">
                            <div className="mb-6 flex items-center justify-between">
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

                        <aside ref={keysRef} className="scroll-mt-8 rounded-[30px] border border-[#111]/10 bg-white p-6 shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)]">
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

                    <section ref={inventoryRef} className="mt-7 scroll-mt-8 overflow-hidden rounded-[30px] border border-[#111]/10 bg-white shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)]">
                        <div className="flex flex-col gap-5 border-b border-[#111]/10 px-7 py-6 xl:flex-row xl:items-center xl:justify-between">
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

                        <div className="max-h-[560px] overflow-auto">
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
                </div>
            </section>
        </main>
    );
}
