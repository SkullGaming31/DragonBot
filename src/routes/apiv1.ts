import { Router, Request, Response } from 'express';

export const apiV1Routes = Router();

apiV1Routes.get('/', (req: Request, res: Response) => {
	res.send('Hello, world!');
});

export default apiV1Routes;