import express from 'express';
import bodyParser from 'body-parser'
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { connectToMongoDB } from './config/db.mjs';
import router from './routes/index_routes.mjs';

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = ['http://localhost:4200', 'https://itc-calificaciones.vercel.app'];

// Json config
app.use(bodyParser.json({limit : '5mb'}));
app.use(bodyParser.urlencoded({limit: '5mb', extended : true}));
app.use(bodyParser.json());

// Cores
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// No es necesario establecer los headers de CORS manualmente si estás utilizando el middleware `cors`
// Sin embargo, si decides hacerlo, asegúrate de hacerlo correctamente:
app.use(function (req, res, next) {
    if (allowedOrigins.includes(req.headers.origin)) {
        res.header("Access-Control-Allow-Origin", req.headers.origin); // Esta línea permite un origen específico
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    next();
});


connectToMongoDB();

// Router of routes api
app.use(router);

// Listen port
app.listen(port, async () => {
    console.log(`API Server on port ${port}`);
});

export default app;