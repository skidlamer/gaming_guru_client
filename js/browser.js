//const Module = require('module');
require('v8-compile-cache')
const electron = require('electron'); //globalShortcut
const { remote, ipcRenderer } = electron;
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const config = new Store();
let isDebug = false;
const isProxy = Symbol("isProxy");
Object.defineProperty(CanvasRenderingContext2D.prototype, 'save', {
    value: CanvasRenderingContext2D.prototype.save,
    writable: false
});
window.client = {
    electron: electron,
    ipc: ipcRenderer,
    remote: remote,
    path: path,
    config: config,
    fs: fs
}
class Utilities {
    constructor() {
        this.downKeys = new Set();
        this.mouse = {
            left: false,
            middle: false,
            right: false
        }
        this.xorKey = null;
        this.settings = null;
        this.lists = {
            renderESP: {
                off: "Off",
                walls: "Walls",
                twoD: "2d"
            },
            renderChams: {
                off: "Off",
                white: "White",
                blue: "Blue",
                teal: "Teal",
                purple: "Purple",
                green: "Green",
                yellow: "Yellow",
                red: "Red",
                rainbow: "Rainbow"
            },
            autoBhop: {
                off: "Off",
                autoJump: "Auto Jump",
                keyJump: "Key Jump",
                autoSlide: "Auto Slide",
                keySlide: "Key Slide"
            },
            autoAim: {
                off: "Off",
                assist: "Aim Assist",
                silent: "Silent Aim",
                trigger: "Trigger Bot",
                quickScope: "Quick Scope"
            },
        }
        this.css = {
            customFontsFix: `.purchBtn, .purchInfoBtn {  position: absolute; bottom: 11px; } .scrollItem > div { overflow: auto; }`,
            noTextShadows: `*, .button.small, .bigShadowT { text-shadow: none !important; }`,
            hideAdverts: `#aMerger, #endAMerger { display: none !important }`,
            hideSocials: `.headerBarRight > .verticalSeparator, .imageButton { display: none }`
        };
        this.eventListeners();
    }

    createSettings() {

        Object.entries(this.css).forEach(entry => this.css[entry[0]] = this.createElement("style", entry[1]));

        this.settings = {

            hideAdverts: {
                name: "Hide Advertisments",
                pre: "<div class='setHed'>Rendering</div>",
                val: true,
                html: () => this.generateSetting("checkbox", "hideAdverts"),
                set: (value, init) => {
                    if (value) document.head.appendChild(this.css.hideAdverts)
                    else if (!init) this.css.hideAdverts.remove()
                }
            },
            showExitBtn: {
                name: "Show Exit Button",
                val: false,
                html: () => this.generateSetting("checkbox", "showExitBtn"),
                set: val => {
                    const btn = "<div class='button small buttonR' id='menuExit' onmouseenter='playTick()' onclick='window.client.remote.app.quit()'>Exit</div>";
                    const node = document.getElementById("subLogoButtons");
                    if (node && node.hasChildNodes()) {
                        const menuExit = document.getElementById("menuExit");
                        if (val) {
                            if (!menuExit) node.insertAdjacentHTML("beforeend", btn)
                        } else {
                            if (menuExit) node.removeChild(menuExit)
                        }
                    }
                }
            },
            customBillboard: {
                name: "Custom Billboard Text",
                val: "",
                html: () => this.generateSetting("text", "customBillboard", "Custom Billboard Text")
            },
            renderESP: {
              name: "Player ESP Type",
              val: "off",
              html: () => this.generateSetting("select", "renderESP", this.lists.renderESP),
              set: val => {
                this.nametags = val == "off" ? undefined : val;
              }
            },
            renderTracers: {
              name: "Player Tracers",
              val: false,
              html: () => this.generateSetting("checkbox", "renderTracers"),
            },
            renderChams: {
                name: "Player Chams",
                val: "off",
                html: () => this.generateSetting("select", "renderChams", this.lists.renderChams)
            },
            renderTimer: {
                name: "Rainbow Loop Interval",
                val: 100,
                min: 1,
                max: 500,
                step: 1,
                html: () => this.generateSetting("slider", "renderTimer"),
            },
            renderWireFrame: {
                name: "Player Wireframe",
                val: false,
                html: () => this.generateSetting("checkbox", "renderWireFrame"),
            },
            autoAim: {
                name: "Auto Aim Type",
                pre: "<div class='setHed'>Weapon</div>",
                val: "off",
                html: () => this.generateSetting("select", "autoAim", this.lists.autoAim)
            },
            autoAimOffset: {
                name: "Aim Offset",
                val: 8.8,
                min: 0,
                max: 11,
                step: 0.1,
                html: () => this.generateSetting("slider", "autoAimOffset"),
                set: value => this.autoAimOffset = parseFloat(value)
            },
            wallPenetrate: {
                name: "Aim through Penetratables",
                val: false,
                html: () => this.generateSetting("checkbox", "wallPenetrate"),
                //set: val => {
                //if (isDefined(this.penetrate)) this.penetrate(val);
                //}
            },
            autoReload: {
                name: "Auto Reload",
                val: false,
                html: () => this.generateSetting("checkbox", "autoReload"),
            },
            fastReload: {
                name: "Fast Reload",
                val: false,
                html: () => this.generateSetting("checkbox", "fastReload"),
            },
            autoBhop: {
                name: "Auto Bhop Type",
                pre: "<div class='setHed'>Player</div>",
                val: "off",
                html: () => this.generateSetting("select", "autoBhop", this.lists.autoBhop)
            },
            /*
            challengeMode: {
              name: "Force Challenge Mode",
              pre: "<div class='setHed'>Gameplay</div><hr>",
              val: localStorage.getItem("kro_setngss_challMode")||false,
              html: () => this.generateSetting("checkbox", "challengeMode"),
              set: val => {
                if (utils.isDefined(window.toggleChal)) window.toggleChal(val);
              }
            },*/
            autoClickPlay: {
                name: "Auto Click Play",
                pre: "<div class='setHed'>Gameplay</div>",
                val: false,
                html: () => this.generateSetting("checkbox", "autoClickPlay"),
                set: (val, init) => {
                    if (!init && val) {
                        window.alert('Press Escape to disable autoclick')
                    }
                }
            },
            dumpResources: {
                name: "Dump Game Resources",
                pre: "<div class='setHed'>Resources</div>",
                val: false,
                html: () => this.generateSetting("checkbox", "dumpResources"),
                set: (_, init) => {
                    if (!init) {
                        if (window.confirm('Restart now to apply change?')) {
                            window.client.remote.app.relaunch();
                            window.client.remote.app.quit();
                        } else {
                            // Do nothing!
                        }
                    }
                }
            },
            enableResourceSwapper: {
                name: "Enable Resource Swapper",
                val: false,
                html: () => this.generateSetting("checkbox", "enableResourceSwapper"),
                set: (_, init) => {
                    if (!init) {
                        if (window.confirm('Restart now to apply change?')) {
                            window.client.remote.app.relaunch();
                            window.client.remote.app.quit();
                        } else {
                            // Do nothing!
                        }
                    }
                }
            },
        };
        // Inject Html
        let waitForWindows = setInterval(_ => {
            if (window.windows) {
                const menu = window.windows[21];
                menu.header = "Config";
                menu.gen = _ => {
                    var tmpHTML = `<div style='text-align:center'> <a onclick='window.open("https://skidlamer.github.io/")' class='menuLink'>GamingGurus Settings</center></a> <hr> </div>`;
                    for (const key in this.settings) {
                        if (this.settings[key].pre) tmpHTML += this.settings[key].pre;
                        tmpHTML += "<div class='settName' id='" + key + "_div' style='display:" + (this.settings[key].hide ? 'none' : 'block') + "'>" + this.settings[key].name +
                            " " + this.settings[key].html() + "</div>";
                    }
                    tmpHTML += `<br>
                <a onclick='window.utilities.openItem(window.client.path.join(window.client.remote.app.getPath("documents"), "/KrunkerResourceSwapper"), true)' class='menuLink'>Open SwapDir</a>
                &nbsp;|&nbsp;
                <a onclick='window.utilities.openItem(window.client.path.join(window.client.remote.app.getPath("documents"), "/KrunkerResourceDumper"), true)' class='menuLink'>Open DumpDir</a>
                <hr>
                <a onclick='window.utilities.resetSettings()' class='menuLink'>Reset Settings</a>`
                    return tmpHTML;
                };
                clearInterval(waitForWindows);
            }
        }, 100);

        // setupSettings
        for (const key in this.settings) {
            this.settings[key].def = this.settings[key].val;
            if (!this.settings[key].disabled) {
                var tmpVal = window.client.config.get(`utilities_${key}`, null);
                this.settings[key].val = tmpVal !== null ? tmpVal : this.settings[key].val;
                if (this.settings[key].val == "false") this.settings[key].val = false;
                if (this.settings[key].val == "true") this.settings[key].val = true;
                if (this.settings[key].val == "undefined") this.settings[key].val = this.settings[key].def;
                if (this.settings[key].set) this.settings[key].set(this.settings[key].val, true);
            }
        }
    }

    generateSetting(type, name, extra) {
        switch (type) {
            case 'checkbox':
                return `<label class="switch"><input type="checkbox" onclick="window.utilities.setSetting('${name}', this.checked)" ${this.settings[name]['val'] ? 'checked' : ''}><span class="slider"></span></label>`;
            case 'slider':
                return `<span class='sliderVal' id='slid_utilities_${name}'>${this.settings[name].val}</span><div class='slidecontainer'><input type='range' min='${this.settings[name].min}' max='${this.settings[name].max}' step='${this.settings[name].step}' value='${this.settings[name].val}' class='sliderM' oninput="window.utilities.setSetting('${name}', this.value)"></div>`
            case 'select':
                let temp = `<select onchange="window.utilities.setSetting(\x27${name}\x27, this.value)" class="inputGrey2">`;
                for (let option in extra) temp += '<option value="' + option + '" ' + (option == this.settings[name]['val'] ? 'selected' : '') + '>' + extra[option] + '</option>';
                return temp += '</select>';
            default:
                return `<input type="${type}" name="${type}" id="slid_utilities_${name}"\n${'color' == type ? 'style="float:right;margin-top:5px"' : `class="inputGrey2" placeholder="${extra}"`}\nvalue="${this.settings[name]['val']}" oninput="window.utilities.setSetting(\x27${name}\x27, this.value)"/>`;
        }
    }

    resetSettings() {
        if (confirm("Are you sure you want to reset all your client settings? This will also refresh the page")) {
            Object.keys(localStorage).filter(x => x.includes("utilities_")).forEach(x => localStorage.removeItem(x));
            location.reload();
        }
    }

    setSetting(t, e) {
        this.settings[t].val = e;
        window.client.config.set(`utilities_${t}`, e);
        if (document.getElementById(`slid_utilities_${t}`)) document.getElementById(`slid_utilities_${t}`).innerHTML = e;
        if (this.settings[t].set) this.settings[t].set(e);
    }

    saveVal(name, val) {
        if (this.isDefined(this.isDefineStorage)) localStorage.setItem(name, val);
    }

    deleteVal(name) {
        if (this.isDefined(Storage)) localStorage.removeItem(name);
    }

    getSavedVal = function(name) {
        if (this.isDefined(Storage)) return localStorage.getItem(name);
        return null;
    }

    fixMenuSettings() {
        [...document.querySelectorAll(".menuItemIcon")].forEach(el => el.style.height = "60px");
    }

    openItem(fullpath, dir = false, allowMake = true) {
        if (allowMake && !window.client.fs.existsSync(fullpath)) {
            !client.fs.existsSync(window.client.path.dirname(fullpath)) && window.client.fs.mkdirSync(window.client.path.dirname(fullpath), {
                recursive: true
            })
            dir ? window.client.fs.mkdirSync(fullpath) : client.fs.writeFileSync(fullpath, "")
        }
        window.client.remote.shell.showItemInFolder(window.client.path.resolve(fullpath))
    }

    eventListeners() {
        this.createListener(document, "keyup", event => {
            if (this.downKeys.has(event.code)) this.downKeys.delete(event.code)
        })

        this.createListener(document, "keydown", event => {
            if (event.code == "F1") {
                this.toggleMenu();
            }
            if ('INPUT' == document.activeElement.tagName || !window.endUI && window.endUI.style.display) return;
            switch (event.code) {
                case 'Escape':
                    this.setSetting("autoClickPlay", false);
                    break;
                case 'NumpadSubtract':
                    console.dir(this)
                    break;
                default:
                    if (!this.downKeys.has(event.code)) this.downKeys.add(event.code);
                    break;
            }
        })

        this.createListener(document, "mousedown", event => {
            switch (event.button) {
                case 0:
                    this.mouse.left = true;
                    break;
                case 1:
                    this.mouse.middle = true;
                    break;
                case 2:
                    this.mouse.right = true;
                    break;
                default:
                    break;
            }
        })

        this.createListener(document, "mouseup", event => {
            switch (event.button) {
                case 0:
                    this.mouse.left = false;
                    break;
                case 1:
                    this.mouse.middle = false;
                    this.toggleMenu();
                    break;
                case 2:
                    this.mouse.right = false;
                    break;
                default:
                    break;
            }
        })
    }
    isType(item, type) {
        return typeof item === type;
    }
    isDefined(object) {
        return !this.isType(object, "undefined")
    }
    createListener(elm, type, callback = null) {
        if (!this.isDefined(elm)) {
            alert("Failed creating " + type + "listener");
            return
        }
        elm.addEventListener(type, event => callback(event));
    }
    createElement(type, html, id) {
        let newElement = document.createElement(type)
        if (id) newElement.id = id
        newElement.innerHTML = html
        return newElement
    }
    toggleMenu() {
        let lock = document.pointerLockElement || document.mozPointerLockElement;
        if (lock) document.exitPointerLock();
        window.showWindow(22, 1);
        console.dir(window.windows[23])
    }
}
window.utilities = new Utilities();

const patchesDom = new Map()
    .set("window", [/\/(!function)/, `/${Utilities.toString()} window.utilities = new Utilities(); $1`])
//   .set("wasm", [/(function\(\w+,\w+,\w+\){var \w+=){/, `$1 window['${mask}']['wasm'] = {`])

const patchesGame = new Map()
    //.set("inView", [/if\((!\w+\['\w+'])\)continue;/, "if($1)void 0;"])
    .set("inView", [/if\((!\w+\['\w+'])\)continue;/, "if($1&&void 0 === window.utilities.nametags)continue;"])
    .set("exports", [/(function\(\w,\w,(\w)\){)'use strict';(\(function\((\w)\){)\//, `$1$3window.utilities.exports=$2.c;/`])

const vars = new Map()
    .set("socket", {
        regex: /connect'\(\w+,\w+,\w+\){if\(!this\['(\w+)']\)/,
        pos: 1,
    })
    .set("xDire", {
        regex: /this\['(\w+)']=\w+\['round']\(0x3\),this\['\w+']=\w+\['round']\(0x3\)/,
        pos: 1,
    })
    .set("yDire", {
        regex: /this\['(\w+)']>Math\['PI']\/0x2\?this\['\w+']=Math\['PI']\/0x2/,
        pos: 1,
    })
    .set("isYou", {
        regex: /if\(!\w+\['(\w+)']\){var \w+=new Module\['Player']\(\)/,
        pos: 1,
    })
    .set("inView", {
        regex: /if\(!\w+\['(\w+)']\)continue/,
        pos: 1,
    })
    .set("ammos", {
        regex: /\['noReloads']\|\|!\w\['\w+']&&\w\['(\w+)']/,
        pos: 1,
    })
    .set("weaponIndex", {
        regex: /\['noReloads']\|\|!\w\['\w+']&&\w\['\w+']\[\w\['(\w+)']]/,
        pos: 1,
    })
    .set("procInputs", {
        regex: /this\['(\w+)']=function\((\w+),(\w+),\w+,\w+\){(this)\['recon']/,
        pos: 1,
    })
    .set("swapWeapon", {
        regex: /\w+\['(\w+)']\(this,null,null,void 0x0,0x0,\w+\):\w+\[0xa]&&\w+\['\w+']\(this,\w+\[0xa],!0x1,void 0x0,void 0x0,\w+\)/,
        pos: 1,
    })
    .set("reloadTimer", {
        regex: /\['noReloads']\|\|!\w\['(\w+)']&&\w\['\w+']/,
        pos: 1,
    })
    .set("aimVal", {
        regex: /this\['(\w+)']-=0x1\/\(this\['weapon']\['aimSpeed']/, //&&0x1==\w\['(\w+)']&&!\w/,
        pos: 1,
    })
    .set("pchObjc", {
        regex: /0x0,this\['(\w+)']=new \w+\['Object3D']\(\),this/,
        pos: 1,
    })
    .set("didShoot", {
        regex: /--,\w+\['(\w+)']=!0x0/,
        pos: 1,
    })
    .set("nAuto", {
        regex: /'Single\\x20Fire','varN':'(\w+)'/,
        pos: 1,
    })
    .set("crouchVal", {
        regex: /this\['(\w+)']\+=\w\['crouchSpeed']\*\w+,0x1<=this\['\w+']/,
        pos: 1,
    })
    .set("recoilAnimY", {
        regex: /this\['(\w+)']=0x0,this\['recoilForce']=0x0/,
        pos: 1,
    })
    .set("canSee", {
        regex: /this\['(\w+)']=function\(\w+,\w+,\w+,\w+,\w+,\w+\){if\(!\w+\)return!0x1;/,
        pos: 1,
    })
    .set("getWorldPosition", {
        regex: /\['display'],\w+=\w+\['camera']\['(\w+)']\(\);/,
        pos: 1,
    })
    .set("maxHealth", {
        regex: /this\['health']\/this\['(\w+)']\?/,
        pos: 1,
    })
    .set("objInstances", {
        regex: /\w+\['genObj3D']\(0x0,0x0,0x0\);if\(\w+\['(\w+)']=\w+\['genObj3D']/,
        pos: 1,
    })

const log = {
    msg: console.log.bind(console, '%c MSG ', "color: #212121; font-weight:bold; background-color:#b0bec5; padding: 3px 6px; border-radius: 2px;"),
    error: console.log.bind(console, '%c ERROR ', "color: #ffebee; font-weight:bold; background-color:#c62828; padding: 3px 6px; border-radius: 2px;"),
    warn: console.log.bind(console, '%c WARN ', "color: #fff3e0; font-weight:bold; background-color:#f4511e; padding: 3px 6px; border-radius: 2px;"),
    info: console.log.bind(console, '%c INFO ', "color: #ede7f6; font-weight:bold; background-color:#651fff; padding: 3px 6px; border-radius: 2px;"),
    success: console.log.bind(console, '%c SUCCESS ', "color: #e8f5e9; font-weight:bold; background-color:#2e7d32; padding: 3px 6px; border-radius: 2px;"),
    dir: console.dir.bind(console),
    log: console.info.bind(console),
    start: console.groupCollapsed.bind(console),
    end: console.groupEnd.bind(console),
};

if (!isDebug) {
    log.msg = log.dir = log.error = log.warn = log.info = log.success = log.start = log.end = () => {}
}
//log.success("Window Key:", mask);
log.info(window);
let isType = (item, type) => {
    return typeof item === type
}
let isDefined = object => {
    return !isType(object, "undefined") && object
}
let isNative = fn => (/^function\s*[a-z0-9_\$]*\s*\([^)]*\)\s*\{\s*\[native code\]\s*\}/i).test('' + fn);
let isEmpty = obj => {
    if (obj == null) return true;
    if (Array.isArray(obj) || this.isType(obj, "string")) return obj.length === 0;
    for (var key in obj)
        if (obj.hasOwnProperty(key)) return false;
    return true;
};
let ObjectEntries = (object, callback) => {
    let descriptors = Object.getOwnPropertyDescriptors(object);
    Object.entries(descriptors).forEach(([key, {
        value,
        get,
        set,
        configurable,
        enumerable,
        writable
    }]) => callback([object, key, value, get, set, configurable, enumerable, writable]));
}

let proxyHook = (info, targetFn, callbackFn) => {
    if (targetFn[isProxy]) return targetFn;
    log.start(
        "HOOKED ",
        info.name ? info.name : targetFn.name ? targetFn.name : "anonymous",
        info.type
    );
    log.dir(targetFn);
    log.msg(targetFn);
    log.end();
    switch (info.type) {
        case "apply":
            return new Proxy(targetFn, {
                get: function(target, key) {
                    const value = Reflect.get(target, key);
                    return key === isProxy ? true : value;
                },
                apply: function(target, parent, args) {
                    return callbackFn(target, parent, args);
                },
            });
        case "construct":
            return new Proxy(targetFn, {
                get: function(target, key) {
                    const value = Reflect.get(target, key);
                    return key === isProxy ? true : value;
                },
                construct: function(target, args) {
                    return callbackFn(target, args);
                },
            });
        default:
            log.error("ERROR unknown proxied hook method");
            return;
    }
};

let patchScript = (type, script) => {
    let patches = type.toUpperCase();
    if (patches == "DOM") patches = patchesDom;
    else if (patches == "GAME") patches = patchesGame;
    else return;
    log.start("PATCHING " + type);
    for (let [name, arr] of patches) {
        let found = arr[0].exec(script);
        if (found) {
            log.start(name);
            for (let i = 0; i < found.length; ++i) {
                if (i == 0) {
                    log.msg("Regex ", arr[0]);
                    log.msg("Found ", found[i]);
                    log.msg("Index ", found.index);
                } else log.msg("$", i, " ", found[i]);
            }
            log.msg("Replace " + arr[1]);
            //const patched = String.prototype.replace.call(script, item[0], item[1]);
            const patched =
                script.substr(0, found.index) +
                String.prototype.replace.call(
                    script.substr(found.index, script.length),
                    arr[0],
                    arr[1]
                );
            if (script === patched) {
                log.error(`Failed to patch ${name}`);
                continue;
            } else {
                script = patched;
                log.success("patched");
            }
            log.end();
        } else {
            log.error("Failed to find " + name);
        }
    }
    log.end();
    return script;
};

let setVars = (script) => {
    log.start("DEOBFUSCATE ");
    for (const [name, object] of vars.entries()) {
        let result = object.regex.exec(script);
        if (result) {
            object.val = result[object.pos];
            log.success("found: ", name, " at ", result.index, " value: ", object.val);
        } else {
            const str = "Failed to find " + name;
            log.error(str);
            alert(str);
            object.val = null;
        }
    }
    log.end();
}

let getVar = name => vars.get(name).val;

let getDir = function(x1, y1, x2, y2) {
    return Math.atan2(y1 - y2, x1 - x2);
};

let getDistance = function(x1, y1, x2, y2) {
    return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
};

let getD3D = function(x1, y1, z1, x2, y2, z2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    var dz = z1 - z2;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

let getAngleDst = function(a, b) {
    return Math.atan2(Math.sin(b - a), Math.cos(a - b));
};

let getXDire = function(x1, y1, z1, x2, y2, z2) {
    var h = Math.abs(y1 - y2);
    var dst = getD3D(x1, y1, z1, x2, y2, z2);
    return (Math.asin(h / dst) * ((y1 > y2) ? -1 : 1));
};

let lineInRect = function(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2) {
    var t1 = (x1 - lx1) * dx;
    var t2 = (x2 - lx1) * dx;
    var t3 = (y1 - ly1) * dy;
    var t4 = (y2 - ly1) * dy;
    var t5 = (z1 - lz1) * dz;
    var t6 = (z2 - lz1) * dz;
    var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
    if (tmax < 0) return false;
    if (tmin > tmax) return false;
    return tmin;
};

let getCanSee = function(game, from, toX, toY, toZ, boxSize) {
    if (!game || !from)
        return 0;
    boxSize = boxSize || 0;
    const cameraHeight = 1.5;
    for (var obj, dist = getD3D(from.x, from.y, from.z, toX, toY, toZ), xDr = getDir(from.z, from.x, toZ, toX), yDr = getDir(getDistance(from.x, from.z, toX, toZ), toY, 0, from.y), dx = 1 / (dist * Math.sin(xDr - Math.PI) * Math.cos(yDr)), dz = 1 / (dist * Math.cos(xDr - Math.PI) * Math.cos(yDr)), dy = 1 / (dist * Math.sin(yDr)), yOffset = from.y + (from.height || 0) - cameraHeight, i = 0; i < game.map.manager.objects.length; ++i)
        if (!(obj = game.map.manager.objects[i]).noShoot && /*obj.active &&*/ !obj.transparent) {
            var tmpDst = lineInRect(from.x, from.z, yOffset, dx, dz, dy, obj.x - Math.max(0, obj.width - boxSize), obj.z - Math.max(0, obj.length - boxSize), obj.y - Math.max(0, obj.height - boxSize), obj.x + Math.max(0, obj.width - boxSize), obj.z + Math.max(0, obj.length - boxSize), obj.y + Math.max(0, obj.height - boxSize));
            if (tmpDst && 1 > tmpDst)
                return tmpDst;
        }
    var terrain = game.map.terrain;
    if (terrain) {
        var terrainRaycast = terrain.raycast(from.x, -from.z, yOffset, 1 / dx, -1 / dz, 1 / dy);
        if (terrainRaycast)
            return getD3D(from.x, from.y, from.z, terrainRaycast.x, terrainRaycast.z, -terrainRaycast.y);
    }
    return null;
}

let sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let waitFor = async (test, timeout_ms = 20000, doWhile = null) => {
    return new Promise(async (resolve, reject) => {
        if (typeof timeout_ms != "number")
            reject(
                "Timeout argument not a number in waitFor(selector, timeout_ms)"
            );
        var freq = 100;
        var result;
        // wait until the result is true, or timedout
        while (
            result === undefined ||
            result === false ||
            result === null ||
            result.length === 0
        ) {
            if (doWhile) doWhile();
            // for non arrays, length is undefined, so != 0
            if (timeout_ms % 1000 < freq)
                log.warn("%c" + "waiting for: " + test, "color:#809fff");
            if ((timeout_ms -= freq) < 0) {
                log.error("%c" + "Timeout : " + test, "color:#cc2900");
                resolve(false);
                return;
            }
            await sleep(freq);
            result = typeof test === "string" ? eval(test) : test(); // run the test and update result variable
        }
        // return result if test passed
        log.success("Passed: ", test);
        resolve(result);
    });
};

let findExports = () => {
    const found = new Set();
    const vars = new Map([
        ["utility", ["getAnglesSSS", "rgbToHex"]],
        ["serverVars", ["serverTickRate", "camChaseTrn", "cameraHeight", "hitBoxPad"]],
        ["overlay", ["render", "canvas"]],
        ["THREE", ["ACESFilmicToneMapping", "TextureLoader", "ObjectLoader"]],
        ["colors", ["challLvl", "getChallCol"]],
        ["ui", ["showEndScreen", "toggleControlUI", "toggleEndScreen", "updatePlayInstructions"]],
        ["ws", ["socketId", "socketReady"]],
        //["msgpack", ["createCodec", "filter", "install"]],
    ])
    return waitFor(_ => found.size === vars.size, 20000, () => {
        vars.forEach((arr, name, map) => {
            ObjectEntries(window.utilities.exports, ([rootObject, rootKey, rootValue, rootGet, rootSet, rootConfigurable, rootEnumerable, rootWritable]) => {
                ObjectEntries(rootValue.exports, ([object, key, value, get, set, configurable, enumerable, writable]) => {
                    if (!found.has(name) && arr.includes(key)) {
                        found.add(name);
                        window.utilities[name] = rootValue.exports;
                    }
                })
            })
        })
    })
}

let nativeHooks = () => {
    Response.prototype.arrayBuffer = proxyHook({
            type: "apply",
            name: "Response.prototype.arrayBuffer",
        },
        Response.prototype.arrayBuffer,
        (target, that, [bufferSource, importObject]) => {
            return (async function(key) {
                let array = await target.apply(that, [bufferSource, importObject]);
                array = await Array.from(new Uint8Array(array));
                array = await array.map((code) => String.fromCharCode(code ^ key));
                let string = array.join("");
                setVars(string);
                string = patchScript("game", string);
                array = Uint8Array.from(
                    string.split("").map((char) => char.charCodeAt(0) ^ key)
                );
                return array.buffer;
            })(0x69);
        }
    );

    AudioParam.prototype.setTargetAtTime = (args) => {
        return 0;
    };

    return new Promise((resolve, reject) => {
        /* resolve(respoce) or reject(error) */
        resolve();
    });
};

let gameHooks = () => {

    // Populate Vars
    let frameCount = 0;
    const twoPI = Math.PI * 2;
    const halfPI = Math.PI / 2;
    const socket = getVar("socket");
    const xDire = getVar("xDire");
    const yDire = getVar("yDire");
    const maxHealth = getVar("maxHealth");
    const isYou = getVar("isYou");
    const inView = getVar("inView");
    const ammos = getVar("ammos");
    const weaponIndex = getVar("weaponIndex");
    const procInputs = getVar("procInputs");
    const swapWeapon = getVar("swapWeapon");
    const reloadTimer = getVar("reloadTimer");
    const aimVal = getVar("aimVal");
    const pchObjc = getVar("pchObjc");
    const didShoot = getVar("didShoot");
    const nAuto = getVar("nAuto");
    const crouchVal = getVar("crouchVal");
    const recoilAnimY = getVar("recoilAnimY");
    const canSee = getVar("canSee");
    const objInstances = getVar("objInstances");
    const getWorldPosition = getVar("getWorldPosition");
    const mouse = window.utilities.mouse;
    const settings = window.utilities.settings;
    const serverVars = window.utilities.serverVars;
    let isKeyDown = key => window.utilities.downKeys.has(key);
    let getRndInteger = (min, max) => Math.floor(Math.random() * (max - min)) + min;

    // Render Hook
    window.utilities.overlay.render = proxyHook({
            type: "apply",
            name: "render"
        }, window.utilities.overlay.render,
        (target, that, [Scale, Game, Controls, Renderer, Player, Delta]) => {
            frameCount++; //frame timer
            if (frameCount >= 100000) {
                frameCount = 0;
            }

            if (Game) {

                // Hook AddBlock
                Game.map.manager.addBlock = proxyHook({
                        type: "apply",
                        name: "addBlock"
                    }, Game.map.manager.addBlock,
                    (target, that, args) => {
                        if (args[7] && args[7].penetrable) {
                            args[7].transparent = window.utilities.settings.wallPenetrate.val ? true : false;
                            args[7].opacity = window.utilities.settings.wallPenetrate.val ? 0.75 : 1.0;
                        }
                        return target.apply(that, args);
                    });

                // Auto Click Play
                if (frameCount % 500 == 0 && window.utilities.settings.autoClickPlay.val) {
                    const instruction = window.instructionHolder.innerText;
                    const states = {
                        updating: "GAME UPDATING",
                        disconect: "DISCONNECTED",
                        connecting: "CONNECTING...",
                        ready: "CLICK TO PLAY",
                        banned: "Banned by Vote",
                    }
                    if (instruction && instruction.includes(states.ready) && !window.utilities.ui.hasEndScreen) Game.controls.toggle(true);
                    else if (instruction && instruction.includes(states.disconect) || instruction.includes(states.banned)) location.assign("https://krunker.io/");
                }

                // Hook updateBillboards
                Game.updateBillboards = proxyHook({
                        type: "apply",
                        name: "updateBillboards"
                    }, Game.updateBillboards,
                    (target, that, [object]) => {
                        object = object || {};
                        that.billboard.txt = object.txt || 'Your\x20Ad\x20Here';
                        if (window.utilities.settings.customBillboard.val.length > 1) {
                            that.billboard.txt = window.utilities.settings.customBillboard.val;
                        }
                        that.billboard.txtCol = object.txtCol || '#e3e3e3';
                        that.billboard.bgCol = object.bgCol || '#000000';
                        that.map.billboard = that.billboard;
                    });

                // Hook control update
                Controls.update = proxyHook({
                        type: "apply",
                        name: "ctrlUpdate"
                    }, Controls.update,
                    (target, that, args) => {
                        window.utilities.controls = that;
                        if (!isDefined(that.aimTarget)) that.aimTarget = null;
                        else if (!that.target && that.aimTarget) {
                            that.object.rotation.y = that.aimTarget.yD;
                            that[pchObjc].rotation.x = that.aimTarget.xD;
                            that[pchObjc].rotation.x = Math.max(-halfPI, Math.min(halfPI, that[pchObjc].rotation.x));
                            that.yDr = (that[pchObjc].rotation.x % Math.PI).round(3);
                            that.xDr = (that.object.rotation.y % Math.PI).round(3);
                        }
                        Renderer.camera.updateProjectionMatrix();
                        Renderer.updateFrustum();
                        return target.apply(that, args);
                    });

                let camLookAt = function(entity) {
                    if (null === entity) return void(Controls.aimTarget = null);
                    const xDire = getXDire(Controls.object.position.x, Controls.object.position.y, Controls.object.position.z, entity.pos.x, (entity.pos.y + settings.autoAimOffset.val) - (entity[crouchVal] * serverVars.crouchDst), entity.pos.z);
                    const yDire = getDir(Controls.object.position.z, Controls.object.position.x, entity.pos.z, entity.pos.x);
                    Controls.aimTarget = {
                        xD: xDire,
                        yD: yDire,
                        x: entity.pos.x + serverVars.camChaseDst * Math.sin(yDire) * Math.cos(xDire),
                        y: entity.pos.y - serverVars.camChaseDst * Math.sin(xDire),
                        z: entity.pos.z + serverVars.camChaseDst * Math.cos(yDire) * Math.cos(xDire)
                    }
                }

                if (Player) {

                    // Chams
                    let chamColor = settings.renderChams.val;
                    let chamsEnabled = chamColor !== "off";
                    const obj = Player[objInstances];
                    if (obj) {
                        obj.visible = true;
                        obj.traverse((child) => {
                            if (child && child.type == "Mesh") {
                                child.material.depthTest = chamsEnabled ? false : true;
                                child.material.opacity = chamsEnabled ? 0.85 : 1.0;
                                child.material.transparent = chamsEnabled ? true : false;
                                child.material.fog = chamsEnabled ? false : true;
                                if (child.material.emissive && frameCount % settings.renderTimer.val == 0) {
                                    child.material.emissive.r = chamColor == 'off' || chamColor == 'teal' || chamColor == 'green' || chamColor == 'blue' || chamColor == 'rainbow' && child.material.emissive.g ? 0 : 0.55;
                                    child.material.emissive.g = chamColor == 'off' || chamColor == 'purple' || chamColor == 'blue' || chamColor == 'red' || chamColor == 'rainbow' && child.material.emissive.b ? 0 : 0.55;
                                    child.material.emissive.b = chamColor == 'off' || chamColor == 'yellow' || chamColor == 'green' || chamColor == 'red' || chamColor == 'rainbow' && child.material.emissive.r ? 0 : 0.55;
                                }
                                child.material.wireframe = settings.renderWireFrame.val;
                            }
                        })
                    }

                    // onMessage Hook
                    /*
						window.utilities.ws[socket].onmessage = proxyHook({ type: "apply", name: "onMessage" }, window.utilities.ws[socket].onmessage, 
						(target, that, [event]) => {
              let unscramble = (int) => {
                if (!window.utilities.xorKey) {
                  //const buf = new DataView(this.memory.buffer);
                  //this.xorKey = buf.getUint32(10108, true);
                  window.utilities.xorKey = window.utilities.wasm.HEAP32[2527];
                }
                return (window.utilities.xorKey ^ (int - 15)) / 1000;
              }
              let typedArray = new Uint8Array(event.data);
							let data = msgpack.decode(typedArray);
							if (data.length == 3) {
								const [id, pkt, sz] = data;
								if (id == "k") {           
									for (let i = 0; i < pkt.length; i += sz) {
										let sid = pkt[i];
										let player = Game.players.findBySid(sid);
											if (player) {
                        player.pos = new window.utilities.THREE.Vector3(unscramble(pkt[i + 1]), unscramble(pkt[i + 2]), unscramble(pkt[i + 3]))
                        player.time = Date.now();
											}
									}
								}
							}
							//typedArray = msgpack.encode(data);
							//Object.defineProperty(event, 'data', { value: typedArray.buffer });
							return target.apply(that, [event]);
            });*/

                    // Renderer
                    Renderer.renderer.render = proxyHook({
                        type: "apply",
                        name: "procInputs"
                    }, Renderer.renderer.render, (target, that, args) => {
                        if (args[0].uuid === Renderer.scene.uuid) {

                            const isPositionActual = (position) => {
                                let a = (position.x + 1 === position.y) && (position.y + 1 === position.z)
                                let b = Math.round(position.x) === position.x && Math.round(position.y) === position.y && Math.round(position.z) === position.z
                                let c = position.x % 3 === 0
                                return !(a && b && c)
                            }

                            for (let i = 0; i < Game.players.list.length; i++) {
                                const player = Game.players.list[i];
                                if (player && !player[isYou] && player[objInstances]) {
                                    player[objInstances].visible = true;
                                    const position = Object.assign({}, player[objInstances].position)
                                    if (isPositionActual(position)) {
                                        player.pos = new window.utilities.THREE.Vector3(position.x, position.y, position.z);
                                    }
                                }

                            }
                        }
                        return target.apply(that, args);
                    });


                    // Process Inputs Hook
                    Player[procInputs] = proxyHook({
                        type: "apply",
                        name: "procInputs"
                    }, Player[procInputs], (target, that, [input, game, recon, lock]) => {
                        const me = that;
                        const key = {
                            frame: 0,
                            delta: 1,
                            ydir: 2,
                            xdir: 3,
                            moveDir: 4,
                            shoot: 5,
                            scope: 6,
                            jump: 7,
                            crouch: 8,
                            reload: 9,
                            weaponScroll: 10,
                            weaponSwap: 11,
                            moveLock: 12
                        }

                        if (game) {

                            if (me) {
                                // autoBhop: {off: "Off", autoJump: "Auto Jump", keyJump: "Key Jump", autoSlide: "Auto Slide", keySlide: "Key Slide"}
                                let autoBhop = settings.autoBhop.val;
                                if (autoBhop !== "off") {
                                    if (isKeyDown("Space") || autoBhop !== "keyJump" && autoBhop !== "keySlide") {
                                        game.controls['binds']['jumpKey']['val'] ^= 1;
                                        game.controls['binds']['crouchKey']['val'] = (me.yVel < -0.04 && me.canSlide) && autoBhop !== "autoJump" && autoBhop !== "keyJump" ? 1 : 0;
                                    }
                                }

                                // autoReload
                                if (settings.autoReload.val) {
                                    let ammoLeft = me[ammos][me[weaponIndex]];
                                    if (!ammoLeft) {
                                        input[key.reload] = 1;
                                    }
                                }

                                // fastReload
                                if (settings.fastReload.val && input[key.reload] && me[reloadTimer]) {
                                    let ammoLeft = me[ammos][me[weaponIndex]];
                                    let capacity = me.weapon.ammo;
                                    if (ammoLeft < capacity) me[reloadTimer] = 10;

                                }

                                //Autoaim
                                if (settings.autoAim.val !== "off") {
                                    let target = game.players.list.filter(enemy => {
                                        return !enemy[isYou] && (me.team === null || enemy.team !== me.team) && enemy.health > 0 && enemy.hasOwnProperty('pos') &&
                                            null == getCanSee(game, me, enemy.pos.x, enemy.pos.y, enemy.pos.z) &&
                                            null == getCanSee(game, Renderer.camera[getWorldPosition](), enemy.pos.x, enemy.pos.y, enemy.pos.z, 10)
                                    }).sort((p1, p2) => getDistance(me.x, me.z, p1.pos.x, p1.pos.z) - getDistance(me.x, me.z, p2.pos.x, p2.pos.z)).shift();
                                    if (target) {
                                        const yDire = (getDir(me.z, me.x, target.pos.z, target.pos.x) || 0) * 1e3
                                        const xDire = ((getXDire(me.x, me.y, me.z, target.pos.x, target.pos.y - target[crouchVal] * serverVars.crouchDst + me[crouchVal] * serverVars.crouchDst, target.pos.z) || 0) - 0.27 * me[recoilAnimY]) * 1e3
                                        if (me.weapon[nAuto] && me[didShoot]) input[key.shoot] = 0;
                                        else {
                                            switch (settings.autoAim.val) {
                                                case "quickScope":
                                                    camLookAt(target);
                                                    input[key.scope] = 1;
                                                    input[key.ydir] = yDire
                                                    input[key.xdir] = xDire
                                                    if (!me[aimVal]) input[key.shoot] = 1;
                                                    break;
                                                case "assist":
                                                    if (mouse.right) {
                                                        camLookAt(target);
                                                        input[key.ydir] = yDire
                                                        input[key.xdir] = xDire
                                                    }
                                                    break;
                                                case "silent":
                                                    input[key.scope] = 1;
                                                    if (!me[aimVal]) input[key.shoot] = 1;
                                                    input[key.ydir] = yDire
                                                    input[key.xdir] = xDire
                                                    break;
                                                case "trigger":
                                                    if (mouse.right) {
                                                        if (!me[aimVal] && me.aimTime > 180) {
                                                            input[key.ydir] = yDire
                                                            input[key.xdir] = xDire
                                                            input[key.shoot] = 1;
                                                        }
                                                    }
                                                    default:
                                                        camLookAt(null);
                                                        break;
                                            }
                                        }
                                    } else {
                                        camLookAt(null);
                                    }
                                } else if (game.controls.aimTarget) camLookAt(null);
                            }
                        }
                        return target.apply(that, [input, game, recon, lock]);
                    });

                    const canvas = window.utilities.overlay.canvas;
                    const ctx = canvas.getContext('2d');
                    let fullWidth = window.innerWidth;
                    let fullHeight = window.innerHeight;
                    let scaledWidth = canvas.width / Scale;
                    let scaledHeight = canvas.height / Scale;
                    let camPos = Renderer.camera[getWorldPosition]();
                    let fonts = {
                        ssBig: '30px Sans-serif',
                        ssSmall: '20px Sans-serif',
                        gmBig: '30px GameFont',
                        gmSmall: '20px GameFont'
                    }
                    let world2Screen = (camera, position) => {
                        let pos = position.clone();
                        pos.project(camera);
                        pos.x = (pos.x + 1) / 2;
                        pos.y = (-pos.y + 1) / 2;
                        pos.x *= scaledWidth;
                        pos.y *= scaledHeight;
                        return pos;
                    }
                    let pixelTranslate = (ctx, x, y) => {
                        ctx.translate(~~x, ~~y);
                    }
                    let pixelDifference = (pos1, Pos2, multi) => {
                        const hDiff = ~~(pos1.y - Pos2.y);
                        return [hDiff, ~~(hDiff * multi)]
                    }
                    let getTextMeasurements = (arr) => {
                        for (let i = 0; i < arr.length; i++) {
                            arr[i] = ~~ctx.measureText(arr[i]).width;
                        }
                        return arr;
                    }
                    let text = (txt, font, color, x, y) => {
                        ctx.save();
                        pixelTranslate(ctx, x, y);
                        ctx.fillStyle = color;
                        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
                        ctx.font = font;
                        ctx.lineWidth = 1;
                        ctx.strokeText(txt, 0, 0);
                        ctx.fillText(txt, 0, 0);
                        ctx.restore();
                    }
                    let rect = (x, y, ox, oy, w, h, color, lW, fill = false) => {
                        ctx.save();
                        pixelTranslate(ctx, x, y);
                        ctx.beginPath();
                        ctx.lineWidth = lW;
                        fill ? ctx.fillStyle = color : ctx.strokeStyle = color;
                        ctx.rect(ox, oy, w, h);
                        fill ? ctx.fill() : ctx.stroke();
                        ctx.closePath();
                        ctx.restore();
                    }
                    let line = (x1, y1, x2, y2, lW, sS) => {
                        ctx.save();
                        ctx.lineWidth = lW + 2;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
                        ctx.stroke();
                        ctx.lineWidth = lW;
                        ctx.strokeStyle = sS;
                        ctx.stroke();
                        ctx.restore();
                    } 
                    let image = (x, y, img, ox, oy, w, h) => {
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.beginPath();
                        ctx.drawImage(img, ox, oy, w, h);
                        ctx.closePath();
                        ctx.restore();
                    }

                    target.apply(that, [Scale, Game, Controls, Renderer, Player, Delta]);
                    ctx.save();
                    ctx.scale(Scale, Scale);

                    Game.players.list
                      .filter((x) => {
                        return !x[isYou] && x.active && x.hasOwnProperty("pos");
                      })
                      .map((entity, index, array) => {

                        let isHostile = Player.team === null || entity.team !== Player.team;
                        let teamCol = isHostile ? "#FF4444" : "#44AAFF";
                        let entityPosBase = entity.pos;
                        let entityPosHead = entityPosBase
                          .clone()
                          .setY(
                            entity.pos.y +
                              (entity.height +
                                (0x0 <= entity.hatIndex
                                  ? serverVars.nameOffsetHat
                                  : 0) +
                                serverVars.nameOffset -
                                entity[crouchVal] * serverVars.crouchDst)
                          );
                          
                        let entityPosBaseScr = world2Screen(
                          Renderer.camera,
                          entityPosBase
                        );
                        let entityPosHeadScr = world2Screen(
                          Renderer.camera,
                          entityPosHead
                        );
                        let entityPxlDiffScr = pixelDifference(
                          entityPosBaseScr,
                          entityPosHeadScr,
                          0.6
                        );

                        //if (Renderer.scene && utils.isDefined(entity[objInstances]) && entity[objInstances]) {
                        //const objects = entity[objInstances];
                        //objects.matrixWorldNeedsUpdate = true;
                        //if (!utils.isDefined(entity.boxHelper)) {
                        //	entity.boxHelper = new this.THREE.BoxHelper( objects );
                        //	entity.boxHelper.material.color.set( 0xffffff );
                        //	Renderer.scene.add( entity.boxHelper );
                        //} else {
                        //entity.boxHelper.position.set(entity.pos);
                        //entity.boxHelper.update();
                        //}
                        //}

                        // Tracers / 2d
                        if (Renderer.frustum.containsPoint(entityPosHead)) {
                          if (settings.renderESP.val == "twoD") {
                            //2d
                            rect(
                              entityPosHeadScr.x - entityPxlDiffScr[1] / 2,
                              entityPosHeadScr.y,
                              0,
                              0,
                              entityPxlDiffScr[1],
                              entityPxlDiffScr[0],
                              teamCol,
                              1.5
                            );
                          }
                          if (settings.renderTracers.val) {
                            //Tracers
                            line(
                              fullWidth / 2,
                              fullHeight - (fullHeight - scaledHeight),
                              entityPosBaseScr.x,
                              entityPosBaseScr.y,
                              2.5,
                              teamCol
                            );
                          }
                        }
                      });
                    ctx.restore();	
                }
            }
            //return target.apply(that, [Scale, Game, Controls, Renderer, Player, Delta]);
        });
    return new Promise((resolve, reject) => resolve());
};
(async () => {
    await waitFor(() => isDefined(window.utilities))
    await nativeHooks();
    await waitFor(() => isDefined(window.utilities.exports))
    await findExports();
    window.utilities.createSettings();
    await gameHooks();
    return new Promise((resolve, reject) => resolve())
})()
  