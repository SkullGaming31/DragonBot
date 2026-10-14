let gmod;
try { gmod = require('glob'); } catch (e) { console.error('require(glob) failed', e); process.exit(1); }
const glob = gmod.glob ?? gmod;
const patternSrc = 'D\\:\\Corey\\developments\\DragonBot\\src\\Commands\\*\\*.{ts,js}';
const patternDist = 'D\\:\\Corey\\developments\\DragonBot\\dist\\Commands\\*\\*.{js,ts}';
const patternSrcFwd = 'D:/Corey/developments/DragonBot/src/Commands/*/*.{ts,js}';
const patternDistFwd = 'D:/Corey/developments/DragonBot/dist/Commands/*/*.{js,ts}';
const relPattern = 'src/Commands/*/*.{ts,js}';
console.log('cwd=', process.cwd());
console.log('glob type:', typeof glob, 'hasSync?', typeof (glob && glob.sync));
try {
  const s1 = (glob && glob.sync) ? glob.sync(patternSrc) : [];
  console.log('SYNC SRC matches:', s1.length);
  console.log(s1.slice(0, 5));
} catch (e) { console.error('sync src err', e && e.stack ? e.stack : e); }
try {
  const s2 = (glob && glob.sync) ? glob.sync(patternDist) : [];
  console.log('SYNC DIST matches:', s2.length);
  console.log(s2.slice(0, 5));
} catch (e) { console.error('sync dist err', e && e.stack ? e.stack : e); }
try {
  const s3 = (glob && glob.sync) ? glob.sync(patternSrcFwd) : [];
  console.log('SYNC SRC FWD matches:', s3.length);
  console.log(s3.slice(0, 5));
} catch (e) { console.error('sync src fwd err', e && e.stack ? e.stack : e); }
try {
  const s4 = (glob && glob.sync) ? glob.sync(relPattern) : [];
  console.log('SYNC REL matches:', s4.length);
  console.log(s4.slice(0, 5));
} catch (e) { console.error('sync rel err', e && e.stack ? e.stack : e); }
