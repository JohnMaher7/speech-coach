// Set SHARP_PATH if sharp is not installed in the normal Node search path.
let sharp;
try { sharp=require(process.env.SHARP_PATH || 'sharp'); }
catch { sharp=require('C:/Users/johnm/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp'); }
const path=require('node:path');
const assets=path.resolve(__dirname,'../assets');
Promise.all([800,1500].map(width=>sharp(path.join(assets,'voice-to-feedback.png')).resize(width).webp({quality:84,effort:6}).toFile(path.join(assets,`voice-to-feedback-${width}.webp`)))).then(results=>console.log(results.map(r=>({width:r.width,bytes:r.size})))).catch(error=>{console.error(error);process.exit(1)});
