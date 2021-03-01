/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const remark = require( 'remark' );
const visit = require( 'unist-util-visit' );

async function extractRepro( markdown ) {
	let code = null;

	function processCode() {
		return ( ast ) => {
			visit( ast, 'code', ( node ) => {
				if ( node.meta === 'repro' && typeof node.value === `string` ) {
					code = node.value;
				}
			} );
		};
	}

	await remark().use( processCode ).process( markdown );

	return code;
}

function makeTest( title, test ) {
	return `it('${ title.replace( /'/g, "\\'" ) }', async () => {
${ test }
});
`;
}

async function generateTestFile() {
	let event;
	try {
		event = await fs.readFile( process.env.GITHUB_EVENT_PATH, 'utf8' );
		event = JSON.parse( event );
	} catch ( err ) {
		console.log( 'No event file found.' );
		throw err;
	}

	const {
		issue: { body, title },
	} = event;

	const repro = await extractRepro( body );

	if ( ! repro ) {
		throw new Error( 'No repro script found.' );
	}

	const testFile = makeTest( title, repro );

	console.log( testFile );
}

generateTestFile();
