const config = require('./config');
const fetch = import('node-fetch');

const token = config.GITHUB_TOKEN;

const fetch = require('node-fetch');

async function getIssues() {
	const baseUrl = 'https://api.github.com';
	const headers = {
		'accept':'application/vnd.github.v3+json',
		'authorization':`token ${token}`,
		'filter': 'repos',
	};
	const response = await fetch(baseUrl + '/issues', {
		'method': 'GET',
		'headers': headers,
	});
	const result = await response.json();

	console.log(result);
}