const jwt =require('jsonwebtoken')
require('dotenv').config({path:'variables.env'});
module.exports = (req,res,next) => {
    //autorizacion por el header

    const authHeader = req.get('Authorization');

    if(!authHeader){
        const error = new Error('No autenticado, no hay JWT');
        error.statusCode = 401;
        throw error;
    }

    //obtener token 
    const token = authHeader.split(' ')[1];
    let revisarToken;
    try {
        revisarToken = jwt.verify(token,process.env.KEY);

    } catch (error) {
        error.statusCode = 500
        throw error;
    }

    //si es un token valido pero hay algun error 

    if(!revisarToken){
        const error = new Error('No autenticado');
        error.statusCode = 401;
        throw error;
    }

    next();
}