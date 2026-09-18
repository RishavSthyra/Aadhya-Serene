'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Mail, MessageSquare, Phone, Plus, Save, X } from 'lucide-react';
import {
    ANSWERED_CALL_OUTCOME_LABELS,
    CALL_DISPOSITION_LABELS,
    LEAD_STAGE_CONFIG,
    LEAD_STAGE_NEXT,
    LEAD_STAGE_SITE_VISIT_BOOKED,
    getLeadStageConfig,
    getLeadStageLabel,
} from '@/lib/lead-lifecycle';
import {
    CALL_LOG_ANSWERED_OUTCOME_OPTIONS,
    CALL_LOG_LOCATION_CHOICE_MENTIONED,
    CALL_LOG_LOCATION_CHOICE_OPTIONS,
    CALL_LOG_REQUIREMENT_NOT_MENTIONED,
    CALL_LOG_STATUS_OPTIONS,
    CALL_LOG_REMARK_MAX_LENGTH,
    getCallLogFieldErrors,
} from '@/lib/admin-call-log';

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'calls', label: 'Calls' },
    { key: 'notes', label: 'Notes' },
    { key: 'emails', label: 'Emails' },
    { key: 'activity', label: 'Activity' },
];

function today() {
    const offset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - offset).toISOString().slice(0, 10);
}

function formatDate(value) {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(date);
}

function formatDuration(value) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds < 0) return '';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function safeRecordingUrl(value) {
    try {
        const url = new URL(String(value || ''));
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch {
        return '';
    }
}

function createCallForm() {
    return {
        callDate: today(), callOutcome: '', answeredOutcomes: [], callbackDueAt: '', remark: '', sharedRequirements: false,
        budget: CALL_LOG_REQUIREMENT_NOT_MENTIONED, configuration: CALL_LOG_REQUIREMENT_NOT_MENTIONED,
        locationChoice: CALL_LOG_REQUIREMENT_NOT_MENTIONED, location: '',
    };
}

function StatusBadge({ label }) {
    return <span className="inline-flex items-center rounded-full bg-[#111] px-3 py-1.5 text-xs font-bold text-white">{label}</span>;
}

function CallForm({ lead, canWrite, onSaved }) {
    const [form, setForm] = useState(createCallForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    function update(name, value) {
        setForm((current) => {
            const next = { ...current, [name]: value };
            if (name === 'callOutcome' && value !== 'answered') { next.answeredOutcomes = []; next.callbackDueAt = ''; }
            if (name === 'answeredOutcomes' && !value.includes('callback_requested')) next.callbackDueAt = '';
            if (name === 'locationChoice' && value !== CALL_LOG_LOCATION_CHOICE_MENTIONED) next.location = '';
            return next;
        });
        setErrors((current) => ({ ...current, [name]: '', form: '' }));
    }

    async function submit(event) {
        event.preventDefault();
        const fieldErrors = getCallLogFieldErrors(form);
        if (Object.keys(fieldErrors).length) { setErrors(fieldErrors); return; }
        setSaving(true); setErrors({});
        try {
            const response = await fetch(`/api/admin/leads/${lead.id}/calls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const payload = await response.json();
            if (!response.ok) throw Object.assign(new Error(payload.error || 'Unable to save call.'), { fieldErrors: payload.fieldErrors });
            onSaved(payload.callLog, payload.lifecycle, payload.stage, payload.stageLabel);
            setForm(createCallForm());
        } catch (error) {
            setErrors(error.fieldErrors || { form: error.message });
        } finally { setSaving(false); }
    }

    if (!canWrite) return null;

    return (
        <form onSubmit={submit} className="border-t border-[#111]/10 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">Call date<input type="date" value={form.callDate} onChange={(event) => update('callDate', event.target.value)} className="mt-2 h-11 w-full border border-[#111]/15 bg-transparent px-3 text-sm font-medium normal-case tracking-normal text-[#111]" />{errors.callDate ? <em className="mt-1 block text-xs normal-case tracking-normal text-red-600">{errors.callDate}</em> : null}</label>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">Disposition<select value={form.callOutcome} onChange={(event) => update('callOutcome', event.target.value)} className="mt-2 h-11 w-full border border-[#111]/15 bg-transparent px-3 text-sm font-medium normal-case tracking-normal text-[#111]"><option value="">Choose disposition</option>{CALL_LOG_STATUS_OPTIONS.map((item) => <option key={item} value={item}>{CALL_DISPOSITION_LABELS[item]}</option>)}</select>{errors.callOutcome ? <em className="mt-1 block text-xs normal-case tracking-normal text-red-600">{errors.callOutcome}</em> : null}</label>
            </div>
            {form.callOutcome === 'answered' ? <div className="mt-4 border-y border-[#111]/10 py-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">Answered outcomes</p><div className="mt-3 flex flex-wrap gap-4">{CALL_LOG_ANSWERED_OUTCOME_OPTIONS.map((item) => <label key={item} className="flex items-center gap-2 text-sm font-medium text-[#111]"><input type="checkbox" checked={form.answeredOutcomes.includes(item)} onChange={(event) => update('answeredOutcomes', event.target.checked ? [...form.answeredOutcomes, item] : form.answeredOutcomes.filter((value) => value !== item))} />{ANSWERED_CALL_OUTCOME_LABELS[item]}</label>)}</div>{form.answeredOutcomes.includes('callback_requested') ? <label className="mt-4 block max-w-sm text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">Callback due<input type="datetime-local" value={form.callbackDueAt} onChange={(event) => update('callbackDueAt', event.target.value)} className="mt-2 h-11 w-full border border-[#111]/15 bg-transparent px-3 text-sm font-medium normal-case tracking-normal text-[#111]" /></label> : null}</div> : null}
            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">Call notes<textarea value={form.remark} onChange={(event) => update('remark', event.target.value)} maxLength={CALL_LOG_REMARK_MAX_LENGTH} rows={3} className="mt-2 w-full border border-[#111]/15 bg-transparent px-3 py-3 text-sm font-medium normal-case tracking-normal text-[#111]" placeholder="What happened on the call?" /></label>
            {errors.form ? <p className="mt-2 text-xs font-bold text-red-600">{errors.form}</p> : null}<button type="submit" disabled={saving} className="mt-4 inline-flex h-11 items-center gap-2 bg-[#111] px-5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save call'}</button>
        </form>
    );
}

function LeadDetailPage() {
    const [lead, setLead] = useState(null);
    const [tab, setTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [note, setNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [stageBusy, setStageBusy] = useState('');
    const [canWrite, setCanWrite] = useState(false);
    const [callBusy, setCallBusy] = useState(false);
    const [callStarted, setCallStarted] = useState(false);
    const [callMessage, setCallMessage] = useState('');
    const [callError, setCallError] = useState('');
    const callRequestRef = useRef(null);
    const [stageSelectorValue, setStageSelectorValue] = useState('');
    const [stageDialog, setStageDialog] = useState(null);

    async function loadLead() {
        setLoading(true); setError('');
        try {
            const leadId = decodeURIComponent(window.location.pathname.split('/').filter(Boolean).pop() || '');
            if (!leadId) throw new Error('Lead id is missing from this URL.');
            const response = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, { cache: 'no-store' });
            const payload = await response.json();
            if (!response.ok) throw new Error(payload.error || 'Unable to load lead.');
            setLead(payload.lead);
            setStageSelectorValue('');
            setCanWrite(Boolean(payload.canWrite));
            const callStorageKey = `aadhya-serene:c2c-started:${payload.lead.id}`;
            try {
                setCallStarted(window.sessionStorage.getItem(callStorageKey) === '1');
            } catch {
                setCallStarted(false);
            }
            setCallMessage('');
            setCallError('');
        } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
    }

    useEffect(() => {
        void loadLead();
    }, []);

    async function startClickToCall() {
        if (!lead?.phone || callBusy || callRequestRef.current) return;

        const request = fetch(`/api/admin/leads/${encodeURIComponent(lead.id)}/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        callRequestRef.current = request;
        setCallBusy(true);
        setCallMessage('');
        setCallError('');

        try {
            const response = await request;
            const responseText = await response.text();
            let payload = null;
            try {
                payload = responseText ? JSON.parse(responseText) : null;
            } catch {
                throw new Error(responseText.trim().startsWith('<')
                    ? 'The click-to-call server returned an HTML error page. Restart or redeploy the latest CRM server, then try again.'
                    : 'The click-to-call server returned an invalid response.');
            }
            if (!response.ok || payload?.accepted !== true) {
                throw new Error(payload?.error || 'Unable to start the call.');
            }
            setCallStarted(true);
            try {
                window.sessionStorage.setItem(`aadhya-serene:c2c-started:${lead.id}`, '1');
            } catch {
                // Session storage may be unavailable in private browsing.
            }
            setCallMessage('Call request accepted. Daffytel will connect the agent and lead.');
        } catch (callStartError) {
            setCallError(callStartError.message);
        } finally {
            if (callRequestRef.current === request) callRequestRef.current = null;
            setCallBusy(false);
        }
    }

    async function addNote(event) {
        event.preventDefault(); if (!note.trim()) return;
        setSavingNote(true);
        try {
            const response = await fetch(`/api/admin/leads/${lead.id}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: note }) });
            const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Unable to save note.');
            setLead((current) => ({ ...current, salesRemarks: [payload.note, ...(current.salesRemarks || [])] })); setNote('');
        } catch (saveError) { setError(saveError.message); } finally { setSavingNote(false); }
    }

    function selectStage(event) {
        const value = event.target.value;
        setStageSelectorValue(value);
        if (!value) return;

        setStageDialog({
            type: value,
            scheduledAt: '',
            note: '',
            error: '',
        });
    }

    async function changeStage() {
        if (!stageDialog) return;
        const { type, scheduledAt, note } = stageDialog;
        if (['site_visit_booked', 'site_visit_done'].includes(type) && !scheduledAt) {
            setStageDialog((current) => ({ ...current, error: 'Choose the relevant date and time.' }));
            return;
        }
        if (type === 'dead' && !note.trim()) {
            setStageDialog((current) => ({ ...current, error: 'Add a reason before marking this lead dead.' }));
            return;
        }

        setStageBusy(type); setError('');
        try {
            const response = await fetch(`/api/admin/leads/${lead.id}/lifecycle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, scheduledAt, note }) });
            const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'Unable to update lifecycle.');
            setLead((current) => ({ ...current, stage: payload.stage, stageLabel: payload.stageLabel, activity: [...(current.activity || []), { type: 'lifecycle_event', title: payload.stageLabel, detail: 'Lead lifecycle updated.', occurredAt: new Date().toISOString() }] }));
            setStageSelectorValue('');
            setStageDialog(null);
        } catch (stageError) {
            setStageDialog((current) => ({ ...current, error: stageError.message }));
            setStageSelectorValue('');
        } finally { setStageBusy(''); }
    };

    function closeStageDialog() {
        setStageDialog(null);
        setStageSelectorValue('');
    };

    const stageDialogLabel = stageDialog ? getLeadStageConfig(stageDialog.type).label : '';
    const stageDialogNeedsDate = stageDialog && ['site_visit_booked', 'site_visit_done'].includes(stageDialog.type);
    const stageDialogNeedsNote = stageDialog?.type === 'dead';

    function updateStageDialog(field, value) {
        setStageDialog((current) => ({ ...current, [field]: value, error: '' }));
    }

    const notes = useMemo(() => (lead?.salesRemarks || []).filter((item) => item.type !== 'feedback'), [lead]);
    if (loading) return <main className="min-h-screen bg-[#f4f4f2] p-8 text-sm text-[#6b7280]">Loading lead...</main>;
    if (!lead) return <main className="min-h-screen bg-[#f4f4f2] p-8 text-sm font-bold text-red-600">{error || 'Lead not found.'}</main>;

    return (
        <main className="editorial-detail min-h-screen bg-[#f4f4f2] text-[#111]">
            <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-10 sm:py-10 lg:px-16 lg:py-12">
                <a href="/admin" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280] transition hover:text-[#111]"><ArrowLeft className="h-4 w-4" />Back to Leads</a>
                <header className="mt-10 grid gap-8 border-b border-[#111]/15 pb-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6b7280]">Lead workspace / {lead.source || 'Website'}</p><h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl">{lead.name || 'Unknown lead'}</h1><p className="mt-5 text-base text-[#4b5563]">{lead.phone || 'No phone'}{lead.email ? `  ·  ${lead.email}` : ''}</p></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><StatusBadge label={lead.stageLabel || getLeadStageLabel(lead.stage)} /><a href={`mailto:${lead.email || ''}`} className="inline-flex h-11 items-center gap-2 border border-[#111]/15 px-4 text-sm font-bold transition hover:bg-white"><Mail className="h-4 w-4" />Email</a><a href={`https://wa.me/${String(lead.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 border border-[#111]/15 px-4 text-sm font-bold transition hover:bg-white"><MessageSquare className="h-4 w-4" />WhatsApp</a><div className="flex w-[280px] max-w-full shrink-0 flex-col items-start gap-2"><button type="button" onClick={() => void startClickToCall()} disabled={!canWrite || !lead.phone || callBusy || callStarted} className="inline-flex h-11 w-32 shrink-0 items-center justify-center gap-2 whitespace-nowrap border border-[#111]/15 px-4 text-sm font-bold transition hover:bg-white disabled:cursor-not-allowed disabled:border-[#111]/10 disabled:bg-[#111]/5 disabled:text-[#6b7280]" title={!canWrite ? 'Your account has read-only access' : !lead.phone ? 'This lead has no usable phone number' : callStarted ? 'A call has already been requested for this lead' : 'Start a click-to-call'}><Phone className="h-4 w-4" />{callBusy ? 'Calling...' : callStarted ? 'Requested' : 'Call'}</button>{callMessage ? <p className="w-full max-w-full break-words text-xs font-bold leading-5 text-green-700" role="status">{callMessage}</p> : null}{callError ? <p className="w-full max-w-full break-words text-xs font-bold leading-5 text-red-600" role="alert">{callError}</p> : null}</div></div></header>
                <nav className="mt-7 flex gap-7 overflow-x-auto border-b border-[#111]/15" aria-label="Lead detail tabs">{TABS.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`whitespace-nowrap border-b-2 px-0 pb-4 text-sm font-bold transition ${tab === item.key ? 'border-[#111] text-[#111]' : 'border-transparent text-[#6b7280] hover:text-[#111]'}`}>{item.label}</button>)}</nav>
                {error ? <p className="mt-5 border-l-2 border-red-600 px-3 py-2 text-sm font-bold text-red-600">{error}</p> : null}

                {stageDialog ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111]/35 px-5 py-6" role="presentation">
                        <div className="w-full max-w-md border border-[#111]/15 bg-[#fffefa] p-5 shadow-[0_20px_60px_rgba(17,17,17,0.2)] sm:p-6" role="dialog" aria-modal="true" aria-labelledby="stage-dialog-title">
                            <div className="flex items-start justify-between gap-4 border-b border-[#111]/10 pb-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">Confirm lifecycle update</p>
                                    <h2 id="stage-dialog-title" className="mt-1 text-xl font-bold text-[#111]">Move to {stageDialogLabel}?</h2>
                                </div>
                                <button type="button" onClick={closeStageDialog} className="inline-flex h-9 w-9 items-center justify-center text-[#6b7280] transition hover:bg-[#f4f4f2] hover:text-[#111]" aria-label="Close stage dialog"><X className="h-4 w-4" /></button>
                            </div>
                            {stageDialogNeedsDate ? (
                                <label className="mt-5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                    {stageDialog.type === 'site_visit_done' ? 'Completed visit date and time' : 'Visit date and time'}
                                    <input type="datetime-local" value={stageDialog.scheduledAt} onChange={(event) => updateStageDialog('scheduledAt', event.target.value)} className="mt-2 h-11 w-full border border-[#111]/15 bg-white px-3 text-sm font-medium normal-case tracking-normal text-[#111] outline-none focus:border-[#111]" />
                                </label>
                            ) : null}
                            {stageDialogNeedsNote ? (
                                <label className="mt-5 block text-xs font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                                    Reason <span className="text-red-600">*</span>
                                    <textarea required value={stageDialog.note} onChange={(event) => updateStageDialog('note', event.target.value)} rows={3} maxLength={5000} className="mt-2 w-full border border-[#111]/15 bg-white px-3 py-3 text-sm font-medium normal-case tracking-normal text-[#111] outline-none focus:border-[#111]" placeholder="Why is this lead being marked dead?" />
                                </label>
                            ) : null}
                            {stageDialog.error ? <p className="mt-3 text-sm font-bold text-red-600">{stageDialog.error}</p> : null}
                            <div className="mt-6 flex justify-end gap-3 border-t border-[#111]/10 pt-4">
                                <button type="button" onClick={closeStageDialog} className="h-10 border border-[#111]/15 px-4 text-sm font-bold text-[#111] transition hover:bg-[#f4f4f2]">Cancel</button>
                                <button type="button" onClick={() => void changeStage()} disabled={Boolean(stageBusy)} className="h-10 bg-[#111] px-4 text-sm font-bold text-white disabled:opacity-50">{stageBusy ? 'Updating...' : `Confirm ${stageDialogLabel}`}</button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {tab === 'overview' ? <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1fr)_300px]"><section><div className="border-b border-[#111]/15 pb-10"><div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6b7280]">Current stage</p><h2 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl">{lead.stageLabel}</h2></div>{canWrite ? <label className="block w-full max-w-[260px] text-xs font-bold uppercase tracking-[0.14em] text-[#6b7280]">Advance to<select value={stageSelectorValue} onChange={selectStage} disabled={Boolean(stageBusy)} className="mt-2 h-12 w-full appearance-none border border-[#111]/20 bg-[#fffefa] px-3 text-sm font-bold normal-case tracking-normal text-[#111] outline-none transition focus:border-[#111] focus:ring-4 focus:ring-black/5 disabled:opacity-50"><option value="">Choose next stage</option>{(LEAD_STAGE_NEXT[lead.stage] || []).map((stage) => <option key={stage} value={stage}>{getLeadStageConfig(stage).label}</option>)}</select></label> : null}</div><p className="mt-7 max-w-2xl font-display text-lg leading-7 text-[#374151]">{lead.message || 'No message was captured with this enquiry.'}</p></div><div className="pt-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b7280]">Lead brief</p><p className="mt-4 max-w-2xl text-base leading-8 text-[#4b5563]">This enquiry has been grouped by phone number so every submission and conversation remains available in one timeline.</p></div></section><aside className="border-l border-[#111]/15 pl-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b7280]">Quick facts</p><dl className="mt-5 grid gap-5"><div><dt className="text-xs text-[#6b7280]">Source</dt><dd className="mt-1 font-bold">{lead.source || 'Website'}</dd></div><div><dt className="text-xs text-[#6b7280]">First seen</dt><dd className="mt-1 font-bold">{formatDate(lead.originalDate)}</dd></div><div><dt className="text-xs text-[#6b7280]">Assigned to</dt><dd className="mt-1 font-bold">{lead.assignedSalesExecutiveName || 'Unassigned'}</dd></div><div><dt className="text-xs text-[#6b7280]">Submissions</dt><dd className="mt-1 font-bold">{lead.submissions?.length || 0}</dd></div></dl><div className="mt-10 border-t border-[#111]/15 pt-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b7280]">Next action</p><p className="mt-3 text-lg font-bold leading-6">{lead.callback?.status === 'pending' ? `Callback due ${formatDate(lead.callback.dueAt)}` : 'Review this lead and choose the next milestone.'}</p><button type="button" onClick={() => setTab('calls')} className="mt-6 inline-flex items-center gap-2 text-sm font-bold underline decoration-[#111]/25 underline-offset-4 transition hover:decoration-[#111]"><Phone className="h-4 w-4" />Open call history</button></div></aside></div> : null}

                {tab === 'calls' ? <section className="mt-8 max-w-4xl"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b7280]">Conversation record</p><h2 className="mt-2 text-2xl font-bold">Calls</h2></div><span className="text-sm font-bold text-[#6b7280]">{lead.callLogs?.length || 0} total</span></div><div className="mt-7"><CallForm lead={lead} canWrite={canWrite} onSaved={(callLog, lifecycle, stage, stageLabel) => { setLead((current) => ({ ...current, callLogs: [callLog, ...(current.callLogs || [])], lifecycle: lifecycle || current.lifecycle, callback: lifecycle?.callback || current.callback, stage: stage || current.stage, stageLabel: stageLabel || current.stageLabel })); }} /></div><div className="mt-10 divide-y divide-[#111]/15">{(lead.callLogs || []).map((call) => { const recordingUrl = safeRecordingUrl(call.recordingUrl); const duration = formatDuration(call.durationSeconds); const manualOutcome = call.callOutcome || call.callStatus; return <article key={call.id} className="py-5"><div className="flex items-start justify-between gap-4"><div><p className="font-bold">{formatDate(call.createdAt || call.callDate)}</p><p className="mt-1 text-sm text-[#4b5563]">{call.remark}</p>{call.answeredOutcomes?.length ? <p className="mt-2 text-xs font-bold text-[#6b7280]">{call.answeredOutcomes.map((item) => ANSWERED_CALL_OUTCOME_LABELS[item] || item).join(' · ')}</p> : null}<div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[#6b7280]">{duration ? <span>Duration {duration}</span> : null}{call.providerStatus && call.providerStatus !== manualOutcome ? <span className="border border-violet-200 bg-violet-50 px-2 py-1 text-violet-700">Provider: {call.providerStatus.replaceAll('_', ' ')}</span> : null}{recordingUrl ? <a href={recordingUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-[#111]">Listen to recording</a> : null}</div></div><StatusBadge label={CALL_DISPOSITION_LABELS[manualOutcome] || manualOutcome || 'Call'} /></div></article>; })}</div></section> : null}

                {tab === 'notes' ? <section className="mt-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b7280]">Internal record</p><h2 className="mt-2 text-2xl font-bold">Notes</h2>{canWrite ? <form onSubmit={addNote} className="mt-7 border-b border-[#111]/15 pb-6"><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Add an internal note..." className="w-full border border-[#111]/15 bg-transparent px-3 py-3 text-sm leading-6" /><button type="submit" disabled={savingNote || !note.trim()} className="mt-3 inline-flex h-11 items-center gap-2 bg-[#111] px-5 text-sm font-bold text-white disabled:opacity-40"><Plus className="h-4 w-4" />{savingNote ? 'Saving...' : 'Add note'}</button></form> : <p className="mt-5 text-sm text-[#6b7280]">This account has read-only access.</p>}<div className="divide-y divide-[#111]/15">{notes.map((item) => <article key={item.id} className="py-5"><p className="whitespace-pre-wrap text-sm leading-7">{item.text}</p><p className="mt-2 text-xs font-bold text-[#6b7280]">{item.authorName} · {formatDate(item.createdAt)}</p></article>)}</div></section> : null}

                {tab === 'emails' ? <section className="mt-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b7280]">Delivery history</p><h2 className="mt-2 text-2xl font-bold">Emails</h2><div className="mt-7 divide-y divide-[#111]/15"><article className="py-5"><p className="font-bold">Sales notification</p><p className="mt-1 text-sm text-[#4b5563]">{lead.emailDelivery?.status || 'Not requested'}</p>{lead.emailDelivery?.sentAt ? <p className="mt-2 text-xs text-[#6b7280]">Sent {formatDate(lead.emailDelivery.sentAt)}</p> : null}</article></div></section> : null}

                {tab === 'activity' ? <section className="mt-8 max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6b7280]">Everything so far</p><h2 className="mt-2 text-2xl font-bold">Activity</h2><ol className="mt-7 border-l border-[#111]/15 pl-6">{(lead.activity || []).map((event, index) => <li key={`${event.type}-${event.occurredAt}-${index}`} className="relative pb-7 last:pb-0"><span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-[#111]" /><p className="font-bold">{event.title}</p><p className="mt-1 text-sm leading-6 text-[#4b5563]">{event.detail}</p><p className="mt-1 text-xs font-bold text-[#6b7280]">{formatDate(event.occurredAt)}</p></li>)}</ol></section> : null}
            </div>
        </main>
    );
}

export default LeadDetailPage;
