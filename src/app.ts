import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as morgan from 'morgan';

import * as dishes from './routes/dishmanagement';

import * as config from './config';

export const app = express();

app.set('port', (process.env.PORT) ? Number(process.env.PORT!.trim()) : undefined || config.PORT || 8081);
app.disable('x-powered-by');
if (process.env.MODE === undefined || process.env.MODE!.trim() !== 'test') app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * Cors config
 */
app.use(cors({
    origin: config.frontendURL,
    credentials: true,
    exposedHeaders: 'Authorization',
}));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Origin, Authorization, Accept, Client-Security-Token, Accept-Encoding');
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
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(404).json({ message: 'Not Found' });
});

app.listen(app.get('port'), () => {
    console.log('MyThaiStar server listening on port ' + app.get('port'));
});
