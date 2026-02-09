'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

import fs from 'fs';

const execAsync = promisify(exec);

export async function performBackup(backupPath: string) {
    try {
        if (!backupPath) {
            return { success: false, message: 'Backup path is required' };
        }

        console.log(`Starting backup to: ${backupPath}`);

        // Execute the backup script using tsx
        // We use 'npx tsx' to ensure we can run the typescript file directly
        const scriptPath = path.join(process.cwd(), 'scripts', 'backup-db.ts');

        // Quote the paths to handle spaces
        const command = `npx tsx "${scriptPath}" "${backupPath}"`;

        const { stdout, stderr } = await execAsync(command);

        console.log('Backup output:', stdout);

        if (stderr) {
            console.warn('Backup stderr:', stderr);
        }

        return { success: true, message: 'Backup completed successfully', details: stdout };
    } catch (error) {
        console.error('Backup failed:', error);
        const message = error instanceof Error ? error.message : 'Backup failed';
        return { success: false, message };
    }
}

export async function listBackups(backupPath: string) {
    try {
        if (!backupPath || !fs.existsSync(backupPath)) {
            return { success: true, backups: [] };
        }

        const items = fs.readdirSync(backupPath).filter(item => {
            const fullPath = path.join(backupPath, item);
            return fs.statSync(fullPath).isDirectory();
        });

        //Sort by name (timestamp) descending
        items.sort().reverse();

        return { success: true, backups: items, path: backupPath };
    } catch (error) {
        console.error('List backups failed:', error);
        // Don't fail the UI, just return empty
        const message = error instanceof Error ? error.message : 'Failed to list backups';
        return { success: false, message, backups: [] };
    }
}

export async function performRestore(backupFullPath: string) {
    try {
        if (!backupFullPath) {
            return { success: false, message: 'Backup path is required' };
        }

        console.log(`Starting restore from: ${backupFullPath}`);
        const scriptPath = path.join(process.cwd(), 'scripts', 'restore-db.ts');

        // Command to run restore script
        const command = `npx tsx "${scriptPath}" "${backupFullPath}"`;

        const { stdout, stderr } = await execAsync(command);
        console.log('Restore output:', stdout);
        if (stderr) console.warn('Restore stderr:', stderr);

        return { success: true, message: 'Restore completed successfully', details: stdout };
    } catch (error) {
        console.error('Restore failed:', error);
        const message = error instanceof Error ? error.message : 'Restore failed';
        return { success: false, message };
    }
}
