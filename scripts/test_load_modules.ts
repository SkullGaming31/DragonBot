import 'ts-node/register';
import { ExtendedClient } from '../src/Structures/Client';

(async () => {
  try {
    const c = new ExtendedClient();
    await c.registerModules();
    console.log('registerModules completed');
  } catch (e) {
    console.error('registerModules error', e);
  }
})();
