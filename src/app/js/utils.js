const log = require('electron-log'); 
Object.assign(console, log.functions)

module.exports.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
module.exports.waitFor = async (test, timeout_ms = 20000, freq = 100, doWhile = null) => {
    return new Promise(async (resolve, reject) => {
        if (typeof timeout_ms != "number")
            reject(
                "Timeout argument not a number in waitFor(selector, timeout_ms)"
            );

        let result;

        while (
            result === undefined ||
            result === false ||
            result === null ||
            result.length === 0
        ) {
            if (doWhile) doWhile();
            if (timeout_ms % 1000 < freq)
                console.log("%c" + "waiting for: " + test, "color:#809fff");
            if ((timeout_ms -= freq) < 0) {
                console.log("%c" + "Timeout : " + test, "color:#cc2900");
                resolve(false);
                return;
            }
            await this.sleep(freq);
            result = typeof test === "string" ? eval(test) : test();
        }
        console.log("Passed: ", test);
        resolve(result);
    });
};
 
const fs = require('fs');
const path = require('path');
const minify = require('minify');
const tryToCatch = require('try-to-catch');
const bytenode = require('bytenode');
const v8 = require('v8'); v8.setFlagsFromString('--no-lazy');
module.exports.js2Bytecode = async (name) => {
    return new Promise(async (resolve, reject) => {
        const bytecodePath = path.join(__dirname, `${name}.jsc`)
        if (!fs.existsSync(bytecodePath)) {   
            let scriptFile = path.join(process.cwd(), '..', 'js', `${name}.js`);
            if (!fs.existsSync(scriptFile)) return reject(`${name} Does not Exist`);
            let minDir = path.join(process.cwd(), '..', 'js', 'min');
            let minFile = path.join(minDir, `${name}_min.js`);
            if (!fs.existsSync(minDir)) fs.mkdirSync(minDir);
            let [error, data] = await tryToCatch(minify, scriptFile, {
                html: {
                    removeAttributeQuotes: false,
                    removeOptionalTags: false
                }
            });
            if (error) return reject(error.message);
            fs.writeFileSync(minFile, data);
            bytenode.compileFile({
                filename: minFile,
                compileAsModule: true,
                output: bytecodePath
            });
            this.waitFor(() => fs.existsSync(bytecodePath))
        }
       return resolve(bytecodePath)
    }).then(path => {
        require(path);
    }).catch((e) => {
        throw new Error(e);
    });
};