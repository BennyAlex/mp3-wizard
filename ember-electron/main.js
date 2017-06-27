/* eslint-env node */
const electron = require('electron')
const {app, BrowserWindow, protocol, Menu, MenuItem} = electron;
const {dirname, join, resolve} = require('path');
const protocolServe = require('electron-protocol-serve');

let mainWindow = null;

// Registering a protocol & schema to serve our Ember application
protocol.registerStandardSchemes(['serve'], {secure: true});
protocolServe({
  cwd: join(__dirname || resolve(dirname('')), '..', 'ember'),
  app,
  protocol,
});

// Uncomment the lines below to enable Electron's crash reporter
// For more information, see http://electron.atom.io/docs/api/crash-reporter/
// electron.crashReporter.start({
//     productName: 'YourName',
//     companyName: 'YourCompany',
//     submitURL: 'https://your-domain.com/url-to-submit',
//     autoSubmit: true
// });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {
  function isDev() {
    return process.mainModule.filename.indexOf('app.asar') === -1;
  }

  const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
  let wid = width * .7, hei = height * .7
  if (wid < 700 || hei < 400) {
    wid = width
    hei = height
  }

  let options = {width: wid, height: hei, show: false, backgroundColor: '#666666'}

  if (isDev()) {
    options['frame'] = true
    mainWindow = new BrowserWindow(options);
    console.log('Running in Development');

    const menu = new Menu();
    menu.append(new MenuItem({
      label: 'Reload',
      role: 'forcereload',
      accelerator: 'F5',
    }));
    menu.append(new MenuItem({
      label: 'Toggle Developer Tools',
      role: 'toggledevtools',
      accelerator: 'F12',
    }));
    menu.append(new MenuItem({
      label: 'Toggle Fullscreen',
      role: 'togglefullscreen',
      accelerator: 'F11',
    }));

    Menu.setApplicationMenu(menu)
  }

  else {
    options['frame'] = false
    mainWindow = new BrowserWindow(options);
    mainWindow.setMenu(null);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
  //mainWindow.maximize();

  // If you want to open up dev tools programmatically, call
  // mainWindow.openDevTools();

  const emberAppLocation = 'serve://dist';

  // Load the ember application using our custom protocol/scheme
  mainWindow.loadURL(emberAppLocation);

  // If a loading operation goes wrong, we'll send Electron back to
  // Ember App entry point
  mainWindow.webContents.on('did-fail-load', () => {
    mainWindow.loadURL(emberAppLocation);
  });

  mainWindow.webContents.on('crashed', () => {
    console.log('Your Ember app (or other code) in the main window has crashed.');
    console.log('This is a serious issue that needs to be handled and/or debugged.');
  });

  mainWindow.on('unresponsive', () => {
    console.log('Your Ember app (or other code) has made the window unresponsive.');
  });

  mainWindow.on('responsive', () => {
    console.log('The main window has become responsive again.');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

// Handle an unhandled error in the main thread
//
// Note that 'uncaughtException' is a crude mechanism for exception handling intended to
// be used only as a last resort. The event should not be used as an equivalent to
// "On Error Resume Next". Unhandled exceptions inherently mean that an application is in
// an undefined state. Attempting to resume application code without properly recovering
// from the exception can cause additional unforeseen and unpredictable issues.
//
// Attempting to resume normally after an uncaught exception can be similar to pulling out
// of the power cord when upgrading a computer -- nine out of ten times nothing happens -
// but the 10th time, the system becomes corrupted.
//
// The correct use of 'uncaughtException' is to perform synchronous cleanup of allocated
// resources (e.g. file descriptors, handles, etc) before shutting down the process. It is
// not safe to resume normal operation after 'uncaughtException'.
process.on('uncaughtException', (err) => {
  console.log('An exception in the main thread was not handled.');
  console.log('This is a serious issue that needs to be handled and/or debugged.');
  console.log(`Exception: ${err}`);
});
