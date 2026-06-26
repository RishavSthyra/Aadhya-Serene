const DAY_MS = 24 * 60 * 60 * 1000;

export const RECURRING_PAYMENT_TYPES = ['salary', 'subscription'];
export const RECURRING_PAYMENT_CYCLES = ['monthly', 'annual'];
export const RECURRING_PAYMENT_STATUSES = ['active', 'paused', 'ended'];
export const PAYMENT_METHODS = [
    'bank_transfer',
    'upi',
    'credit_card',
    'debit_card',
    'cash',
    'auto_debit',
    'cheque',
    'other',
];

function normalizeKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

function normalizeToken(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9 ]+/g, '');
}

function toUtcDateOnly(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return new Date(Date.UTC(
            value.getUTCFullYear(),
            value.getUTCMonth(),
            value.getUTCDate(),
        ));
    }

    const stringValue = String(value).trim();
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stringValue);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }

    const parsed = new Date(stringValue);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return new Date(Date.UTC(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth(),
        parsed.getUTCDate(),
    ));
}

function addUtcDays(date, days) {
    return new Date(date.getTime() + (days * DAY_MS));
}

function addUtcMonths(date, monthsToAdd) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const targetMonthIndex = month + monthsToAdd;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDayOfTargetMonth = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
    return new Date(Date.UTC(targetYear, normalizedMonth, Math.min(day, lastDayOfTargetMonth)));
}

function addUtcYears(date, yearsToAdd) {
    const year = date.getUTCFullYear() + yearsToAdd;
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const lastDayOfTargetMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(day, lastDayOfTargetMonth)));
}

function formatUtcDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toISOString().slice(0, 10);
}

function clampCurrency(value) {
    const normalized = String(value || 'INR').trim().toUpperCase();
    return /^[A-Z]{3}$/.test(normalized) ? normalized : 'INR';
}

function coerceBoolean(value, defaultValue = false) {
    if (typeof value === 'boolean') {
        return value;
    }

    const normalized = String(value || '').trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
        return true;
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
        return false;
    }

    return defaultValue;
}

function coerceInteger(value, defaultValue = 0) {
    if (value === '' || value == null) {
        return defaultValue;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return defaultValue;
    }

    return Math.max(0, Math.round(parsed));
}

function coerceAmount(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }

    return Number(parsed.toFixed(2));
}

function normalizePaymentMethod(value) {
    const normalized = normalizeKey(value);
    return PAYMENT_METHODS.includes(normalized) ? normalized : 'bank_transfer';
}

function readFirst(input, keys) {
    for (const key of keys) {
        if (input[key] != null && input[key] !== '') {
            return input[key];
        }
    }

    return undefined;
}

function buildMatchKey(record) {
    if (record.externalId) {
        return `external:${normalizeToken(record.externalId)}`;
    }

    if (record.type === 'salary' && record.employeeCode) {
        return `salary:${normalizeToken(record.employeeCode)}`;
    }

    if (record.type === 'subscription' && record.vendorName && record.name) {
        return `subscription:${normalizeToken(record.vendorName)}:${normalizeToken(record.name)}`;
    }

    return `generic:${record.type}:${normalizeToken(record.name)}:${formatUtcDate(record.startDate)}`;
}

function cycleStartAt(startDate, cycle, index) {
    return cycle === 'annual'
        ? addUtcYears(startDate, index)
        : addUtcMonths(startDate, index);
}

function countElapsedCycles(startDate, cycle, now) {
    if (now <= startDate) {
        return 0;
    }

    let low = 0;
    let high = cycle === 'annual'
        ? Math.max(1, now.getUTCFullYear() - startDate.getUTCFullYear() + 3)
        : Math.max(1, ((now.getUTCFullYear() - startDate.getUTCFullYear()) * 12)
            + (now.getUTCMonth() - startDate.getUTCMonth()) + 3);

    while (cycleStartAt(startDate, cycle, high) <= now) {
        high *= 2;
    }

    while (low < high) {
        const mid = Math.floor((low + high + 1) / 2);
        if (cycleStartAt(startDate, cycle, mid) <= now) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }

    return low;
}

function getCurrentPeriodBounds(startDate, cycle, now) {
    if (now < startDate) {
        const nextBoundary = cycleStartAt(startDate, cycle, 1);
        return {
            currentPeriodStart: startDate,
            currentPeriodEnd: addUtcDays(nextBoundary, -1),
        };
    }

    const currentIndex = countElapsedCycles(startDate, cycle, now);
    const currentPeriodStart = cycleStartAt(startDate, cycle, currentIndex);
    const nextPeriodStart = cycleStartAt(startDate, cycle, currentIndex + 1);

    return {
        currentPeriodStart,
        currentPeriodEnd: addUtcDays(nextPeriodStart, -1),
    };
}

function iteratePeriods(startDate, cycle, effectiveEndExclusive, callback) {
    let periodIndex = 0;
    let periodStart = startDate;

    while (periodStart < effectiveEndExclusive) {
        const nextPeriodStart = cycleStartAt(startDate, cycle, periodIndex + 1);
        callback({
            periodIndex,
            periodStart,
            nextPeriodStart,
            periodDays: Math.max(1, Math.round((nextPeriodStart.getTime() - periodStart.getTime()) / DAY_MS)),
        });

        periodIndex += 1;
        periodStart = nextPeriodStart;
    }
}

export function calculateRecurringPaymentMetrics(record, nowInput = new Date()) {
    const startDate = toUtcDateOnly(record.startDate);
    if (!startDate) {
        return {
            monthlyEquivalent: 0,
            annualEquivalent: 0,
            accruedAmount: 0,
            cyclesElapsed: 0,
            nextDueDate: null,
            daysUntilDue: null,
            currentPeriodStart: null,
            currentPeriodEnd: null,
        };
    }

    const now = toUtcDateOnly(nowInput) ?? toUtcDateOnly(new Date());
    const amount = Number(record.amount || 0);
    const cycle = record.cycle === 'annual' ? 'annual' : 'monthly';
    const endDate = toUtcDateOnly(record.endDate);
    const effectiveEndDate = endDate && endDate < now ? endDate : now;
    const effectiveEndExclusive = addUtcDays(effectiveEndDate, 1);
    let accruedAmount = 0;

    if (effectiveEndExclusive > startDate && amount > 0) {
        iteratePeriods(startDate, cycle, effectiveEndExclusive, ({ periodStart, nextPeriodStart, periodDays }) => {
            const overlapStart = Math.max(startDate.getTime(), periodStart.getTime());
            const overlapEnd = Math.min(effectiveEndExclusive.getTime(), nextPeriodStart.getTime());
            if (overlapEnd <= overlapStart) {
                return;
            }

            const overlapDays = (overlapEnd - overlapStart) / DAY_MS;
            accruedAmount += amount * (overlapDays / periodDays);
        });
    }

    const cyclesElapsed = countElapsedCycles(startDate, cycle, now);
    const nextDueDate = cycleStartAt(startDate, cycle, Math.max(0, cyclesElapsed + 1));
    const { currentPeriodStart, currentPeriodEnd } = getCurrentPeriodBounds(startDate, cycle, now);
    const daysUntilDue = Math.ceil((nextDueDate.getTime() - now.getTime()) / DAY_MS);
    const monthlyEquivalent = cycle === 'monthly' ? amount : amount / 12;
    const annualEquivalent = cycle === 'annual' ? amount : amount * 12;

    return {
        monthlyEquivalent: Number(monthlyEquivalent.toFixed(2)),
        annualEquivalent: Number(annualEquivalent.toFixed(2)),
        accruedAmount: Number(accruedAmount.toFixed(2)),
        cyclesElapsed: Math.max(0, cyclesElapsed),
        nextDueDate,
        daysUntilDue,
        currentPeriodStart,
        currentPeriodEnd,
    };
}

export function normalizeRecurringPaymentInput(input, options = {}) {
    const source = options.source === 'csv' ? 'csv' : 'manual';
    const payload = input && typeof input === 'object' ? input : {};
    const type = normalizeKey(readFirst(payload, ['type', 'category', 'kind']));
    if (!RECURRING_PAYMENT_TYPES.includes(type)) {
        throw new Error('Recurring payment type must be salary or subscription.');
    }

    const requestedCycle = normalizeKey(
        readFirst(payload, ['cycle', 'frequency', 'billingCycle', 'billingcycle']),
    );
    const cycle = type === 'salary'
        ? 'monthly'
        : (RECURRING_PAYMENT_CYCLES.includes(requestedCycle) ? requestedCycle : 'monthly');

    const name = String(
        readFirst(payload, [
            'name',
            'employeeName',
            'employeename',
            'subscriptionName',
            'subscriptionname',
            'title',
        ])
        || '',
    ).trim();
    if (!name) {
        throw new Error('Recurring payment name is required.');
    }

    const amount = coerceAmount(
        readFirst(payload, [
            'amount',
            'salary',
            'monthlySalary',
            'monthlysalary',
            'subscriptionAmount',
            'subscriptionamount',
            'cost',
        ]),
    );
    if (amount == null) {
        throw new Error('Recurring payment amount must be a positive number.');
    }

    const startDate = toUtcDateOnly(readFirst(payload, [
        'startDate',
        'startdate',
        'start',
        'startedOn',
        'startedon',
        'effectiveFrom',
        'effectivefrom',
    ]));
    if (!startDate) {
        throw new Error('Recurring payment start date is required.');
    }

    const endDate = toUtcDateOnly(readFirst(payload, [
        'endDate',
        'enddate',
        'endsOn',
        'endson',
        'stopDate',
        'stopdate',
    ]));
    if (endDate && endDate < startDate) {
        throw new Error('End date cannot be earlier than start date.');
    }

    const status = normalizeKey(readFirst(payload, ['status']) || 'active');
    const normalizedStatus = RECURRING_PAYMENT_STATUSES.includes(status) ? status : 'active';

    const record = {
        externalId: String(readFirst(payload, ['externalId', 'externalid', 'id']) || '').trim() || undefined,
        name,
        type,
        cycle,
        amount,
        currency: clampCurrency(readFirst(payload, ['currency'])),
        startDate,
        endDate: endDate || null,
        status: normalizedStatus,
        paymentMethod: normalizePaymentMethod(readFirst(payload, ['paymentMethod', 'paymentmethod'])),
        ownerName: String(readFirst(payload, ['ownerName', 'ownername', 'owner', 'teamOwner', 'teamowner']) || '').trim(),
        department: String(readFirst(payload, ['department', 'team']) || '').trim(),
        employeeCode: String(readFirst(payload, ['employeeCode', 'employeecode', 'employeeId', 'employeeid', 'staffId', 'staffid']) || '').trim(),
        employeeEmail: String(readFirst(payload, ['employeeEmail', 'employeeemail', 'email']) || '').trim().toLowerCase(),
        vendorName: String(readFirst(payload, ['vendorName', 'vendorname', 'vendor', 'provider']) || '').trim(),
        notes: String(readFirst(payload, ['notes', 'note', 'description']) || '').trim(),
        autoRenew: type === 'subscription'
            ? coerceBoolean(readFirst(payload, ['autoRenew', 'autorenew']), cycle === 'monthly')
            : false,
        seatCount: coerceInteger(readFirst(payload, ['seatCount', 'seatcount', 'seats', 'licenses', 'headcount']), 0),
        source,
    };

    record.matchKey = buildMatchKey(record);

    return record;
}

function serializeRecurringPayment(record, now = new Date()) {
    const metrics = calculateRecurringPaymentMetrics(record, now);

    return {
        id: String(record._id || record.id || ''),
        externalId: record.externalId || '',
        name: record.name,
        type: record.type,
        cycle: record.cycle,
        amount: Number(record.amount || 0),
        currency: record.currency || 'INR',
        startDate: formatUtcDate(toUtcDateOnly(record.startDate)),
        endDate: record.endDate ? formatUtcDate(toUtcDateOnly(record.endDate)) : '',
        status: record.status || 'active',
        paymentMethod: record.paymentMethod || 'bank_transfer',
        ownerName: record.ownerName || '',
        department: record.department || '',
        employeeCode: record.employeeCode || '',
        employeeEmail: record.employeeEmail || '',
        vendorName: record.vendorName || '',
        notes: record.notes || '',
        autoRenew: Boolean(record.autoRenew),
        seatCount: Number(record.seatCount || 0),
        source: record.source || 'manual',
        createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : null,
        updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : null,
        metrics: {
            monthlyEquivalent: metrics.monthlyEquivalent,
            annualEquivalent: metrics.annualEquivalent,
            accruedAmount: metrics.accruedAmount,
            cyclesElapsed: metrics.cyclesElapsed,
            nextDueDate: metrics.nextDueDate ? formatUtcDate(metrics.nextDueDate) : '',
            daysUntilDue: metrics.daysUntilDue,
            currentPeriodStart: metrics.currentPeriodStart ? formatUtcDate(metrics.currentPeriodStart) : '',
            currentPeriodEnd: metrics.currentPeriodEnd ? formatUtcDate(metrics.currentPeriodEnd) : '',
        },
    };
}

export function buildRecurringFinanceSnapshot(records, now = new Date()) {
    const payments = Array.isArray(records)
        ? records.map((record) => serializeRecurringPayment(record, now))
        : [];

    const summary = payments.reduce(
        (acc, payment) => {
            acc.totalRecords += 1;
            acc[`${payment.status}Count`] += 1;
            acc[`${payment.type}Count`] += 1;
            acc.accruedLiability += payment.metrics.accruedAmount;

            if (payment.status === 'active') {
                acc.monthlyRecurringBurn += payment.metrics.monthlyEquivalent;
                acc.annualRecurringCommitment += payment.metrics.annualEquivalent;

                if (payment.type === 'salary') {
                    acc.monthlyPayrollRunRate += payment.metrics.monthlyEquivalent;
                }

                if (payment.type === 'subscription') {
                    acc.annualSubscriptionCommitment += payment.metrics.annualEquivalent;
                }

                if (
                    payment.metrics.daysUntilDue != null
                    && payment.metrics.daysUntilDue >= 0
                    && payment.metrics.daysUntilDue <= 30
                ) {
                    acc.dueInNext30DaysCount += 1;
                    acc.dueInNext30DaysAmount += payment.amount;
                }
            }

            return acc;
        },
        {
            totalRecords: 0,
            activeCount: 0,
            pausedCount: 0,
            endedCount: 0,
            salaryCount: 0,
            subscriptionCount: 0,
            monthlyRecurringBurn: 0,
            annualRecurringCommitment: 0,
            monthlyPayrollRunRate: 0,
            annualSubscriptionCommitment: 0,
            accruedLiability: 0,
            dueInNext30DaysCount: 0,
            dueInNext30DaysAmount: 0,
        },
    );

    Object.keys(summary).forEach((key) => {
        if (typeof summary[key] === 'number') {
            summary[key] = Number(summary[key].toFixed(2));
        }
    });

    return { payments, summary };
}

export function parseCsvText(csvText) {
    const text = String(csvText || '').replace(/^\uFEFF/, '').trim();
    if (!text) {
        return [];
    }

    const rows = [];
    let currentCell = '';
    let currentRow = [];
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const nextChar = text[index + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (!inQuotes && char === ',') {
            currentRow.push(currentCell);
            currentCell = '';
            continue;
        }

        if (!inQuotes && (char === '\n' || char === '\r')) {
            if (char === '\r' && nextChar === '\n') {
                index += 1;
            }
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentCell = '';
            currentRow = [];
            continue;
        }

        currentCell += char;
    }

    currentRow.push(currentCell);
    rows.push(currentRow);

    const [headerRow, ...dataRows] = rows.filter((row) => row.some((cell) => String(cell || '').trim() !== ''));
    if (!headerRow || headerRow.length === 0) {
        return [];
    }

    const headers = headerRow.map((header) => normalizeKey(header));
    return dataRows.map((row) => headers.reduce((acc, header, index) => {
        acc[header] = String(row[index] || '').trim();
        return acc;
    }, {}));
}

export function normalizeRecurringCsvRows(csvText) {
    return parseCsvText(csvText).map((row, index) => {
        try {
            return {
                rowNumber: index + 2,
                payload: normalizeRecurringPaymentInput(row, { source: 'csv' }),
            };
        } catch (error) {
            throw new Error(`Row ${index + 2}: ${error.message}`);
        }
    });
}
