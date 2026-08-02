/**
 * NetworkAdapter
 * 
 * Layer: 0-firmware
 * Responsibility:
 * Virtual hardware metadata for the virtual ethernet network interface.
 */

export class NetworkAdapter {
    static getMetadata() {
        const isOnline = typeof navigator.onLine !== 'undefined' ? navigator.onLine : true;
        return {
            id: 'dev.network.veth0',
            name: 'Lark Virtual Gigabit Ethernet (vETH0)',
            model: 'Lark-NET-1000',
            vendor: 'Lark Technologies Inc.',
            version: '2.0.0',
            type: 'network',
            speed: '1000 Mbps',
            online: isOnline,
            status: isOnline ? 'ONLINE' : 'DISCONNECTED'
        };
    }
}
