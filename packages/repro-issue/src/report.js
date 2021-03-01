/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );

async function report() {
	const file = await fs.readFile(
		path.join( process.cwd(), 'repro-issue-report.json' ),
		'utf8'
	);
	const output = JSON.parse( file );

	console.log( output );
}

report();
