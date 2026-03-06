const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function getProcessStats(pid) {
    try {
        if (!pid) return { cpu: 0, memory: 0 };

        const pidusage = require('pidusage');
        const pidtree = require('pidtree');

        let pids = [pid];
        try {

            const children = await pidtree(pid, { root: true });
            if (children && children.length > 0) {
                pids = children;
            }
        } catch (e) {

        }

        try {
            const statsObj = await pidusage(pids);
            let totalCpu = 0;
            let totalMemory = 0;

            for (const key in statsObj) {
                if (statsObj[key]) {
                    totalCpu += statsObj[key].cpu || 0;
                    totalMemory += statsObj[key].memory || 0;
                }
            }
            if (process.platform !== 'win32' || totalMemory > 50 * 1024 * 1024) {
                return {
                    cpu: Math.min(Math.round(totalCpu), 100),
                    memory: Math.round(totalMemory / (1024 * 1024)) || 0
                };
            }
        } catch (e) {

        }
        if (process.platform === 'win32') {
            try {
                const { stdout } = await execAsync(`wmic process where "name='javaw.exe' or name='java.exe'" get ProcessId, WorkingSetSize, CommandLine /format:csv`);
                const lines = stdout.trim().split('\n').slice(1);
                let bestMatch = null;
                let maxMem = 0;

                for (let line of lines) {
                    line = line.trim();
                    if (!line) continue;
                    const parts = line.split(',');

                    if (parts.length >= 4) {
                        const cmdLine = parts[1] || '';
                        const pId = parseInt(parts[2]);
                        const mem = parseInt(parts[3]);
                        if (cmdLine.toLowerCase().includes('minecraft') || cmdLine.toLowerCase().includes('-djava.library.path')) {
                            if (mem > maxMem) {
                                maxMem = mem;
                                bestMatch = pId;
                            }
                        }
                    }
                }

                if (bestMatch) {

                    const finalStats = await pidusage(bestMatch);
                    return {
                        cpu: Math.min(Math.round(finalStats.cpu), 100),
                        memory: Math.round(finalStats.memory / (1024 * 1024)) || 0
                    };
                }
            } catch (e) {

            }
        }

        return { cpu: 0, memory: 0 };
    } catch (error) {
        return { cpu: 0, memory: 0 };
    }
}

module.exports = {
    getProcessStats
};