/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const core = require( '@actions/core' );
const github = require( '@actions/github' );

async function report() {
	try {
		const token = core.getInput( 'repo-token', { required: true } );
		const client = new github.GitHub( token );
		const issue = github.context.payload.issue;

		let result;

		try {
			const file = await fs.readFile(
				path.join( process.cwd(), 'repro-issue-report.json' ),
				'utf8'
			);
			result = JSON.parse( file );
		} catch ( err ) {
			core.info( 'No report file found, neutral exiting...' );
			core.debug( err );
			return;
		}

		let label;

		if ( result.numRuntimeErrorTestSuites > 0 ) {
			label = 'broken-repro';
		} else if ( result.success ) {
			label = 'not-reproducible';
		} else {
			label = 'reproducible';
		}

		await client.issues.addLabels( {
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: issue.number,
			labels: [ 'has-repro', label ],
		} );
	} catch ( error ) {
		core.error( error );
		core.setFailed( error );
	}
}

report();
