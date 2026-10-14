let gmod;
try { gmod = require('glob'); } catch (e) { console.error('require(glob) failed', e); process.exit(1); }
const glob = gmod.glob ?? gmod; // v13 exports { glob } or the function itself
const patternSrc = 'D\\:\\Corey\\developments\\DragonBot\\src\\Commands\\*\\*.{ts,js}';
const patternDist = 'D\\:\\Corey\\developments\\DragonBot\\dist\\Commands\\*\\*.{js,ts}';
console.log('cwd=', process.cwd());
console.log('glob type:', typeof glob, 'hasSync?', typeof (glob && glob.sync));
(async () => {
  try {
    const matches = await new Promise((res, rej) => {
      try { glob(patternSrc, {}, (err, m) => err ? rej(err) : res(m)); }
      catch (e) { rej(e); }
    });
    console.log('SRC matches:', matches.length);
    console.log(matches.slice(0, 5));
  } catch (e) {
    console.error('SRC error', e && e.stack ? e.stack : e);
  }
  try {
    const matches = await new Promise((res, rej) => {
      try { glob(patternDist, {}, (err, m) => err ? rej(err) : res(m)); }
      catch (e) { rej(e); }
    });
    console.log('DIST matches:', matches.length);
    console.log(matches.slice(0, 5));
  } catch (e) {
    console.error('DIST error', e && e.stack ? e.stack : e);
  }
})();
