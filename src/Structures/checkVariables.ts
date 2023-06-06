import dotenv from 'dotenv';
dotenv.config();

export function checkVariables(env: NodeJS.ProcessEnv): void {
	for (const [key, value] of Object.entries(env)) {
		if (value === undefined && key !== 'npm_config_noproxy') {
			console.error(`Empty value detected for variable field ${key} in .env file`);
		}
	}
}

// export default { checkVariables };
