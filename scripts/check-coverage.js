const fs = require('fs');
const path = require('path');

const thresholds = {
	lines: 20,
	statements: 20,
	functions: 20,
	branches: 20,
};

const summaryPath = path.resolve(process.cwd(), 'coverage', 'coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
	console.error('Coverage summary not found. Run tests with coverage first.');
	process.exit(2);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const totals = summary.total || summary[''] || summary;

let failed = false;
for (const key of Object.keys(thresholds)) {
	const actual = Math.round((totals[key].pct) || 0);
	const required = thresholds[key];
	if (actual < required) {
		console.error(`Coverage for ${key} is ${actual}% (required ${required}%)`);
		failed = true;
	} else {
		console.log(`Coverage for ${key}: ${actual}% (required ${required}%)`);
	}
}

if (failed) process.exit(1);
console.log('Coverage thresholds satisfied');