const normalizeRawSource = (value: unknown): string => String(value || '').toLowerCase().trim();

const collectKnownSources = (rawValue: unknown, destination: Set<string>) => {
    const normalized = normalizeRawSource(rawValue);
    if (!normalized) return;

    if (normalized.includes('modrinth')) {
        destination.add('modrinth');
    }

    if (normalized.includes('curseforge')) {
        destination.add('curseforge');
    }

    if (!normalized.includes('modrinth') && !normalized.includes('curseforge')) {
        const fallbackTokens = normalized
            .split(/[,+/|]/g)
            .map((token) => token.trim())
            .filter(Boolean);

        fallbackTokens.forEach((token) => destination.add(token));
    }
};

export const getSourceTags = (source?: unknown, sources?: unknown): string[] => {
    const sourceSet = new Set<string>();

    const sourceList = Array.isArray(sources) ? sources : [];
    sourceList.forEach((entry) => collectKnownSources(entry, sourceSet));

    if (sourceSet.size === 0 && source !== undefined) {
        collectKnownSources(source, sourceSet);
    } else if (source !== undefined) {
        collectKnownSources(source, sourceSet);
    }

    if (sourceSet.size === 0) {
        return ['modrinth'];
    }

    const orderedKnown = ['modrinth', 'curseforge'].filter((item) => sourceSet.has(item));
    const custom = [...sourceSet].filter((item) => !orderedKnown.includes(item));

    return [...orderedKnown, ...custom];
};
