import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as http from 'http';
import * as express from 'express';
import * as morgan from 'morgan';

import * as dishes from './routes/dishmanagement';

import * as config from './config';

import * as terminus from '@godaddy/terminus';

export const app = express();

app.set(
  'port',
  process.env.PORT
    ? Number(process.env.PORT!.trim())
    : undefined || config.PORT || 8081,
);
app.disable('x-powered-by');
if (process.env.MODE === undefined || process.env.MODE!.trim() !== 'test')
  app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * Cors config
 */
app.use(
  cors({
    origin: config.frontendURL,
    credentials: true,
    exposedHeaders: 'Authorization',
  }),
);
app.use((req, res, next) => {
  res.header(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding',
  );
  next();
});

/**
 * Route for images
 */
app.use('/images', express.static('public/images'));

/**
 * API routes
 */
app.use('/v1', dishes.router);

// error handler
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(404).json({ message: 'Not Found' });
  },
);

app.listen(app.get('port'), () => {
    console.log('MyThaiStar dishes service listening on port ' +app.get('port'));
});

const infoApp = express();
infoApp.set(
    'info_port',
    process.env.INFO_PORT
      ? Number(process.env.INFO_PORT!.trim())
      : config.INFO_PORT,
  );

const managementOptions: any = {
  healthChecks: {
    '/health': () => Promise.resolve(),
  },
};

terminus(http.createServer(infoApp), managementOptions).listen(infoApp.get('info_port'), () => {
  console.log('MyThaiStar dishes info server listening on port ' + infoApp.get('info_port'));
});
