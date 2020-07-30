const {app, screen, BrowserWindow, session, clipboard, ipcMain, protocol, net, shell } = require('electron');

const fs = require('fs');
const path = require('path');
const Url = require('url');
const Store = require('electron-store');
const config = new Store();
const shortcut = require('electron-localshortcut');
//const log = require('electron-log'); 
//Object.assign(console, log.functions)

if (!app.requestSingleInstanceLock()) app.quit()

let splashWindow, mainWindow, promptWindow;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('disable-frame-rate-limit');

ipcMain.on('prompt', (event, message, defaultValue) => {
	promptWindow = createPromptWindow(message, defaultValue),
		returnValue = null

	ipcMain.on('prompt-return', (event, value) => returnValue = value)

	promptWindow.on('closed', () => {
		event.returnValue = returnValue
	})
})

let locationType = (url = '') => {
	if (!isValidURL(url)) return 'unknown'
	const target = new URL(url)
	if (/^(www|comp\.)?krunker\.io$/.test(target.hostname)) {
		if (/^\/docs\/.+\.txt$/.test(target.pathname)) return 'docs'
		switch (target.pathname) {
			case '/': return 'game'
			case '/social.html': return 'social'
			case '/viewer.html': return 'viewer'
			case '/editor.html': return 'editor'
			default: return 'unknown'
		}
	} else return 'external'

	function isValidURL(url = '') {
		try {
			new URL(url)
			return true
		} catch (e) {
			return false
		}
	}
}

let createSplashWindow = () => {
	let win = new BrowserWindow({
		width: 600,
		height: 300,
		center: true,
		resizable: false,
		show: false,
		frame: false,
		transparent: true,
		webPreferences: {
			preload: path.join(process.cwd(), 'app', 'js', 'splash.js')
		}
	})
	//let contents = win.webContents
	win.removeMenu()
	win.loadFile(path.join(process.cwd(), 'app', 'html', 'splash.html'))
	win.once('ready-to-show', () => {
		win.show()
	})
	
	return win
}

let createMainWindow = (url, webContents = null) => {
	const area = screen.getPrimaryDisplay().workArea;
	let win = new BrowserWindow({
		width: area.width * .90,
		height: area.height * .90,
		center: true,
		show: false,
		webContents: webContents,
		webPreferences: {
			nodeIntegration: false,
			webSecurity: false,
			preload: path.join(__dirname, 'preload.js')
		}
	})

	let navigateNewWindow = function(event, url, webContents) {
		event.preventDefault()
		if (locationType(url) == 'external') shell.openExternal(url)
		else if (locationType(url) != 'unknown') event.newGuest = createMainWindow(url, webContents)
	}

	let initSwappers = function() {
		// Resource Swapper
		if (config.get('utilities_enableResourceSwapper', false)) {
			const SWAP_FOLDER = path.join(app.getPath('documents'), '/KrunkerResourceSwapper');	
			  try {fs.mkdir(SWAP_FOLDER, { recursive: true }, e => {});}catch(e){};
			  let swap = { filter: { urls: [] }, files: {} };
			  const allFilesSync = (dir, fileList = []) => {
				  fs.readdirSync(dir).forEach(file => {
					  const filePath = path.join(dir, file);
					  let useAssets = !(/KrunkerResourceSwapper\\(css|docs|img|libs|pkg|sound)/.test(dir));
					  if (fs.statSync(filePath).isDirectory()) {
							  allFilesSync(filePath);
					  } else {
							  let krunk = '*://'+(useAssets ? 'assets.':'')+'krunker.io' + filePath.replace(SWAP_FOLDER, '').replace(/\\/g, '/') + '*';
							  swap.filter.urls.push(krunk);
							  swap.files[krunk.replace(/\*/g, '')] = Url.format({
								  pathname: filePath,
								  protocol: 'file:',
								  slashes: true
							  });
							  console.log(filePath.replace(SWAP_FOLDER, '').replace(/\\/g, '/'), krunk)
					  }
				  });
			  };
			  allFilesSync(SWAP_FOLDER);
			  if (swap.filter.urls.length) {
				session.defaultSession.webRequest.onBeforeRequest(swap.filter, (details, callback) => {
					  callback({ cancel: false, redirectURL: swap.files[details.url.replace(/https|http|(\?.*)|(#.*)/gi, '')] || details.url });
				  });
			  }
		  }
		  // Resource Dumper
		  if (config.get("utilities_dumpResources", false)) {
			  let dumpedURLs = [],
				  dumpPath = path.join(app.getPath("documents"), "KrunkerResourceDumper")
				  session.defaultSession.webRequest.webRequest.onCompleted(details => {
				  const regex = RegExp('^http(s?):\/\/(beta|assets\.)?krunker.io\/*');
				  if (details.statusCode == 200 && regex.test(details.url) && !dumpedURLs.includes(details.url)) {
					  dumpedURLs.push(details.url)
					  const request = net.request(details.url)
					  let raw = ""
					  request.on("response", res => {
						  if (res.statusCode == 200) {
							  res.setEncoding("binary")
							  res.on("data", chunk => raw += chunk)
							  res.on("end", () => {
								  let target = new Url.URL(details.url),
									  targetPath = path.join(dumpPath, target.hostname, path.dirname(target.pathname))
								  if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, {
									  recursive: true
								  })
								  fs.writeFileSync(path.join(dumpPath, target.hostname,  target.pathname == "/" ? "index.html" : target.pathname), raw, "binary")
							  })
						  }
					  })
					  request.end()
				  }
			  })
		  }
	}

	win.removeMenu()
	if (!webContents) {
		initSwappers();
		win.loadURL(url)
	}
	let contents = win.webContents;
	win.once('ready-to-show', () => {
		if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy();
		if (locationType(contents.getURL()) == 'game') {
			win.setFullScreen(config.get('fullScreen', false))
		}
		win.show()
	})

	let isMac = process.platform == 'darwin'

	shortcut.register(win, 'F12', _ => {
		contents.isDevToolsOpened() 
		? contents.closeDevTools() 
		: contents.openDevTools({ mode: 'undocked' });
	})
	shortcut.register(win, isMac ? 'Command+Left' : 'Alt+Left', () => contents.canGoBack() && contents.goBack())
	shortcut.register(win, isMac ? 'Command+Right' : 'Alt+Right', () => contents.canGoForward() && contents.goForward())
	shortcut.register(win, 'CommandOrControl+Shift+Delete', () => {
		contents.session.clearCache().then(err => {
			if (err) {
				console.error(err)
				alert('Failed to clear cache')
			} else {
				app.relaunch()
				app.quit()
			}
		})
	})
	
	shortcut.register(win, 'Escape', () => {
		contents.executeJavaScript('document.exitPointerLock()', true)
	})

	contents.on('dom-ready', () => {
		let windowType = locationType(contents.getURL())
		if (windowType == 'game') {
			shortcut.register(win, 'F6', () => win.loadURL('https://krunker.io/'))
			contents.executeJavaScript('document.exitPointerLock()', true)
		}
	})

	contents.on("new-window", (event, url, frameName, disposition, options) => navigateNewWindow(event, url, options.webContents))
	contents.on("will-navigate", (event, url) => {
		if (locationType(url) == 'external') {
			event.preventDefault()
			shell.openExternal(url)
		} else if (locationType(url) != 'game' && locationType(contents.getURL()) == 'game') navigateNewWindow(event, url)
	})

	// event.preventDefault() didn't work after confirm() or dialog.showMessageBox(), so ignoring beforeunload as a workaround for now
	contents.on('will-prevent-unload', event => event.preventDefault())

	shortcut.register(win, 'F5', () => contents.reload())
	shortcut.register(win, 'Shift+F5', () => contents.reloadIgnoringCache())
	shortcut.register(win, 'F11', () => {
		let full = win.isFullScreen()
		win.setFullScreen(!full)
		if (locationType(contents.getURL()) == 'game') config.set('fullScreen', !full)
	})
	shortcut.register(win, 'CommandOrControl+L', () => clipboard.writeText(contents.getURL()))
	shortcut.register(win, 'CommandOrControl+N', () => mainWindow = createMainWindow('https://krunker.io/'))
	shortcut.register(win, 'CommandOrControl+Shift+N', () => mainWindow = createMainWindow(contents.getURL()))
	shortcut.register(win, 'CommandOrControl+Alt+R', () => {
		app.relaunch()
		app.quit()
	})

	win.on('closed', () => {
		if (splashWindow) splashWindow = null;
		if (promptWindow) promptWindow = null;
		if (mainWindow) mainWindow = null;
	})

	return win
}

let createPromptWindow = (message, defaultValue) => {
	let win = new BrowserWindow({
		width: 480,
		height: 240,
		center: true,
		show: false,
		frame: false,
		alwaysOnTop: true,
		resizable: false,
		transparent: true,
		webPreferences: {
			preload: path.join(process.cwd(), 'app', 'js', 'prompt.js')
		}
	})
	let contents = win.webContents
	
	win.removeMenu()
	win.loadFile(path.join(process.cwd(), 'app', 'html', 'prompt.html'))
	win.once('ready-to-show', () => {
		win.show()
		contents.send('prompt-data', message, defaultValue)
	})
	win.on('closed', () => {
		if (promptWindow) promptWindow = null;
	})
	
	return win
}

app.once('ready', () => {
	protocol.registerFileProtocol('file', (request, callback) => callback(request.url.replace('file:///', ''))); 
	splashWindow = createSplashWindow()
	setTimeout(()=> mainWindow = createMainWindow('https://krunker.io/'), 3000);
})

app.on('activate', () => {
	if (mainWindow === null && (splashWindow === null || splashWindow.isDestroyed())) createSplashWindow();
});

app.once('before-quit', () => {
	shortcut.unregisterAll();
	mainWindow.close();
});

app.on('window-all-closed', () => app.quit());
app.on('quit', () => app.quit());
