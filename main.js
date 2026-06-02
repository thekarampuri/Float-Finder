const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs   = require('fs');

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

  // Load the single-file app
  mainWindow.loadFile('FloatFinder.html');

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
