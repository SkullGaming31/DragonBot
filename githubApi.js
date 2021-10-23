const fetch = require('node-fetch');

async function getIssues() {
	const baseUrl = 'https://api.github.com';
	const headers = {
		'accept':'application/vnd.github.v3+json',
		'authorization':`token ${process.env.githubTOKEN}`,
		'filter': 'repos',
	};
	const response = await fetch(baseUrl + '/issues', {
		'method': 'GET',
		'headers': headers,
	});
	const result = await response.json();

	console.log(result);
}