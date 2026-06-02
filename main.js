const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');
const os = require('os');

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEfNJfHNyv7RebIz61Hp/p1M5kHw4q
QstAgLPJGcd+9Tnlua4WqTWmTWZem/uqZj62kan7eRbCDzVU+KPm32sS4Q==
-----END PUBLIC KEY-----`;

function getMachineId() {
  try {
    let uuid = '', cpu = '', disk = '';
    if (process.platform === 'win32') {
      try { uuid = execSync('wmic csproduct get uuid').toString().split('\n')[1].trim(); } catch(e){}
      try { cpu = execSync('wmic cpu get processorid').toString().split('\n')[1].trim(); } catch(e){}
      try { disk = execSync('wmic diskdrive get serialnumber').toString().split('\n')[1].trim(); } catch(e){}
    }
    let rawId = `${uuid}|${cpu}|${disk}`;
    if (rawId === '||') {
      const net = os.networkInterfaces();
      let mac = '';
      for (const key in net) {
        const iface = net[key].find(details => !details.internal && details.mac && details.mac !== '00:00:00:00:00:00');
        if (iface) { mac = iface.mac; break; }
      }
      rawId = `${mac}|${os.hostname()}`;
    }
    
    const hash = crypto.createHash('sha256').update(rawId).digest('hex').toUpperCase();
    return `${hash.substring(0,8)}-${hash.substring(8,16)}-${hash.substring(16,24)}-${hash.substring(24,32)}`;
  } catch (error) {
    return 'UNKNOWN-MACHINE-ID';
  }
}

function verifyLicense(licenseKeyBase64) {
  try {
    if (!licenseKeyBase64) return false;
    const machineId = getMachineId();
    const verify = crypto.createVerify('SHA256');
    verify.update(machineId);
    return verify.verify(PUBLIC_KEY, licenseKeyBase64, 'base64');
  } catch (err) {
    return false;
  }
}

// Keep a global reference to prevent garbage collection
let mainWindow;

// Resolve icon path — skip gracefully if file doesn't exist
const iconPath = path.join(__dirname, 'assets', 'icon.ico');
const iconExists = fs.existsSync(iconPath);

function createWindow() {
  const winOptions = {
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Float Finder',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,   // allow local file:// image access
    },
    backgroundColor: '#f0f0f0',
    show: false,            // show after ready-to-show for smooth launch
  };

  if (iconExists) winOptions.icon = iconPath;

  mainWindow = new BrowserWindow(winOptions);

  // Check license
  const licensePath = path.join(app.getPath('userData'), 'license.dat');
  let hasLicense = false;
  try {
    if (fs.existsSync(licensePath)) {
      const savedKey = fs.readFileSync(licensePath, 'utf8').trim();
      if (verifyLicense(savedKey)) {
        hasLicense = true;
      }
    }
  } catch (e) {}

  if (hasLicense) {
    mainWindow.loadFile('FloatFinder.html');
  } else {
    mainWindow.loadFile('License.html');
  }

  // Reveal window only once content is painted — eliminates white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Route any window.open() calls to the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── Application Menu ──────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { type: 'separator' },
        { role: 'quit', label: 'Exit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload',        label: 'Reload' },
        { role: 'forceReload',   label: 'Force Reload' },
        { type: 'separator' },
        { role: 'zoomIn',        label: 'Zoom In'    },
        { role: 'zoomOut',       label: 'Zoom Out'   },
        { role: 'resetZoom',     label: 'Reset Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Fullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'maximize' },
        { role: 'close'    }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Float Finder',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Float Finder',
              message: 'Float Finder v16',
              detail: [
                'A textile float detection tool for',
                'Jacquard / embroidery design.',
                '',
                'Developed for Balaji & Brother.',
                '',
                `Electron: ${process.versions.electron}`,
                `Node:     ${process.versions.node}`,
                `Chrome:   ${process.versions.chrome}`,
              ].join('\n'),
              buttons: ['OK'],
              ...(iconExists ? { icon: iconPath } : {})
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App Lifecycle ─────────────────────────────────────────────
ipcMain.handle('show-save-dialog', async (event, options) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, options);
  return { canceled, filePath };
});
ipcMain.handle('save-file', async (event, filePath, buffer) => {
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return true;
});

// Licensing IPC
ipcMain.handle('get-machine-id', () => getMachineId());
ipcMain.handle('submit-license', (event, key) => {
  if (verifyLicense(key)) {
    const licensePath = path.join(app.getPath('userData'), 'license.dat');
    fs.writeFileSync(licensePath, key.trim());
    mainWindow.loadFile('FloatFinder.html');
    return true;
  }
  return false;
});
ipcMain.on('quit-app', () => {
  app.quit();
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
