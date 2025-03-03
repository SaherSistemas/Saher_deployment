const express = require('express');
const routes = require('./routes/index.js');
const bodyParser = require('body-parser');
const sequelize = require('./database');
require('dotenv').config({ path: 'variables.env' });
const cors = require('cors');


//servidor
const app = express();

//habilitar bodiparser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

//DEFINIR UN DOMINO PARA RECIBIR LAS PETICIONES
const withelist = [process.env.FRONTEND_URL];
const corsOption = {
  origin: (origin, callback) => {
    //revisar si la petcion viene de la listablanca 
    const existe = withelist.some(dominio => dominio === origin);
    if (existe) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  }
}
//habilitar cors
app.use(cors(corsOption));
//Rutas de la app
app.use('/', routes());

// Puerto y Host
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 1000;
/*INICIAR APP */
app.listen(port, host, () => {
  console.log(`Servidor corriendo en http://${host}:${port}`);
});
//Sincronizar BD



