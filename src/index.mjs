import express from 'express';
import bodyParser from 'body-parser'
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { connectToMongoDB } from './config/db.mjs';
import router from './routes/index_routes.mjs';

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
    'http://localhost:4200',
    'https://itc-calificaciones.vercel.app',
];

//Json config
app.use(bodyParser.json({limit : '5mb'}));
app.use(bodyParser.urlencoded({limit: '5mb', extended : true}));
app.use(bodyParser.json());

//Cors 
app.use(cors({origin : allowedOrigins[0], credentials : true}));

//Headers settings
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", allowedOrigins[0]);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    next();
});

connectToMongoDB();

//Router of routes api
app.use(router);

//Listen port
app.listen(port, async () => {
    console.log(`API Server on port ${port}`);
});

export default app;