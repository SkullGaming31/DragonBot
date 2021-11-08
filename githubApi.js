const fetch = require('node-fetch');
<<<<<<< HEAD

async function getIssues() {
	const baseUrl = 'https://api.github.com';
	const method = 'GET';
=======
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
>>>>>>> bcb44298c191ebeebfff534cdec342069177df74
	const headers = {
		'accept':'application/vnd.github.v3+json',
		'authorization':`token ${process.env.githubTOKEN}`,
		'filter': 'repos',
	};
	const response = await fetch(baseUrl + '/issues', {
<<<<<<< HEAD
		method,
		headers,
=======
		'method': 'GET',
		'headers': headers,
>>>>>>> bcb44298c191ebeebfff534cdec342069177df74
	});
	const result = await response.json();

	console.log(result);
}