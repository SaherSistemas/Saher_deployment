const { Op } = require('sequelize');
const Preciogpo = require('../models/CLIENTES/PrecioGpo'); // Ajusta la ruta según tu estructura de archivos
const Contacto = require('../models/LANDINGPAGE/WebContacto'); // Asegúrate de que la ruta al modelo sea correcta

exports.obtenerOfertas = async (req, res, next) => {
  try {
    const today = new Date(); // Fecha actual



    // Consulta para obtener los productos con oferta vigente
    const productsWithOffers = await Preciogpo.findAll({
      attributes: ['artcdartn', 'grpprecin', 'grppreofn'],
      where: {
        grppreofn: { [Op.ne]: null },
        grpfecofd: {
          [Op.gte]: today,
        },
        grpcdgrpn: 1
      },
      include: [{
        model: require('../models/ARTICULOS/Articulos'), // Ajusta la ruta según la estructura
        as: 'articulo',
        attributes: ['artcdartn', 'artdsartc']
      }],
      limit: 6
    });

    // Mapeo de productos
    const productsMapped = productsWithOffers.map(product => {
      return {
        codigoArticulo: product.artcdartn,
        precioNormal: product.grpprecin,
        precioOferta: product.grppreofn,
        nombreArticulo: product.articulo ? product.articulo.artdsartc : "Desconocido"
      };
    });


    // Devuelve la respuesta como JSON
    res.json(productsMapped);

  } catch (error) {
    console.error('Error al obtener productos con oferta:', error);
    res.status(500).json({ error: 'Error al obtener productos con oferta' });
  }
}

exports.obtenerTodasOfertas = async (req, res) => {
  try {
    const { page = 1, limit = 52, term = '' } = req.query;
    const offset = (page - 1) * limit;

    const today = new Date();

    // Convertir term a mayúsculas
    const searchTerm = term.toUpperCase();

    // Consulta para obtener productos con ofertas vigentes
    const productsWithOffers = await Preciogpo.findAndCountAll({
      attributes: ['artcdartn', 'grpprecin', 'grppreofn'],
      where: {
        grppreofn: { [Op.ne]: null },
        grpfecofd: { [Op.gte]: today },
        grpcdgrpn: 1,
        ...(searchTerm && {
          '$articulo.artdsartc$': { [Op.like]: `%${searchTerm}%` }, // Búsqueda con término en mayúsculas
        }),
      },
      include: [{
        model: require('../models/ARTICULOS/Articulos'),
        as: 'articulo',
        attributes: ['artcdartn', 'artdsartc']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Mapeo de productos
    const productsMapped = productsWithOffers.rows.map(product => ({
      codigoArticulo: product.artcdartn,
      precioNormal: product.grpprecin,
      precioOferta: product.grppreofn,
      nombreArticulo: product.articulo ? product.articulo.artdsartc : "Desconocido"
    }));

    // Devuelve la respuesta como JSON junto con los datos de paginación
    res.json({
      total: productsWithOffers.count,
      productos: productsMapped,
      currentPage: parseInt(page),
      totalPages: Math.ceil(productsWithOffers.count / limit)
    });

  } catch (error) {
    console.error('Error al obtener productos con oferta:', error);
    res.status(500).json({ error: 'Error al obtener productos con oferta' });
  }
};


exports.guardarContacto = async (req, res, next) => {
  const { nombreCompleto, celular, correo, mensaje } = req.body;

  // Validaciones iniciales
  if (!nombreCompleto || !mensaje || (!celular && !correo)) {
    return res.status(400).json({
      mensaje: 'El nombre completo, mensaje y al menos uno de los campos: celular o correo son obligatorios.'
    });
  }

  // Validar formato de celular si se ingresa
  if (celular && !/^\d{10,15}$/.test(celular)) {
    return res.status(400).json({
      mensaje: 'El celular debe tener entre 10 y 15 dígitos.'
    });
  }

  try {
    // Crear un nuevo contacto en la base de datos
    const nuevoContacto = await Contacto.create({
      nombreCompleto,
      celular: celular || null,
      correo: correo || null,
      mensaje
    });

    console.log("SE GUARDO EL CONTACTO")
    res.status(201).json({
      mensaje: 'El contacto ha sido guardado correctamente.',
      contacto: nuevoContacto
    });
  } catch (error) {
    console.error('Error al guardar el contacto:', error);
    res.status(500).json({
      mensaje: 'Hubo un problema al guardar el contacto.',
      error: error.message
    });
  }
};


exports.obtenerContactos = async (req, res, next) => {
  try {
    // Obtener todos los registros de la tabla 'webcontactos'
    const contactos = await Contacto.findAll();

    // Si no se encuentran registros, devolver mensaje adecuado
    if (!contactos.length) {
      return res.status(404).json({
        mensaje: 'No se encontraron contactos.'
      });
    }

    // Devolver los registros como respuesta JSON
    res.status(200).json({
      contactos
    });
  } catch (error) {
    console.error('Error al obtener los contactos:', error);
    res.status(500).json({
      mensaje: 'Hubo un problema al obtener los contactos.',
      error: error.message
    });
  }
};
