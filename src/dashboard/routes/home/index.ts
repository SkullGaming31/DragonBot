import { Request, Response, Router } from 'express';

const homeRouter = Router();

homeRouter.get('/', (req: Request, res: Response) => {
	res.render('home');
});

export default homeRouter;