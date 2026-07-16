import { IpcMain, Notification } from 'electron';

export function registerNotificationHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('notifications:send', (_e, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
    return { success: true };
  });
}
