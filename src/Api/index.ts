import http from 'http';

import healthListener from './health';

const host = 'localhost';
const port = Number(process.env.PORT || '8080');

const requestListener: http.RequestListener = async (req, res) => {
  switch (req.url) {
    case '/health':
      return healthListener(req, res);
    default:
      res.writeHead(404);
      res.end();
  }
};

const server = http.createServer(requestListener);

const start = () =>
  new Promise<void>((resolve) => server.listen(port, host, resolve));

export default start;
