import { seedFlats } from '../lib/flat-seed.js';

const result = await seedFlats({ overwrite: true });
console.log(JSON.stringify(result, null, 2));
process.exit(0);
