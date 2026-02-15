'use server';

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);


export type FileSystemItem = {
    name: string;
    path: string;
    type: 'dir' | 'file' | 'drive';
    details?: string;
};

export async function getDrives(): Promise<FileSystemItem[]> {
    try {
        if (process.platform === 'win32') {
            // Get Name, VolumeName, Size, FreeSpace in CSV format
            const { stdout } = await execAsync('wmic logicaldisk get name,volumename,size,freespace /format:csv');

            const lines = stdout.split('\r\n').filter(line => line.trim().length > 0);
            const drives: FileSystemItem[] = [];

            for (const line of lines) {
                // Node,FreeSpace,Name,Size,VolumeName (CSV order depends on wmic version/locale, but comma separation is key)
                // Actually wmic csv output includes header. 
                // Typical header: Node,FreeSpace,Name,Size,VolumeName

                const parts = line.split(',');
                if (parts.length < 3 || parts[0] === 'Node') continue; // Skip header

                // We need to map positions based on known behavior or just search for the colon like "C:"
                // Safe bet: find element with ":" for Name.
                const nameIdx = parts.findIndex(p => p.includes(':'));
                if (nameIdx === -1) continue;

                const name = parts[nameIdx].trim(); // "C:"

                // Usually VolumeName is the last one or empty
                // Let's try to parse specifically if we know the header, but standard wmic csv is reliable enough if we iterate.
                // Let's use a more robust object mapping if possible, but parsing line by line:

                // Let's run command with explicit columns to control order:
                // wmic logicaldisk get name,volumename,size,freespace /format:csv
                // Header: Node,FreeSpace,Name,Size,VolumeName

                const freeSpace = parseInt(parts[1]) || 0;
                // parts[2] is Name (C:)
                const size = parseInt(parts[3]) || 0;
                const volumeName = parts[4] ? parts[4].trim() : '';

                // Format size to GB
                const sizeGB = (size / (1024 * 1024 * 1024)).toFixed(0);
                const freeGB = (freeSpace / (1024 * 1024 * 1024)).toFixed(0);

                const label = volumeName ? `${volumeName} (${name})` : name;
                const details = size > 0 ? `${freeGB}GB free of ${sizeGB}GB` : '';

                drives.push({
                    name: label,
                    path: name + '\\',
                    type: 'drive',
                    details
                });
            }
            return drives;
        } else {
            return [{ name: 'Root', path: '/', type: 'drive', details: 'Root Directory' }];
        }
    } catch (error) {
        console.error('Failed to list drives:', error);
        return [{ name: 'C:', path: 'C:\\', type: 'drive', details: 'System Drive' }]; // Fallback
    }
}

export async function listDirectories(dirPath: string): Promise<{ success: boolean; items: FileSystemItem[]; error?: string }> {
    try {
        // Handle empty path by returning drives
        if (!dirPath) {
            const drives = await getDrives();
            return { success: true, items: drives };
        }

        if (!fs.existsSync(dirPath)) {
            return { success: false, items: [], error: 'Path does not exist' };
        }

        const items = fs.readdirSync(dirPath, { withFileTypes: true });

        const directories = items
            .filter(item => item.isDirectory() && !item.name.startsWith('$') && !item.name.startsWith('.')) // Filter hidden/system
            .map(item => ({
                name: item.name,
                path: path.join(dirPath, item.name),
                type: 'dir' as const
            }));

        return { success: true, items: directories };
    } catch (error) {
        console.error('Failed to list directory:', error);
        const message = error instanceof Error ? error.message : 'Failed to list directory';
        return { success: false, items: [], error: message };
    }
}
