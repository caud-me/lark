/**
 * DiskCommands
 * 
 * Responsibility:
 * Provides virtual disk and snapshot commands (disk, diskinfo, snapshots).
 * 
 * Does NOT:
 * - Implement storage drivers
 */
export function registerDiskCommands(cmdService) {
    cmdService.registerCommand({
        name: 'disk',
        description: 'Show disk usage',
        usage: 'disk',
        handler: async (args, context) => {
            const fs = cmdService.registry.get('FileService');
            const usage = fs.getUsage();
            const cap = fs.getCapacity();
            return `Usage: ${(usage/1024).toFixed(2)} KB / ${(cap/1024).toFixed(2)} KB`;
        }
    });

    cmdService.registerCommand({
        name: 'diskinfo',
        description: 'Show virtual disk information',
        usage: 'diskinfo',
        handler: async (args, context) => {
            const diskService = cmdService.registry.get('DiskService');
            if (!diskService) return 'DiskService not available';
            const info = diskService.getDiskInfo();
            const formatBytes = b => b > 1024 * 1024 ? (b / (1024 * 1024)).toFixed(2) + ' MB' : (b > 1024 ? (b / 1024).toFixed(2) + ' KB' : b + ' B');
            
            let out = `Virtual Disk Information:\n`;
            out += `Version: v${info.version}\n`;
            out += `Capacity: ${formatBytes(info.capacity)}\n`;
            out += `Usage: ${formatBytes(info.usage)}\n`;
            out += `Snapshots: ${info.snapshotCount}`;
            return out;
        }
    });

    cmdService.registerCommand({
        name: 'snapshots',
        description: 'Manage virtual disk snapshots',
        usage: 'snapshots [create <label>]',
        handler: async (args, context) => {
            const diskService = cmdService.registry.get('DiskService');
            if (!diskService) return 'DiskService not available';
            if (args.length === 0 || args[0] === 'list') {
                const snaps = diskService.getSnapshots();
                if (snaps.length === 0) return 'No snapshots found.';
                return snaps.map(s => `[${s.id}] ${new Date(s.timestamp).toLocaleString()} - ${s.label} (v${s.diskVersion})`).join('\n');
            } else if (args[0] === 'create') {
                const label = args.slice(1).join(' ') || 'Manual Snapshot';
                const snap = diskService.createSnapshot(label);
                return `Created snapshot: ${snap.id}\nLabel: ${snap.label}`;
            } else {
                return 'Usage: snapshots [create <label>]';
            }
        }
    });
}
