export function escapeCsv(value) {
    let text = String(value ?? '');
    if (/^\s*[=+\-@]/.test(text)) {
        text = `'${text}`;
    }

    if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
        return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
}

export function buildCsvRow(values) {
    return values.map(escapeCsv).join(',');
}
