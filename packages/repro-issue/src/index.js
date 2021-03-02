/**
 * External dependencies
 */
const core = require( '@actions/core' );
const github = require( '@actions/github' );
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
	const { body, title } = github.context.payload.issue;

	const repro = await extractRepro( body );

	if ( ! repro ) {
		core.info( 'No repro script found.' );
		return;
	}

	const testFile = makeTest( title, repro );

	// eslint-disable-next-line no-console
	console.log( testFile );
}

generateTestFile();
