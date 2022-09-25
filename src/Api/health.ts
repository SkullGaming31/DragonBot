import http from 'http';

const healthListener: http.RequestListener = async (_req, res) => {
  /**
   * @todo check MongoDB connection
   * @todo check Discord connection
   * @todo check other ...
   */
  const isOK = true;

  res.writeHead(isOK ? 200 : 500);
  res.end();
};

export default healthListener;
