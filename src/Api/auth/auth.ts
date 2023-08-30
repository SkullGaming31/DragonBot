import axios from 'axios';

window.onload = async () => {
	const fragment = new URLSearchParams(window.location.hash.slice(1));
	const accessToken = fragment.get('access_token');
	console.log('Access Token:', accessToken);

	const loginButton = document.getElementById('login');

	if (loginButton) {
		if (!accessToken) {
			loginButton.style.display = 'block';
			loginButton.addEventListener('click', () => {
				window.location.href = 'https://discord.com/api/oauth2/authorize?client_id=930882181595807774&permissions=30092622032118&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fdiscord%2Fredirect&response_type=code&scope=identify%20connections%20guilds%20applications.commands%20bot';
			});
		} else {
			try {
				const response = await axios.get('https://discord.com/api/users/@me', {
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});

				const { username } = response.data;
				console.log('ResponseData:', response.data);
				const infoElement = document.getElementById('info');
				if (infoElement) {
					infoElement.innerText += ` ${username}`;
				} else {
					console.error('Element with id "info" not found.');
				}
			} catch (error) {
				console.error(error);
			}
		}
	} else {
		console.error('Login button not found');
	}
};