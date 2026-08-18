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
    CALL_LOG_BUDGET_OPTIONS,
    CALL_LOG_CONFIGURATION_OPTIONS,
    CALL_LOG_LOCATION_CHOICE_MENTIONED,
    CALL_LOG_LOCATION_CHOICE_OPTIONS,
    CALL_LOG_REQUIREMENT_NOT_MENTIONED,
    CALL_LOG_REMARK_MAX_LENGTH,
    CALL_LOG_STATUS_OPTIONS,
    getCallLogFieldErrors,
} from '@/lib/admin-call-log';
import {
    getWhatsAppDeliveryStatusLabel,
    getWhatsAppMetaErrorCopy,
    isWhatsAppDeliverySuccessStatus,
} from '@/lib/whatsapp-delivery';
import {
    getSalesLeadStatus,
    SALES_LEAD_STATUS_COLD,
    SALES_LEAD_STATUS_DEAD,
    SALES_LEAD_STATUS_OPTIONS,
} from '@/lib/lead-status';

const ROLE_LABELS = {
    super_admin: 'Super Admin',
    manager: 'Manager',
    sales_executive: 'Sales Executive',
    channel_partner: 'Channel Partner',
    lead_partner: 'Lead Partner',
};

const PARTNER_KEY_OPTIONS = [
    { value: 'super_admin', label: 'Super Admin', role: 'super_admin' },
    { value: 'manager', label: 'Manager', role: 'manager' },
    { value: 'sales_executive', label: 'Sales Executive', role: 'sales_executive' },
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
    cold: { label: 'Cold', description: 'Fresh follow-up needed', className: 'border-slate-200 bg-slate-50 text-slate-700' },
    warm: { label: 'Warm', description: 'Interested lead', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    hot: { label: 'Hot', description: 'High-priority lead', className: 'border-red-200 bg-red-50 text-red-700' },
};

const LEAD_FILTERS = {
    ...LEAD_TEMPERATURES,
    dead: {
        label: 'Dead',
        description: 'Dead leads',
        className: 'border-red-500 bg-red-500 text-white',
    },
};

const CALL_STATUS_LABELS = {
    answered: 'Answered',
    not_answered: 'Not answered',
};

const ADMIN_NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard', section: 'dashboard' },
    { icon: MessageSquare, label: 'Leads', section: 'leads' },
    { icon: PhoneCall, label: 'Calls', section: 'calls' },
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

function formatAdminDateOnly(value) {
    if (!value) return 'Not available';

    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeZone: 'Asia/Kolkata',
    }).format(new Date(`${value}T00:00:00`));
}

function getTodayDateInputValue() {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
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
    return getSalesLeadStatus(lead);
}

function getLeadFilterKey(lead) {
    return getLeadTemperature(lead);
}

function getVisibleLeadsForFilter(leads, filterKey) {
    return leads.filter((lead) => getLeadFilterKey(lead) === filterKey);
}

function getLeadFilterButtonClasses(activeFilter, filterKey) {
    if (filterKey === SALES_LEAD_STATUS_DEAD) {
        return activeFilter === filterKey
            ? 'bg-[#b42318] text-white shadow-[0_8px_18px_rgba(180,35,24,0.25)]'
            : 'bg-[#b42318] text-white/90 hover:text-white';
    }

    return activeFilter === filterKey
        ? 'bg-white text-[#111] shadow-[0_8px_18px_rgba(17,17,17,0.08)]'
        : 'text-[#6b7280] hover:text-[#111]';
}

function getLeadSources(lead) {
    return Array.isArray(lead?.sources) && lead.sources.length
        ? lead.sources
        : [lead?.source].filter(Boolean);
}

function getLeadAliases(lead) {
    const names = Array.isArray(lead?.names) ? lead.names : [];
    return names.filter((name) => name && name !== lead?.name);
}

function getLeadSubmissionCount(lead) {
    return Array.isArray(lead?.submissions) && lead.submissions.length ? lead.submissions.length : 1;
}

function getLeadSourceSummary(lead) {
    const sources = getLeadSources(lead);
    return sources.length ? sources.join(', ') : lead?.source || 'website';
}

function getLeadChannelSummary(lead) {
    const channels = Array.isArray(lead?.channels) && lead.channels.length
        ? lead.channels
        : [lead?.channel].filter(Boolean);
    return channels;
}

function LeadTemperaturePill({ lead }) {
    const temperature = getLeadTemperature(lead);
    const meta = LEAD_FILTERS[temperature] || LEAD_TEMPERATURES.cold;

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${meta.className}`}>
            {meta.label}
        </span>
    );
}

function createEmptyCallLogForm(currentStatus = SALES_LEAD_STATUS_COLD) {
    return {
        callDate: getTodayDateInputValue(),
        callStatus: '',
        leadStatus: currentStatus,
        remark: '',
        sharedRequirements: false,
        budget: CALL_LOG_REQUIREMENT_NOT_MENTIONED,
        configuration: CALL_LOG_REQUIREMENT_NOT_MENTIONED,
        locationChoice: CALL_LOG_REQUIREMENT_NOT_MENTIONED,
        location: '',
    };
}

function getSortedCallLogs(callLogs) {
    return [...(Array.isArray(callLogs) ? callLogs : [])].sort((left, right) => {
        const dateComparison = (right.callDate || '').localeCompare(left.callDate || '');
        if (dateComparison !== 0) {
            return dateComparison;
        }

        return new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime();
    });
}

const CALL_REPORT_COLUMNS = [
    { header: 'Submitted At', key: 'submittedAt', width: 18 },
    { header: 'Lead Segment', key: 'leadSegment', width: 14 },
    { header: 'Lead Name', key: 'leadName', width: 22 },
    { header: 'Assigned Sales Executive', key: 'assignedSalesExecutive', width: 24 },
    { header: 'Assignment Status', key: 'assignmentStatus', width: 16 },
    { header: 'Phone', key: 'phone', width: 17 },
    { header: 'Source', key: 'source', width: 18 },
    { header: 'Channel', key: 'channel', width: 17 },
    { header: 'Request', key: 'request', width: 20 },
    { header: 'Lead Context', key: 'leadContext', width: 34 },
    { header: 'Call #', key: 'callNumber', width: 8 },
    { header: 'Call Date', key: 'callDate', width: 14 },
    { header: 'Call Status', key: 'callStatus', width: 14 },
    { header: 'Call Remark', key: 'callRemark', width: 38 },
    { header: 'Calling Feedback', key: 'callingFeedback', width: 42 },
];

const LEAD_REPORT_COLUMNS = [
    { header: 'Submitted At', key: 'submittedAt', width: 18 },
    { header: 'Updated At', key: 'updatedAt', width: 18 },
    { header: 'Lead Segment', key: 'leadSegment', width: 14 },
    { header: 'Lead Name', key: 'leadName', width: 22 },
    { header: 'Assigned Sales Executive', key: 'assignedSalesExecutive', width: 24 },
    { header: 'Assignment Status', key: 'assignmentStatus', width: 16 },
    { header: 'Aliases', key: 'aliases', width: 22 },
    { header: 'Phone', key: 'phone', width: 17 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Source', key: 'source', width: 18 },
    { header: 'Channel', key: 'channel', width: 17 },
    { header: 'Request', key: 'request', width: 20 },
    { header: 'Lead Context', key: 'leadContext', width: 40 },
    { header: 'WhatsApp Signals', key: 'whatsAppSignals', width: 32 },
    { header: 'Delivery Status', key: 'deliveryStatus', width: 30 },
    { header: 'Calling Feedback', key: 'callingFeedback', width: 40 },
    { header: 'Submissions', key: 'submissionCount', width: 12 },
];

function formatExportDateTime(value) {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
    }).format(date);
}

function escapeCsv(value) {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
}

function buildCsvRow(values) {
    return values.map(escapeCsv).join(',');
}

function buildLeadContextForExport(lead) {
    return [
        lead.preferredTime ? `Preferred time: ${lead.preferredTime}` : '',
        lead.message ? `Lead message: ${lead.message}` : '',
        getLeadJourneySummary(lead) ? `Journey: ${getLeadJourneySummary(lead)}` : '',
    ].filter(Boolean).join('\n');
}

function getAssignedSalesExecutiveLabel(lead) {
    return lead?.assignedSalesExecutiveName || 'Unassigned';
}

function getAssignmentStatusLabel(lead) {
    return lead?.assignmentStatus === 'assigned' ? 'Assigned' : 'Unassigned';
}

function formatSharedRequirementValue(value) {
    if (!value) return '';
    return value === CALL_LOG_REQUIREMENT_NOT_MENTIONED ? 'Not mentioned' : value;
}

function buildCallFeedbackSummary(callLog) {
    if (!callLog?.sharedRequirements) {
        return 'No calling feedback added yet';
    }

    const lines = [
        callLog.configuration ? `Configuration: ${formatSharedRequirementValue(callLog.configuration)}` : '',
        callLog.budget ? `Budget: ${formatSharedRequirementValue(callLog.budget)}` : '',
        callLog.location ? `Location: ${formatSharedRequirementValue(callLog.location)}` : '',
        callLog.authorName ? `Saved by: ${callLog.authorName}` : '',
        callLog.createdAt ? `Saved at: ${formatExportDateTime(callLog.createdAt)}` : '',
    ].filter(Boolean);

    return lines.join('\n');
}

function buildLeadSignalsForExport(lead) {
    return [
        `Journey: ${getLeadJourneySummary(lead)}`,
        `Meaningful responses: ${lead.whatsapp?.score || 0}`,
        `Callback requested: ${lead.whatsapp?.callbackRequested ? 'Yes' : 'No'}`,
        `Site visit requested: ${lead.whatsapp?.siteVisitRequested ? 'Yes' : 'No'}`,
    ].filter(Boolean).join('\n');
}

function buildDeliveryStatusForExport(lead) {
    const emailStatus = lead.emailDelivery?.status || 'pending';
    const whatsappStatus = lead.whatsappDelivery?.status || 'pending';

    return [
        `Email: ${emailStatus}`,
        lead.emailDelivery?.sentAt ? `Email sent: ${formatExportDateTime(lead.emailDelivery.sentAt)}` : '',
        `WhatsApp: ${getWhatsAppDeliveryStatusLabel(whatsappStatus)}`,
        lead.whatsappDelivery?.sentAt ? `WhatsApp sent: ${formatExportDateTime(lead.whatsappDelivery.sentAt)}` : '',
    ].filter(Boolean).join('\n');
}

function buildLeadReportRows(leads) {
    return leads.map((lead) => {
        const callLogs = getSortedCallLogs(lead.callLogs);
        const latestFeedbackCall = callLogs.find((callLog) => callLog.sharedRequirements);
        const salesStatus = getLeadFilterKey(lead);

        return {
            submittedAt: formatExportDateTime(lead.createdAt),
            updatedAt: formatExportDateTime(lead.updatedAt),
            leadSegment: LEAD_FILTERS[salesStatus]?.label || salesStatus,
            leadName: lead.name || 'Unknown lead',
            assignedSalesExecutive: getAssignedSalesExecutiveLabel(lead),
            assignmentStatus: getAssignmentStatusLabel(lead),
            aliases: getLeadAliases(lead).join('\n'),
            phone: lead.phone || '',
            email: lead.email || '',
            source: getLeadSourceSummary(lead),
            channel: CHANNEL_LABELS[lead.channel] || lead.channel || '',
            request: lead.requestLabel || 'General Enquiry',
            leadContext: buildLeadContextForExport(lead),
            whatsAppSignals: buildLeadSignalsForExport(lead),
            deliveryStatus: buildDeliveryStatusForExport(lead),
            callingFeedback: buildCallFeedbackSummary(latestFeedbackCall),
            submissionCount: getLeadSubmissionCount(lead),
        };
    });
}

function buildCallReportRows(leads) {
    return leads.flatMap((lead) => {
        const callLogs = getSortedCallLogs(lead.callLogs);
        const latestCall = callLogs[0];
        const salesStatus = getLeadFilterKey(lead);
        const baseRow = {
            submittedAt: formatExportDateTime(lead.createdAt),
            leadSegment: LEAD_FILTERS[salesStatus]?.label || salesStatus,
            leadName: lead.name || 'Unknown lead',
            assignedSalesExecutive: getAssignedSalesExecutiveLabel(lead),
            assignmentStatus: getAssignmentStatusLabel(lead),
            phone: lead.phone || '',
            source: getLeadSourceSummary(lead),
            channel: CHANNEL_LABELS[lead.channel] || lead.channel || '',
            request: lead.requestLabel || 'General Enquiry',
            leadContext: buildLeadContextForExport(lead),
        };

        if (!callLogs.length) {
            return [{
                ...baseRow,
                callNumber: '',
                callDate: '',
                callStatus: 'No calls logged',
                callRemark: '',
                callingFeedback: 'No calling feedback added yet',
            }];
        }

        return callLogs.map((callLog, index) => ({
            ...baseRow,
            callNumber: index + 1,
            callDate: callLog.callDate ? formatAdminDateOnly(callLog.callDate) : '',
            callStatus: CALL_STATUS_LABELS[callLog.callStatus] || callLog.callStatus || '',
            callRemark: [
                callLog.remark || '',
                callLog.authorName ? `Saved by: ${callLog.authorName}` : '',
                callLog.createdAt ? `Saved at: ${formatExportDateTime(callLog.createdAt)}` : '',
                index === 0 && latestCall?.id === callLog.id ? `Total calls for this lead: ${callLogs.length}` : '',
            ].filter(Boolean).join('\n'),
            callingFeedback: buildCallFeedbackSummary(callLog),
        }));
    });
}

function buildCallsCsv(reportRows) {
    const header = CALL_REPORT_COLUMNS.map(({ header: label }) => label);
    const rows = reportRows.map((row) =>
        buildCsvRow(CALL_REPORT_COLUMNS.map(({ key }) => row[key] || '')),
    );

    return [buildCsvRow(header), ...rows].join('\n');
}

function buildLeadsCsv(reportRows) {
    const header = LEAD_REPORT_COLUMNS.map(({ header: label }) => label);
    const rows = reportRows.map((row) =>
        buildCsvRow(LEAD_REPORT_COLUMNS.map(({ key }) => row[key] || '')),
    );

    return [buildCsvRow(header), ...rows].join('\n');
}

function estimateWrappedLines(value, approxWidth) {
    return String(value || '')
        .split('\n')
        .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / approxWidth)), 0);
}

function getReportRowHeight(row) {
    const maxLines = Math.max(
        estimateWrappedLines(row.leadContext, 30),
        estimateWrappedLines(row.callRemark, 34),
        estimateWrappedLines(row.callingFeedback, 36),
    );

    return Math.min(Math.max(24, maxLines * 16), 112);
}

function getLeadReportRowHeight(row) {
    const maxLines = Math.max(
        estimateWrappedLines(row.aliases, 20),
        estimateWrappedLines(row.leadContext, 34),
        estimateWrappedLines(row.whatsAppSignals, 28),
        estimateWrappedLines(row.deliveryStatus, 28),
        estimateWrappedLines(row.callingFeedback, 34),
    );

    return Math.min(Math.max(24, maxLines * 16), 120);
}

function CallStatusPill({ status }) {
    const tone = status === 'answered'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-amber-200 bg-amber-50 text-amber-700';

    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold ${tone}`}>
            {CALL_STATUS_LABELS[status] || 'Unknown'}
        </span>
    );
}

function AboutLeadPanel({ lead, onClose }) {
    if (!lead) return null;

    const aliases = getLeadAliases(lead);
    const sources = getLeadSources(lead);
    const channels = getLeadChannelSummary(lead);
    const submissions = Array.isArray(lead.submissions) ? lead.submissions : [];

    return (
        <div className="fixed inset-0 z-[1000] flex justify-end bg-black/35 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="About lead">
            <button type="button" aria-label="Close lead details" onClick={onClose} className="absolute inset-0 cursor-default" />
            <aside className="editorial-detail relative flex h-full w-full max-w-2xl flex-col bg-[#fbfbfa] shadow-[-24px_0_70px_rgba(17,17,17,0.22)] sm:rounded-[30px] sm:border sm:border-[#111]/10">
                <div className="flex items-start justify-between gap-4 border-b border-[#111]/10 px-5 py-5 sm:px-7 sm:py-6">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">About lead</p>
                        <h3 className="mt-1 text-2xl font-bold text-[#111]">{lead.name || 'Unknown lead'}</h3>
                        <p className="mt-1 text-sm text-[#6b7280]">{lead.phone || 'No phone'}</p>
                        <p className="mt-1 break-words text-sm text-[#6b7280]">{lead.email || 'No email captured'}</p>
                    </div>
                    <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#111]/10 bg-white text-xl font-medium text-[#111]">×</button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-[#111]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#374151]">{getLeadSubmissionCount(lead)} submissions</span>
                        <span className="rounded-full border border-[#111]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#374151]">Latest source: {lead.source || 'website'}</span>
                        <span className="rounded-full border border-[#111]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#374151]">Latest channel: {CHANNEL_LABELS[lead.channel] || lead.channel}</span>
                    </div>

                    <section className="mt-6 rounded-[24px] border border-[#111]/10 bg-white p-4 sm:p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Assignment</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-[#111]/10 bg-[#fafafa] px-3 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Assigned to</p>
                                <p className="mt-1 font-bold text-[#111]">{getAssignedSalesExecutiveLabel(lead)}</p>
                            </div>
                            <div className="rounded-2xl border border-[#111]/10 bg-[#fafafa] px-3 py-3">
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Status</p>
                                <p className="mt-1 font-bold text-[#111]">{getAssignmentStatusLabel(lead)}</p>
                            </div>
                            {lead.assignedSalesExecutiveEmail ? (
                                <div className="rounded-2xl border border-[#111]/10 bg-[#fafafa] px-3 py-3 sm:col-span-2">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Sales executive email</p>
                                    <p className="mt-1 break-words font-bold text-[#111]">{lead.assignedSalesExecutiveEmail}</p>
                                </div>
                            ) : null}
                            {lead.assignedAt ? (
                                <div className="rounded-2xl border border-[#111]/10 bg-[#fafafa] px-3 py-3 sm:col-span-2">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Assigned at</p>
                                    <p className="mt-1 font-bold text-[#111]">{formatAdminDate(lead.assignedAt)}</p>
                                </div>
                            ) : null}
                        </div>
                    </section>

                    <section className="mt-6 rounded-[24px] border border-[#111]/10 bg-white p-4 sm:p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Past names</p>
                        {aliases.length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {aliases.map((alias) => (
                                    <span key={alias} className="rounded-full border border-[#111]/10 bg-[#fafafa] px-3 py-1.5 text-xs font-bold text-[#374151]">
                                        {alias}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-[#6b7280]">No alternate names recorded.</p>
                        )}
                    </section>

                    <section className="mt-6 rounded-[24px] border border-[#111]/10 bg-white p-4 sm:p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Sources</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {sources.map((source) => (
                                <span key={source} className="rounded-full border border-[#111]/10 bg-[#fafafa] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#374151]">
                                    {source}
                                </span>
                            ))}
                        </div>
                        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Channels</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {channels.map((channel) => (
                                <span key={channel} className="rounded-full border border-[#111]/10 bg-[#fafafa] px-3 py-1.5 text-xs font-bold text-[#374151]">
                                    {CHANNEL_LABELS[channel] || channel}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section className="mt-6 rounded-[24px] border border-[#111]/10 bg-white p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Submission history</p>
                            <span className="text-xs font-bold text-[#6b7280]">{submissions.length}</span>
                        </div>
                        {submissions.length ? (
                            <div className="mt-4 space-y-4">
                                {submissions.map((submission) => (
                                    <article key={submission.id} className="border-l-2 border-[#111]/10 pl-4">
                                        <p className="text-sm font-bold text-[#111]">{submission.requestLabel || 'General Enquiry'}</p>
                                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#6b7280]">
                                            {(CHANNEL_LABELS[submission.channel] || submission.channel)} · {submission.source || 'website'}
                                        </p>
                                        <p className="mt-2 text-sm text-[#374151]">{submission.name || 'Unknown lead'}{submission.email ? ` · ${submission.email}` : ''}</p>
                                        {submission.message ? <p className="mt-2 text-sm leading-6 text-[#4b5563]">{submission.message}</p> : null}
                                        {submission.preferredTime ? <p className="mt-2 text-xs font-bold text-[#6b7280]">Preferred time: {submission.preferredTime}</p> : null}
                                        <p className="mt-2 text-xs font-bold text-[#6b7280]">{formatAdminDate(submission.createdAt)}</p>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-[#6b7280]">No submission history recorded yet.</p>
                        )}
                    </section>
                </div>
            </aside>
        </div>
    );
}

function CallsPanel({
    leads,
    canWrite,
    onCallLogSaved,
    onOpenLeadActivity,
    onOpenLeadAbout,
}) {
    const [query, setQuery] = useState('');
    const [leadFilter, setLeadFilter] = useState('cold');

    const leadStats = useMemo(
        () =>
            leads.reduce(
                (acc, lead) => {
                    acc[getLeadFilterKey(lead)] += 1;
                    return acc;
                },
                { cold: 0, warm: 0, hot: 0, dead: 0 },
            ),
        [leads],
    );

    const visibleLeads = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const filteredLeads = getVisibleLeadsForFilter(leads, leadFilter);
        if (!normalizedQuery) {
            return filteredLeads;
        }

        return filteredLeads.filter((lead) =>
            [
                lead.name,
                ...(lead.names || []),
                lead.phone,
                lead.email,
                lead.source,
                ...(lead.sources || []),
                lead.requestLabel,
                getLeadTemperature(lead),
                lead.message,
                lead.preferredTime,
                ...(lead.submissions || []).flatMap((submission) => [
                    submission.name,
                    submission.source,
                    submission.channel,
                    submission.requestLabel,
                    submission.message,
                ]),
                ...(lead.callLogs || []).flatMap((callLog) => [
                    callLog.callDate,
                    callLog.leadStatus,
                    CALL_STATUS_LABELS[callLog.callStatus] || callLog.callStatus,
                    callLog.remark,
                    callLog.budget,
                    callLog.configuration,
                    callLog.location,
                ]),
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery),
        );
    }, [leadFilter, leads, query]);

    async function downloadVisibleCallsReport() {
        const reportRows = buildCallReportRows(visibleLeads);
        const filterLabel = LEAD_FILTERS[leadFilter]?.label || leadFilter;
        const fileDate = new Date().toISOString().slice(0, 10);

        try {
            const excelModule = await import('exceljs');
            const ExcelJS = excelModule?.default?.Workbook ? excelModule.default : excelModule;
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Calls Report', {
                views: [{ state: 'frozen', ySplit: 4 }],
            });
            const columnCount = CALL_REPORT_COLUMNS.length;
            const callStatusColumn = CALL_REPORT_COLUMNS.findIndex(({ key }) => key === 'callStatus') + 1;

            workbook.creator = 'Aadhya Serene Admin';
            workbook.created = new Date();

            worksheet.columns = CALL_REPORT_COLUMNS.map(({ key, width }) => ({ key, width }));
            worksheet.pageSetup = {
                orientation: 'landscape',
                paperSize: 9,
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                horizontalCentered: true,
                margins: {
                    left: 0.3,
                    right: 0.3,
                    top: 0.45,
                    bottom: 0.45,
                    header: 0.2,
                    footer: 0.2,
                },
            };
            worksheet.headerFooter.oddFooter = '&LAadhya Serene&CCalls Report&RPage &P of &N';

            const titleRow = worksheet.addRow(['Aadhya Serene Calls Report']);
            worksheet.mergeCells(1, 1, 1, columnCount);
            titleRow.height = 28;
            titleRow.getCell(1).font = { name: 'Aptos', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } };
            titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

            const metaRow = worksheet.addRow([
                `Segment: ${filterLabel} | Leads shown: ${visibleLeads.length} | Rows exported: ${reportRows.length} | Exported: ${formatExportDateTime(new Date().toISOString())}`,
            ]);
            worksheet.mergeCells(2, 1, 2, columnCount);
            metaRow.height = 22;
            metaRow.getCell(1).font = { name: 'Aptos', size: 10, color: { argb: 'FF374151' } };
            metaRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F4F2' } };
            metaRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

            worksheet.addRow([]);

            const headerRow = worksheet.addRow(CALL_REPORT_COLUMNS.map(({ header }) => header));
            headerRow.height = 24;
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Aptos', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                };
            });

            worksheet.autoFilter = {
                from: { row: 4, column: 1 },
                to: { row: 4, column: columnCount },
            };

            reportRows.forEach((row, index) => {
                const excelRow = worksheet.addRow(CALL_REPORT_COLUMNS.map(({ key }) => row[key] || ''));
                excelRow.height = getReportRowHeight(row);

                excelRow.eachCell((cell) => {
                    cell.font = { name: 'Aptos', size: 10, color: { argb: 'FF111827' } };
                    cell.alignment = { vertical: 'top', wrapText: true };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFFAFAFA' },
                    };
                });

                const callStatusCell = excelRow.getCell(callStatusColumn);
                if (row.callStatus === 'Answered') {
                    callStatusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE7F8EE' },
                    };
                    callStatusCell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FF166534' } };
                } else if (row.callStatus === 'Not answered') {
                    callStatusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFF4E5' },
                    };
                    callStatusCell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: 'FFB45309' } };
                } else if (row.callStatus === 'No calls logged') {
                    callStatusCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF3F4F6' },
                    };
                    callStatusCell.font = { name: 'Aptos', size: 10, italic: true, color: { argb: 'FF6B7280' } };
                }
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `aadhya-serene-calls-${leadFilter}-${fileDate}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            const csv = buildCallsCsv(reportRows);
            const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            console.error('Styled report export failed. Falling back to CSV.', error);
            link.href = url;
            link.download = `aadhya-serene-calls-${leadFilter}-${fileDate}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
    }

    return (
        <section className="rounded-[24px] border border-[#111]/10 bg-white shadow-[0_18px_0_rgba(17,17,17,0.035),0_28px_70px_rgba(17,17,17,0.08),inset_0_1px_0_rgba(255,255,255,1)] sm:rounded-[30px]">
            <div className="flex flex-col gap-5 border-b border-[#111]/10 px-4 py-5 sm:px-7 sm:py-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#6b7280]">Call tracking</p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-[#111]">Sales call logs</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6b7280]">
                        Save each call with its outcome, updated sales lead status, and any shared customer requirements.
                    </p>
                </div>
                <div className="flex w-full flex-col gap-4 xl:w-auto xl:items-end">
                    <div className="inline-flex w-full rounded-2xl border border-[#111]/10 bg-[#f7f7f7] p-1 sm:w-auto">
                        {Object.entries(LEAD_FILTERS).map(([filterKey, meta]) => (
                            <button
                                key={filterKey}
                                type="button"
                                onClick={() => setLeadFilter(filterKey)}
                                className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition sm:min-w-[138px] sm:flex-none ${getLeadFilterButtonClasses(leadFilter, filterKey)}`}
                            >
                                <span>{meta.label}</span>
                                <span className={`rounded-full px-2 py-0.5 text-xs ${filterKey === SALES_LEAD_STATUS_DEAD ? 'bg-white/20 text-white' : 'border border-[#111]/10 bg-[#fafafa] text-[#111]'}`}>{leadStats[filterKey]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full xl:w-[390px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search leads or call remarks..."
                            className="h-12 w-full rounded-2xl border border-[#111]/14 bg-white pl-10 pr-4 text-sm font-medium text-[#111] outline-none shadow-[0_7px_0_rgba(17,17,17,0.035),0_16px_32px_rgba(17,17,17,0.05)] transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            void downloadVisibleCallsReport();
                        }}
                        disabled={!visibleLeads.length}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111] px-5 text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_18px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 xl:w-auto"
                    >
                        <Download className="h-4 w-4" />
                        Download Report
                    </button>
                </div>
            </div>

            <div className="grid gap-5 p-4 sm:p-6">
                {visibleLeads.length ? (
                    visibleLeads.map((lead) => (
                        <LeadCallCard
                            key={lead.id}
                            lead={lead}
                            canWrite={canWrite}
                            onCallLogSaved={onCallLogSaved}
                            onOpenLeadActivity={onOpenLeadActivity}
                            onOpenLeadAbout={onOpenLeadAbout}
                        />
                    ))
                ) : (
                    <div className="rounded-[24px] border border-dashed border-[#111]/15 bg-[#fafafa] px-6 py-12 text-center text-sm font-medium text-[#6b7280]">
                        No {LEAD_FILTERS[leadFilter].label.toLowerCase()} leads match your current search.
                    </div>
                )}
            </div>
        </section>
    );
}

function LeadCallCard({
    lead,
    canWrite,
    onCallLogSaved,
    onOpenLeadActivity,
    onOpenLeadAbout,
}) {
    const [callForm, setCallForm] = useState(() => createEmptyCallLogForm(getLeadTemperature(lead)));
    const [callErrors, setCallErrors] = useState({});
    const [savingCall, setSavingCall] = useState(false);
    const callLogs = getSortedCallLogs(lead.callLogs);

    useEffect(() => {
        setCallForm(createEmptyCallLogForm(getLeadTemperature(lead)));
        setCallErrors({});
    }, [lead.id, lead.salesLeadStatus]);

    function updateCallField(name, value) {
        setCallForm((current) => {
            const next = { ...current, [name]: value };

            if (name === 'sharedRequirements' && !value) {
                next.budget = CALL_LOG_REQUIREMENT_NOT_MENTIONED;
                next.configuration = CALL_LOG_REQUIREMENT_NOT_MENTIONED;
                next.locationChoice = CALL_LOG_REQUIREMENT_NOT_MENTIONED;
                next.location = '';
            }

            if (name === 'locationChoice' && value !== CALL_LOG_LOCATION_CHOICE_MENTIONED) {
                next.location = '';
            }

            const allRequirementsNotMentioned = (
                next.sharedRequirements
                && next.budget === CALL_LOG_REQUIREMENT_NOT_MENTIONED
                && next.configuration === CALL_LOG_REQUIREMENT_NOT_MENTIONED
                && next.locationChoice === CALL_LOG_REQUIREMENT_NOT_MENTIONED
            );

            const shouldAutoCollapseRequirements = (
                allRequirementsNotMentioned
                && ['budget', 'configuration', 'locationChoice'].includes(name)
            );

            if (shouldAutoCollapseRequirements) {
                next.sharedRequirements = false;
                next.location = '';
            }

            return next;
        });
        setCallErrors((current) => {
            if (!current[name] && !current.form) {
                return current;
            }

            const next = { ...current };
            delete next[name];
            delete next.form;
            if (name === 'sharedRequirements') {
                delete next.budget;
                delete next.configuration;
                delete next.locationChoice;
                delete next.location;
            }
            return next;
        });
    }

    async function saveCall(event) {
        event.preventDefault();
        const fieldErrors = getCallLogFieldErrors(callForm);
        if (Object.keys(fieldErrors).length) {
            setCallErrors(fieldErrors);
            return;
        }

        setSavingCall(true);
        setCallErrors({});
        try {
            const response = await fetch(`/api/admin/leads/${lead.id}/calls`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(callForm),
            });
            const payload = await response.json();
            if (!response.ok) {
                if (payload?.fieldErrors) {
                    setCallErrors(payload.fieldErrors);
                }
                throw new Error(payload.error || 'Unable to save call log.');
            }

            onCallLogSaved(lead.id, payload.callLog);
            setCallForm(createEmptyCallLogForm(payload.salesLeadStatus || callForm.leadStatus));
        } catch (error) {
            setCallErrors((current) => ({
                ...current,
                form: error.message,
            }));
        } finally {
            setSavingCall(false);
        }
    }

    return (
        <article className="rounded-[26px] border border-[#111]/10 bg-[#fffefa] p-4 shadow-[0_12px_30px_rgba(17,17,17,0.05)] sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => onOpenLeadAbout(lead)} className="text-left text-xl font-bold text-[#111] underline decoration-[#111]/20 underline-offset-4 hover:decoration-[#111]/45">
                            {lead.name || 'Unknown lead'}
                        </button>
                        <LeadTemperaturePill lead={lead} />
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#374151]">{lead.phone || 'No phone'}</p>
                    <p className="mt-1 break-words text-sm text-[#6b7280]">{lead.email || 'No email captured'}</p>
                    <p className="mt-3 text-sm leading-6 text-[#4b5563]">
                        <span className="font-bold text-[#111]">{lead.requestLabel || 'General Enquiry'}</span>
                        {lead.message ? ` · ${lead.message}` : ''}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-[#111]/10 bg-white px-4 py-2 text-xs font-bold text-[#111]">
                        <PhoneCall className="h-4 w-4" />
                        {callLogs.length} call{callLogs.length === 1 ? '' : 's'}
                    </span>
                    {lead.whatsapp?.callbackRequested ? <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700"><PhoneCall className="h-3 w-3" /> Callback</span> : null}
                    {lead.whatsapp?.siteVisitRequested ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><CalendarCheck2 className="h-3 w-3" /> Site visit</span> : null}
                    <button
                        type="button"
                        onClick={() => onOpenLeadActivity(lead)}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#111]/10 bg-white px-4 text-sm font-bold text-[#111] shadow-[0_7px_0_rgba(17,17,17,0.04),0_16px_32px_rgba(17,17,17,0.06)] transition hover:-translate-y-0.5"
                    >
                        View lead activity
                    </button>
                </div>
            </div>

            {canWrite ? (
                <form onSubmit={saveCall} className="mt-5 rounded-[22px] border border-[#111]/10 bg-white p-4 sm:p-5">
                    <div className="grid gap-3 lg:grid-cols-3">
                        <label className="block">
                            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Call date</span>
                            <input
                                type="date"
                                value={callForm.callDate}
                                onChange={(event) => updateCallField('callDate', event.target.value)}
                                className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-[#fafafa] px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                            />
                            {callErrors.callDate ? <p className="mt-2 text-xs font-bold text-red-600">{callErrors.callDate}</p> : null}
                        </label>
                        <label className="block">
                            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Call status</span>
                            <select
                                value={callForm.callStatus}
                                onChange={(event) => updateCallField('callStatus', event.target.value)}
                                className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-[#fafafa] px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                            >
                                <option value="">Select status</option>
                                {CALL_LOG_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {CALL_STATUS_LABELS[status]}
                                    </option>
                                ))}
                            </select>
                            {callErrors.callStatus ? <p className="mt-2 text-xs font-bold text-red-600">{callErrors.callStatus}</p> : null}
                        </label>
                        <label className="block">
                            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Lead status</span>
                            <select
                                value={callForm.leadStatus}
                                onChange={(event) => updateCallField('leadStatus', event.target.value)}
                                className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-[#fafafa] px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                            >
                                {SALES_LEAD_STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                        {LEAD_FILTERS[status]?.label || status}
                                    </option>
                                ))}
                            </select>
                            {callErrors.leadStatus ? <p className="mt-2 text-xs font-bold text-red-600">{callErrors.leadStatus}</p> : null}
                        </label>
                    </div>
                    <div className="mt-4 rounded-[20px] border border-[#111]/10 bg-[#fafafa] px-4 py-4">
                        <label className="flex items-center gap-3 text-sm font-bold text-[#111]">
                            <input
                                type="checkbox"
                                checked={callForm.sharedRequirements}
                                onChange={(event) => updateCallField('sharedRequirements', event.target.checked)}
                                className="h-4 w-4 rounded border border-[#111]/20 text-[#111] focus:ring-black/10"
                            />
                            Customer shared requirements
                        </label>
                        {callForm.sharedRequirements ? (
                            <div className="mt-4 grid gap-3 lg:grid-cols-3">
                                <label className="block">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Budget</span>
                                    <select
                                        value={callForm.budget}
                                        onChange={(event) => updateCallField('budget', event.target.value)}
                                        className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-white px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    >
                                        {CALL_LOG_BUDGET_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option === CALL_LOG_REQUIREMENT_NOT_MENTIONED ? 'Not mentioned' : option}
                                            </option>
                                        ))}
                                    </select>
                                    {callErrors.budget ? <p className="mt-2 text-xs font-bold text-red-600">{callErrors.budget}</p> : null}
                                </label>
                                <label className="block">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Configuration</span>
                                    <select
                                        value={callForm.configuration}
                                        onChange={(event) => updateCallField('configuration', event.target.value)}
                                        className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-white px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    >
                                        {CALL_LOG_CONFIGURATION_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option === CALL_LOG_REQUIREMENT_NOT_MENTIONED ? 'Not mentioned' : option}
                                            </option>
                                        ))}
                                    </select>
                                    {callErrors.configuration ? <p className="mt-2 text-xs font-bold text-red-600">{callErrors.configuration}</p> : null}
                                </label>
                                <label className="block">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Location</span>
                                    <select
                                        value={callForm.locationChoice}
                                        onChange={(event) => updateCallField('locationChoice', event.target.value)}
                                        className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-white px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                    >
                                        {CALL_LOG_LOCATION_CHOICE_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option === CALL_LOG_REQUIREMENT_NOT_MENTIONED ? 'Not mentioned' : 'Mentioned below'}
                                            </option>
                                        ))}
                                    </select>
                                    {callErrors.locationChoice ? <p className="mt-2 text-xs font-bold text-red-600">{callErrors.locationChoice}</p> : null}
                                </label>
                                {callForm.locationChoice === CALL_LOG_LOCATION_CHOICE_MENTIONED ? (
                                    <label className="block lg:col-span-3">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Customer location</span>
                                        <input
                                            type="text"
                                            value={callForm.location}
                                            onChange={(event) => updateCallField('location', event.target.value)}
                                            placeholder="Enter location"
                                            className="mt-2 h-11 w-full rounded-2xl border border-[#111]/14 bg-white px-4 text-sm text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                                        />
                                        {callErrors.location ? <p className="mt-2 text-xs font-bold text-red-600">{callErrors.location}</p> : null}
                                    </label>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                    <label className="mt-3 block">
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Remark</span>
                        <textarea
                            value={callForm.remark}
                            onChange={(event) => updateCallField('remark', event.target.value)}
                            maxLength={CALL_LOG_REMARK_MAX_LENGTH}
                            rows={4}
                            placeholder="Call outcome and follow-up notes..."
                            className="mt-2 w-full resize-y rounded-2xl border border-[#111]/14 bg-[#fafafa] px-4 py-3 text-sm leading-6 text-[#111] outline-none transition focus:border-[#111]/35 focus:ring-4 focus:ring-black/5"
                        />
                        {callErrors.remark ? <p className="mt-2 text-xs font-bold text-red-600">{callErrors.remark}</p> : null}
                    </label>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {callErrors.form ? <p className="text-xs font-bold text-red-600">{callErrors.form}</p> : <span className="text-xs font-medium text-[#6b7280]">Each save updates the lead status and adds one call entry.</span>}
                        <button
                            type="submit"
                            disabled={savingCall || !callForm.callDate || !callForm.callStatus || !callForm.leadStatus || !callForm.remark.trim()}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#111] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
                        >
                            {savingCall ? 'Saving...' : 'Save call'}
                        </button>
                    </div>
                </form>
            ) : null}

            <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">Call history</p>
                    <span className="text-xs font-bold text-[#6b7280]">{callLogs.length}</span>
                </div>
                {callLogs.length ? (
                    <div className="mt-4 space-y-4">
                        {callLogs.map((callLog) => (
                            <article key={callLog.id} className="rounded-[20px] border border-[#111]/10 bg-white px-4 py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-bold text-[#111]">{formatAdminDateOnly(callLog.callDate)}</p>
                                            <LeadTemperaturePill lead={{ salesLeadStatus: callLog.leadStatus || getLeadTemperature(lead) }} />
                                        </div>
                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#374151]">{callLog.remark}</p>
                                        {callLog.sharedRequirements ? (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {callLog.budget ? <span className="rounded-full border border-[#111]/10 bg-[#fafafa] px-3 py-1 text-[11px] font-bold text-[#374151]">Budget: {formatSharedRequirementValue(callLog.budget)}</span> : null}
                                                {callLog.configuration ? <span className="rounded-full border border-[#111]/10 bg-[#fafafa] px-3 py-1 text-[11px] font-bold text-[#374151]">Config: {formatSharedRequirementValue(callLog.configuration)}</span> : null}
                                                {callLog.location ? <span className="rounded-full border border-[#111]/10 bg-[#fafafa] px-3 py-1 text-[11px] font-bold text-[#374151]">Location: {formatSharedRequirementValue(callLog.location)}</span> : null}
                                            </div>
                                        ) : null}
                                        <p className="mt-3 text-xs font-bold text-[#6b7280]">{callLog.authorName} · {formatAdminDate(callLog.createdAt)}</p>
                                    </div>
                                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                                        <CallStatusPill status={callLog.callStatus} />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="mt-3 rounded-2xl border border-dashed border-[#111]/15 bg-white px-4 py-5 text-sm text-[#6b7280]">
                        No calls logged for this lead yet.
                    </div>
                )}
            </div>
        </article>
    );
}

function LeadActivityPanel({ lead, onClose }) {
    if (!lead) return null;

    const whatsapp = lead.whatsapp || {};
    const activity = Array.isArray(lead.activity) ? lead.activity : [];

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
                        <span className="rounded-full border border-[#111]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#374151]">{whatsapp.score || 0} meaningful responses</span>
                        {whatsapp.callbackRequested ? <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"><PhoneCall className="h-3.5 w-3.5" /> Callback requested</span> : null}
                        {whatsapp.siteVisitRequested ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700"><CalendarCheck2 className="h-3.5 w-3.5" /> Site visit requested</span> : null}
                    </div>

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
        ? ADMIN_NAV_ITEMS.filter((item) => ['leads', 'calls'].includes(item.section))
        : user?.role === 'sales_executive'
            ? ADMIN_NAV_ITEMS.filter((item) => ['dashboard', 'leads', 'calls', 'inventory', 'reports'].includes(item.section))
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
                            {user?.role === 'lead_partner' ? 'Partner workspace' : 'Serene inventory'}
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
    const metaErrorCode = Number(state?.metaErrorCode || 0);
    const metaError = label === 'WhatsApp' && metaErrorCode
        ? getWhatsAppMetaErrorCopy(metaErrorCode, error)
        : null;
    const statusLabel =
        label === 'WhatsApp' ? getWhatsAppDeliveryStatusLabel(status) : status;
    const showSentAt = sentAt && sentAt !== metaStatusAt;
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
            {label === 'WhatsApp' && metaError?.code ? (
                <p className="mt-1 font-medium">Code {metaError.code}: {metaError.label}</p>
            ) : null}
            {label === 'WhatsApp' && metaStatusAt ? <p className="mt-1 font-medium">{metaStatusAt}</p> : null}
            {showSentAt ? <p className="mt-1 font-medium">{sentAt}</p> : null}
            {label === 'WhatsApp' && metaError?.detail ? <p className="mt-1 break-words font-medium">{metaError.detail}</p> : null}
            {!metaError?.detail && error ? <p className="mt-1 break-words font-medium">{error}</p> : null}
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
    const [leadTemperature, setLeadTemperature] = useState(SALES_LEAD_STATUS_COLD);
    const [leadDateRange, setLeadDateRange] = useState({ startDate: '', endDate: '' });
    const [dateFilterOpen, setDateFilterOpen] = useState(false);
    const [dateFilterDraft, setDateFilterDraft] = useState({ startDate: '', endDate: '' });
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedLeadAbout, setSelectedLeadAbout] = useState(null);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const contentRef = useRef(null);
    const dashboardRef = useRef(null);
    const leadsRef = useRef(null);
    const callsRef = useRef(null);
    const reportsRef = useRef(null);
    const keysRef = useRef(null);
    const inventoryRef = useRef(null);

    const canWrite = user && ['super_admin', 'manager', 'sales_executive'].includes(user.role);
    const canEditInventory = user && ['super_admin', 'manager'].includes(user.role);
    const isSuperAdmin = user?.role === 'super_admin';
    const isLeadPartner = user?.role === 'lead_partner';
    const isSalesExecutive = user?.role === 'sales_executive';

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
            return;
        }

        if (isSalesExecutive && ['users', 'keys'].includes(activeSection)) {
            setActiveSection('dashboard');
        }
    }, [activeSection, isLeadPartner, isSalesExecutive]);

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
                acc[getLeadFilterKey(lead)] += 1;

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
                dead: 0,
                emailSent: 0,
                whatsappSent: 0,
            },
        );
    }, [leads]);

    const visibleLeads = useMemo(() => {
        const normalizedQuery = leadQuery.trim().toLowerCase();
        const filteredLeads = getVisibleLeadsForFilter(leads, leadTemperature);
        if (!normalizedQuery) return filteredLeads;

        return filteredLeads.filter((lead) =>
            [
                lead.name,
                ...(lead.names || []),
                lead.phone,
                lead.email,
                lead.source,
                ...(lead.sources || []),
                lead.channel,
                lead.requestLabel,
                getLeadTemperature(lead),
                lead.message,
                lead.preferredTime,
                ...(lead.submissions || []).flatMap((submission) => [
                    submission.name,
                    submission.source,
                    submission.channel,
                    submission.requestLabel,
                    submission.message,
                ]),
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
        calls: {
            eyebrow: 'Sales follow-up',
            title: 'Call Tracking',
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

        if (isLeadPartner && !['leads', 'calls'].includes(section)) {
            return;
        }

        if (isSalesExecutive && ['users', 'keys'].includes(section)) {
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

        if (section === 'calls') {
            setActiveSection('calls');
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
            calls: callsRef,
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
            || PARTNER_KEY_OPTIONS.find((option) => option.value === 'channel_partner')
            || PARTNER_KEY_OPTIONS[0];
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

    function handleCallLogSaved(leadId, callLog) {
        if (!leadId || !callLog) return;

        const nextSalesLeadStatus = callLog.leadStatus || SALES_LEAD_STATUS_COLD;
        const updateLead = (lead) =>
            lead.id === leadId
                ? {
                    ...lead,
                    salesLeadStatus: nextSalesLeadStatus,
                    leadStatus: nextSalesLeadStatus === SALES_LEAD_STATUS_DEAD ? 'dead' : 'active',
                    callLogs: [...(lead.callLogs || []), callLog],
                }
                : lead;

        setSelectedLead((current) => (current && current.id === leadId ? updateLead(current) : current));
        setSelectedLeadAbout((current) => (current && current.id === leadId ? updateLead(current) : current));
        setLeads((current) => current.map(updateLead));
    }

    async function logout() {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        setSidebarOpen(false);
        setUser(null);
        setFlats([]);
        setLeads([]);
    }

    async function downloadVisibleLeadsReport() {
        const reportRows = buildLeadReportRows(visibleLeads);
        const filterLabel = LEAD_FILTERS[leadTemperature]?.label || leadTemperature;
        const fileDate = new Date().toISOString().slice(0, 10);
        const dateRangeLabel = leadDateRange.startDate || leadDateRange.endDate
            ? `${leadDateRange.startDate || 'Start'} to ${leadDateRange.endDate || 'Today'}`
            : 'All dates';

        try {
            const excelModule = await import('exceljs');
            const ExcelJS = excelModule?.default?.Workbook ? excelModule.default : excelModule;
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Leads Report', {
                views: [{ state: 'frozen', ySplit: 4 }],
            });
            const columnCount = LEAD_REPORT_COLUMNS.length;

            workbook.creator = 'Aadhya Serene Admin';
            workbook.created = new Date();

            worksheet.columns = LEAD_REPORT_COLUMNS.map(({ key, width }) => ({ key, width }));
            worksheet.pageSetup = {
                orientation: 'landscape',
                paperSize: 9,
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                horizontalCentered: true,
                margins: {
                    left: 0.3,
                    right: 0.3,
                    top: 0.45,
                    bottom: 0.45,
                    header: 0.2,
                    footer: 0.2,
                },
            };
            worksheet.headerFooter.oddFooter = '&LAadhya Serene&CLeads Report&RPage &P of &N';

            const titleRow = worksheet.addRow(['Aadhya Serene Leads Report']);
            worksheet.mergeCells(1, 1, 1, columnCount);
            titleRow.height = 28;
            titleRow.getCell(1).font = { name: 'Aptos', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
            titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111111' } };
            titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

            const metaRow = worksheet.addRow([
                `Segment: ${filterLabel} | Leads shown: ${visibleLeads.length} | Date range: ${dateRangeLabel} | Exported: ${formatExportDateTime(new Date().toISOString())}`,
            ]);
            worksheet.mergeCells(2, 1, 2, columnCount);
            metaRow.height = 22;
            metaRow.getCell(1).font = { name: 'Aptos', size: 10, color: { argb: 'FF374151' } };
            metaRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F4F2' } };
            metaRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

            worksheet.addRow([]);

            const headerRow = worksheet.addRow(LEAD_REPORT_COLUMNS.map(({ header }) => header));
            headerRow.height = 24;
            headerRow.eachCell((cell) => {
                cell.font = { name: 'Aptos', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                };
            });

            worksheet.autoFilter = {
                from: { row: 4, column: 1 },
                to: { row: 4, column: columnCount },
            };

            reportRows.forEach((row, index) => {
                const excelRow = worksheet.addRow(LEAD_REPORT_COLUMNS.map(({ key }) => row[key] || ''));
                excelRow.height = getLeadReportRowHeight(row);

                excelRow.eachCell((cell) => {
                    cell.font = { name: 'Aptos', size: 10, color: { argb: 'FF111827' } };
                    cell.alignment = { vertical: 'top', wrapText: true };
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: index % 2 === 0 ? 'FFFFFFFF' : 'FFFAFAFA' },
                    };
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `aadhya-serene-leads-${leadTemperature}-${fileDate}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            const csv = buildLeadsCsv(reportRows);
            const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');

            console.error('Styled leads export failed. Falling back to CSV.', error);
            link.href = url;
            link.download = `aadhya-serene-leads-${leadTemperature}-${fileDate}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }
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

                    {activeSection === 'leads' ? (
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
                                        onClick={() => {
                                            void downloadVisibleLeadsReport();
                                        }}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#111] px-5 text-sm font-bold text-white shadow-[0_8px_0_rgba(17,17,17,0.12),0_18px_34px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 active:translate-y-0 sm:w-auto"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download Report
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
                                    {Object.entries(LEAD_FILTERS).map(([temperature, meta]) => (
                                        <button
                                            key={temperature}
                                            type="button"
                                            onClick={() => setLeadTemperature(temperature)}
                                            className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition sm:min-w-[150px] sm:flex-none ${getLeadFilterButtonClasses(leadTemperature, temperature)}`}
                                        >
                                            <span>{meta.label}</span>
                                            <span className={`rounded-full px-2 py-0.5 text-xs ${temperature === SALES_LEAD_STATUS_DEAD ? 'bg-white/20 text-white' : 'border border-[#111]/10 bg-[#fafafa] text-[#111]'}`}>{leadStats[temperature]}</span>
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
                                                <button type="button" onClick={() => setSelectedLeadAbout(lead)} className="mt-2 text-left text-lg font-bold text-[#111] underline decoration-[#111]/20 underline-offset-4 hover:decoration-[#111]/45">
                                                    {lead.name || 'Unknown lead'}
                                                </button>
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
                                    No {LEAD_FILTERS[leadTemperature].label.toLowerCase()} leads match your current search.
                                </div>
                            )}
                        </div>

                        <div className="hidden min-h-0 flex-1 overflow-auto xl:block">
                            <table className="w-full min-w-[1480px] border-collapse text-left">
                                <thead className="sticky top-0 z-10 bg-[#f7f7f7] text-xs uppercase tracking-[0.1em] text-[#6b7280]">
                                    <tr>
                                        <th className="px-7 py-5 font-bold">Submitted</th>
                                        <th className="px-7 py-5 font-bold">Lead</th>
                                        <th className="px-7 py-5 font-bold">Lead Status</th>
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
                                                <button type="button" onClick={() => setSelectedLeadAbout(lead)} className="text-left font-bold text-[#111] underline decoration-[#111]/20 underline-offset-4 hover:decoration-[#111]/45">
                                                    {lead.name || 'Unknown lead'}
                                                </button>
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
                    ) : activeSection === 'calls' ? (
                    <section ref={callsRef} className="scroll-mt-8">
                        <CallsPanel
                            leads={leads}
                            canWrite={canWrite}
                            onCallLogSaved={handleCallLogSaved}
                            onOpenLeadActivity={setSelectedLead}
                            onOpenLeadAbout={setSelectedLeadAbout}
                        />
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

                        {!isSalesExecutive ? (
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
                        ) : null}
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
                                            {!canEditInventory ? (
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

                                        {canEditInventory ? (
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
                                                {canEditInventory ? (
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
                onClose={() => setSelectedLead(null)}
            />
            <AboutLeadPanel
                lead={selectedLeadAbout}
                onClose={() => setSelectedLeadAbout(null)}
            />
        </main>
    );
}
