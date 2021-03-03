/**
 * External dependencies
 */
const fs = require( 'fs' ).promises;
const path = require( 'path' );
const core = require( '@actions/core' );
const github = require( '@actions/github' );

const LABELS = {
	hasRepro: 'has-repro',
	reproducible: 'reproducible',
	notReproducible: 'not-reproducible',
	brokenRepro: 'broken-repro',
};

function updateLabels( currentLabels, expectedLabels ) {
	const labels = new Set( currentLabels );

	Object.values( LABELS ).forEach( ( label ) => {
		if ( expectedLabels.includes( label ) ) {
			labels.add( label );
		} else {
			labels.delete( label );
		}
	} );

	return Array.from( labels );
}

async function report() {
	try {
		const token = core.getInput( 'repo-token', { required: true } );
		const client = new github.GitHub( token );
		const issue = github.context.payload.issue;

		let result;

		const currentLabels = new Set(
			issue.labels.map( ( label ) => label.name )
		);

		try {
			const file = await fs.readFile(
				path.join( process.cwd(), 'repro-issue-report.json' ),
				'utf8'
			);
			result = JSON.parse( file );
		} catch ( err ) {
			core.info( 'No report file found, neutral exiting...' );

			const labels = updateLabels( currentLabels, [] );

			await client.issues.update( {
				owner: github.context.repo.owner,
				repo: github.context.repo.repo,
				issue_number: issue.number,
				labels,
			} );

			core.debug( err );
			return;
		}

		let label;
		if ( result.numRuntimeErrorTestSuites > 0 ) {
			label = LABELS.brokenRepro;
		} else if ( result.success ) {
			label = LABELS.notReproducible;
		} else {
			label = LABELS.reproducible;
		}

		const labels = updateLabels( currentLabels, [
			LABELS.hasRepro,
			label,
		] );

		await client.issues.update( {
			owner: github.context.repo.owner,
			repo: github.context.repo.repo,
			issue_number: issue.number,
			labels,
		} );
	} catch ( error ) {
		core.error( error );
		core.setFailed( error );
	}
}

report();
