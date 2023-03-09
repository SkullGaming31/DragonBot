import dotenv from 'dotenv';
dotenv.config();

export function checkVariables(env: NodeJS.ProcessEnv): void {
    Object.entries(env).forEach(([key, value]) => {
        if (!value && key !== 'npm_config_noproxy') {
            console.error(`Empty value detected for variable field ${key} in .env file`);
        }
    });
}
export default checkVariables;