const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function startOfIndiaDate(value) {
    return new Date(`${value}T00:00:00.000+05:30`);
}

export function getLeadDateRangeFilter(searchParams) {
    const startDate = String(searchParams.get('startDate') || '');
    const endDate = String(searchParams.get('endDate') || '');

    if ((startDate && !DATE_PATTERN.test(startDate)) || (endDate && !DATE_PATTERN.test(endDate))) {
        return { error: 'Dates must use YYYY-MM-DD.' };
    }

    if (startDate && Number.isNaN(startOfIndiaDate(startDate).getTime())) {
        return { error: 'Invalid start date.' };
    }

    if (endDate && Number.isNaN(startOfIndiaDate(endDate).getTime())) {
        return { error: 'Invalid end date.' };
    }

    if (startDate && endDate && startDate > endDate) {
        return { error: 'End date cannot be before start date.' };
    }

    return { startDate, endDate };
}

export function isLeadDateInRange(value, range = {}) {
    const timestamp = new Date(value || 0).getTime();
    if (Number.isNaN(timestamp) || !value) return false;

    const start = range.startDate ? startOfIndiaDate(range.startDate).getTime() : -Infinity;
    const end = range.endDate
        ? startOfIndiaDate(range.endDate).getTime() + 24 * 60 * 60 * 1000
        : Infinity;

    return timestamp >= start && timestamp < end;
}

export function hasLeadDateRange(range = {}) {
    return Boolean(range.startDate || range.endDate);
}
