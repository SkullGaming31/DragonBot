const fetch = require('node-fetch');
// const { Octokit } = require('octokit');
const { endpoint } = require('@octokit/endpoint');

async function run() {
	// eslint-disable-next-line no-unused-vars
	const requestOptions = endpoint('GET /user/issues', {
		headers: {
			authorization: `token ${process.env.githubTOKEN}`,
		},
		org: 'octokit',
		type: 'private',
	});
}

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