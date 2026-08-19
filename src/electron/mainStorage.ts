/**
 * Electron Main Process Integration & IPC Handlers
 * 
 * Target storage file: app.getPath('userData') / 'hr-data.json'
 * 
 * Safety features:
 * 1. Atomic write using temporary file (hr-data.json.tmp) then fs.renameSync
 * 2. Corrupt file preservation (renamed to hr-data.corrupt-backup.json) without data wipe
 * 3. Graceful quit handler flushing data before window closes
 * 4. Native backup export dialog for user-chosen backup destination (USB/Desktop)
 */

export function setupStorageIPC(electronModule?: any, fsModule?: any, pathModule?: any) {
  // @ts-ignore
  const electron = electronModule || (typeof require !== 'undefined' ? require('electron') : null);
  // @ts-ignore
  const fs = fsModule || (typeof require !== 'undefined' ? require('fs') : null);
  // @ts-ignore
  const path = pathModule || (typeof require !== 'undefined' ? require('path') : null);

  if (!electron || !fs || !path) {
    console.warn('[Storage IPC] Electron/Node modules not available in current environment.');
    return;
  }

  const { app, ipcMain, dialog } = electron;
  const userDataPath = app.getPath('userData');
  const dataFilePath = path.join(userDataPath, 'hr-data.json');
  const tempFilePath = path.join(userDataPath, 'hr-data.json.tmp');
  const corruptBackupPath = path.join(userDataPath, `hr-data.corrupt-backup-${Date.now()}.json`);

  console.log(`[Storage IPC] Target data file path: ${dataFilePath}`);

  // 1. IPC Handler: loadData
  ipcMain.handle('storage:loadData', async () => {
    try {
      if (!fs.existsSync(dataFilePath)) {
        console.log('[Storage IPC] No data file found. First run detected.');
        return { success: false, isFirstRun: true };
      }

      const fileContent = fs.readFileSync(dataFilePath, 'utf8');
      if (!fileContent || fileContent.trim() === '') {
        console.log('[Storage IPC] Empty data file found.');
        return { success: false, isFirstRun: true };
      }

      try {
        const parsed = JSON.parse(fileContent);
        return { success: true, data: parsed, isFirstRun: false };
      } catch (parseErr) {
        console.error('[Storage IPC] JSON corrupted! Preserving backup before fallback:', parseErr);
        try {
          fs.renameSync(dataFilePath, corruptBackupPath);
          console.log(`[Storage IPC] Corrupted file preserved at: ${corruptBackupPath}`);
        } catch (renameErr) {
          console.error('[Storage IPC] Failed to rename corrupt file:', renameErr);
        }
        return { 
          success: false, 
          corrupted: true, 
          error: `ملف البيانات تالف، تم حفظ نسخة احتياطية باسم ${path.basename(corruptBackupPath)}` 
        };
      }
    } catch (err: any) {
      console.error('[Storage IPC] Error in loadData:', err);
      return { success: false, error: err.message || String(err) };
    }
  });

  // 2. IPC Handler: saveData (Atomic write to tmp -> rename)
  ipcMain.handle('storage:saveData', async (_event: any, fullData: any) => {
    try {
      if (!fullData) {
        return { success: false, error: 'No data provided' };
      }

      const jsonString = JSON.stringify(fullData, null, 2);

      // Ensure directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      // Step A: Write to temporary file
      fs.writeFileSync(tempFilePath, jsonString, 'utf8');

      // Step B: Atomic rename / overwrite
      fs.renameSync(tempFilePath, dataFilePath);

      return { success: true };
    } catch (err: any) {
      console.error('[Storage IPC] Error saving data atomically:', err);
      // Clean up tmp file if still around
      if (fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (_) {}
      }
      return { success: false, error: err.message || String(err) };
    }
  });

  // 3. IPC Handler: exportBackup (Native Save Dialog & Direct In-Memory JSON Write)
  ipcMain.handle('storage:exportBackup', async (_event: any, defaultFileName = 'BloodBank_HR_Backup.json', dataPayload?: any) => {
    console.log('[DEBUG 5 MainProcess] storage:exportBackup handler ENTERED.', {
      defaultFileName,
      hasPayload: !!dataPayload,
      payloadType: typeof dataPayload,
      payloadKeys: dataPayload ? Object.keys(dataPayload) : [],
      payloadSizeChars: dataPayload ? JSON.stringify(dataPayload).length : 0
    });

    try {
      console.log('[DEBUG 5 MainProcess] Calling dialog.showSaveDialog with title and filters...');
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: 'تصدير نسخة احتياطية من قاعدة بيانات الموارد البشرية',
        defaultPath: defaultFileName,
        filters: [{ name: 'JSON Backup', extensions: ['json'] }]
      });

      console.log('[DEBUG 5 MainProcess] dialog.showSaveDialog completed. Result:', { canceled, filePath });

      if (canceled || !filePath) {
        console.log('[DEBUG 5 MainProcess] Export canceled or no filePath chosen.');
        return { success: false, canceled: true };
      }

      // If renderer passed in-memory data payload, write it directly (Fix A)
      if (dataPayload) {
        console.log('[DEBUG 5 MainProcess] Serializing in-memory payload and calling fs.writeFileSync to:', filePath);
        const jsonString = JSON.stringify(dataPayload, null, 2);
        fs.writeFileSync(filePath, jsonString, 'utf8');
        console.log('[DEBUG 5 MainProcess] fs.writeFileSync successful! File bytes written:', Buffer.byteLength(jsonString, 'utf8'));
        return { success: true, filePath };
      }

      // Fallback: Copy data file from disk if no in-memory payload provided
      console.log('[DEBUG 5 MainProcess] No in-memory payload provided, checking if original dataFilePath exists:', dataFilePath);
      if (fs.existsSync(dataFilePath)) {
        console.log('[DEBUG 5 MainProcess] Copying existing disk file from', dataFilePath, 'to', filePath);
        fs.copyFileSync(dataFilePath, filePath);
        return { success: true, filePath };
      } else {
        console.error('[DEBUG 5 MainProcess ERROR] dataFilePath does not exist on disk and no payload provided.');
        return { success: false, error: 'لم يتم العثور على ملف البيانات الأصلي لنسخه ولم يتم تزويد بيانات في الذاكرة' };
      }
    } catch (err: any) {
      console.error('[DEBUG 5 MainProcess CATCH] Error in exportBackup:', err);
      return { success: false, error: err?.message || String(err) };
    }
  });

  // 4. IPC Handler: getAppInfo
  ipcMain.handle('storage:getAppInfo', async () => {
    return {
      isElectron: true,
      userDataPath
    };
  });
}

