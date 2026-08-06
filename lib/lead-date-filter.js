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

    const createdAt = {};
    if (startDate) {
        createdAt.$gte = startOfIndiaDate(startDate);
    }
    if (endDate) {
        const nextDay = startOfIndiaDate(endDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        createdAt.$lt = nextDay;
    }

    return { filter: Object.keys(createdAt).length ? { createdAt } : {} };
}
