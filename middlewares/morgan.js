import morgan from 'morgan';
import logger from '../lib/logger.js';

const stream = {
  // Use the http severity
  write: (message) => {
    logger.http(message.substring(0, message.lastIndexOf('\n')));
  },
};

const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'development';
};

morgan.token('auth', (req) => (req.cookies.token ? 'auth' : 'noauth'));

export default morgan(
  ':remote-addr :method :url :auth :status :req[content-length] :res[content-length] - :response-time ms :user-agent',
  { stream, skip },
);
