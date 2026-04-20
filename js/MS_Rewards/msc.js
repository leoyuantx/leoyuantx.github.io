// Node.js: print a log every 1000ms, repeat 7 times, repeat the cycle 32 times.

async function runCycles() {
	for (let cycle = 1; cycle <= 32; cycle++) {
		process.stdout.write(`Cycle ${cycle}: `);
		
		for (let tick = 1; tick <= 7; tick++) {
			process.stdout.write(`${tick} `);
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
		process.stdout.write('\n');
	}
	console.log('Done!');
}

runCycles();
