const axios = require('axios').default;
const fetch = require('node-fetch');

const url = 'https://api.github.com/skullgaming31/skulledbotDiscord';
const github = axios.create({
	baseURL: url
});
async function getRepos() {
	const response = await github.post('/issues', {
		Headers: {
			'content-type': 'application/json',
			'body': 'test issue'
		}
	});
	console.log(response);
}

module.exports = {
	getRepos
};