export const DEFAULT_OPEN_CLIENT_MOD_IDS = [
    'P7dR8mSH',
    'AANobbMI',
    'gvQqBUqZ',
    '5ZwdcRci',
    'nmDcB62a',
    'YL57xq9U',
    'iAiqcykM',
    'PtjYWJkn',
    'Bh37bMuy',
    'LQ3K71Q1',
    'OVuFYfre',
    'Qr0NYZsM'
];

export const normalizeClientModIdList = (modIds = []) => {
    if (!Array.isArray(modIds)) return [];

    const normalized = modIds
        .filter((item) => typeof item === 'string' && item.trim())
        .map((item) => item.trim());

    return [...new Set(normalized)];
};

export const sanitizeClientCustomAutoInstallModIds = (modIds = []) => {
    const normalized = normalizeClientModIdList(modIds);
    return normalized.filter((projectId) => !DEFAULT_OPEN_CLIENT_MOD_IDS.includes(projectId));
};

export const resolveClientAutoInstallModIds = (customModIds = []) => {
    const custom = sanitizeClientCustomAutoInstallModIds(customModIds);
    return [...new Set([...DEFAULT_OPEN_CLIENT_MOD_IDS, ...custom])];
};