import { Request, Response, Router } from 'express';

const accountRouter = Router();

accountRouter.get('/', (req: Request, res: Response) => {
	res.send({ msg: 'Account' });
});

export default accountRouter;