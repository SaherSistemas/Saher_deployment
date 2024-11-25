const { Op } = require('sequelize');
const articulos = require('../models/ARTICULOS/Articulos.js');
const numerador = require('../models/ARTICULOS/Numerador.js');
const UnidadMedida = require('../models/ARTICULOS/UnidadMedida.js');
const iva = require('../models/ARTICULOS/Iva.js');
const Clasificacion = require('../models/ARTICULOS/Clasificacion.js');
const catservicios = require('../models/ARTICULOS/CatServicios.js');

exports.mostrarArticulos = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1; // Número de página, por defecto 1
    const limit = parseInt(req.query.limit) || 50; // Cantidad de registros por página, por defecto 50
    const offset = (page - 1) * limit;
    const searchTerm = req.query.nombre || ''; // Término de búsqueda, por defecto vacío
    const estado = req.query.estado || 'A'; // Estado, por defecto 'A' para activos

    const whereCondition = {
      ...searchTerm && { artdsartc: { [Op.iLike]: `%${searchTerm}%` } },
      ...estado && { artstatuc: estado }
    };

    const { count, rows } = await articulos.findAndCountAll({
      where: whereCondition,
      offset: offset,
      limit: limit,
      order: [['artcdartn', 'ASC']]
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      items: rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    next(error);
  }
};

exports.obtenerIvas = async (req, res, next) => {
  try {
    // Buscar todos los registros, seleccionando solo los campos ivacdivan e ivadescrc
    const ivas = await iva.findAll({
      attributes: ['ivacdivan', 'ivadescrc'],
      raw: true // Obtener los datos como objetos simples
    });

    // Limpiar los datos si es necesario (por ejemplo, eliminar espacios en blanco)
    const ivasLimpios = ivas.map(iva => ({
      ivacdivan: iva.ivacdivan,
      ivadescrc: iva.ivadescrc.trim()
    }));

    // Enviar los datos limpios como respuesta en formato JSON
    res.status(200).json(ivasLimpios);
  } catch (error) {
    // En caso de error, enviar un mensaje de error y pasar el error al middleware de manejo de errores
    res.status(500).json({ error: error.message });
    next(error);
  }
}


/*AGREGAR NUEVO articulo */

exports.numerador = async (req, res, next) => {
  try {
    const resultado = await numerador.findOne({
      attributes: ['numfolcon'],
      where: {
        numcdnumn: 3,
      },
    });

    let sigRegistro = 0;

    if (resultado) {
      const numfolcon = resultado.numfolcon;
      const numEnter = parseInt(numfolcon, 10); // Asegúrate de pasar la base 10 para evitar errores
      sigRegistro = numEnter + 1;
    }

    res.status(200).json(sigRegistro);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el numerador' });
  }
};

exports.obtenerServicioPorClave = async (req, res, next) => {
  try {
    const { clave } = req.params;

    if (!clave || typeof clave !== 'string') {
      return res.status(400).json({ error: 'Clave SAT inválida' });
    }

    // Usa LIKE para manejar espacios en blanco en la base de datos
    const servicio = await catservicios.findOne({
      where: {
        satclavec: {
          [Op.like]: `${clave.trim()}%`
        }
      },
      attributes: ['satclavec', 'satdsserc'],
      raw: true
    });

    if (servicio) {
      res.status(200).json({
        satclavec: servicio.satclavec.trim(),
        satdsserc: servicio.satdsserc.trim().toUpperCase()
      });
    } else {
      res.status(404).json({ error: 'Servicio no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ocurrió un error al obtener el servicio' });
  }
};



exports.clasificaciones = async (req, res, next) => {
  try {
    const clasificaciones = await Clasificacion.findAll({
      attributes: ['artclasic', 'artcladsc'],
      order: [['artcladsc', 'ASC']],
      raw: true
    })
    const clasificacionLimpia = clasificaciones.map(clasifi => ({
      artclasic: clasifi.artclasic.trim(),
      artcladsc: clasifi.artcladsc.trim().toUpperCase(),
    }));

    res.status(200).json(clasificacionLimpia);
  } catch (error) {
    res.status(500).json({ error: error.message });
    next(error);
  }
}

exports.DesactivarArticulo = async (req, res, next) => {
  try {
    const activoONo = await articulos.findOne({
      attributes: ['artstatuc'],
      where: {
        artcdartn: req.body.artcdartn,
      },
    });
    /*const nuevoVa = null
/*SI ES A CAMBIAR a D SI ES D cambiar a A */
    if (activoONo.artstatuc == 'A') {
      nuevoVa = 'C'
    }
    else if (activoONo.artstatuc == 'C') {
      nuevoVa = 'A'
    }


    /*ACTUALIZAR EL ESTATUS DEL ARTICULO */
    await articulos.update(
      { artstatuc: nuevoVa },
      { where: { artcdartn: req.body.artcdartn } }
    );
     // Enviar una respuesta exitosa
     res.status(200).json({ mensaje: 'Estatus actualizado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
    next(error)
  }
};

exports.unidadMedida = async (req, res, next) => {
  try {
    const unidadMedida = await UnidadMedida.findAll({
      attributes: ['umecdumen', 'umedsumec'],
      order: [['umecdumen', 'ASC']],
      raw: true
    })

    const unidadMedidaLimpia = unidadMedida.map(med => ({
      umecdumen: med.umecdumen,
      umedsumec: med.umedsumec.trim().toUpperCase(),
    }));

    res.status(200).json(unidadMedidaLimpia);
  } catch (error) {
    res.status(500).json({ error: error.message });
    next(error);
  }
}

exports.nuevoArticuloNew = async (req, res, next) => {
  try {
    const nuevoArticulo = {
      artcdartn: req.body.artcdartn,
      artdsartc: req.body.artdsartc,
      artdsgenc: req.body.artdsgenc,
      artclasic: req.body.artclasic,
      artcodbac: req.body.artcodbac,
      artfabric: req.body.artfabric,
      artfecald: req.body.artfecald, //YA LA RECIBE 
      arttipprc: req.body.arttipprc, //TIPO DE PRODUCTO A(ANTIBIOTICO) O N(GENERAL)
      umecdumen: req.body.umecdumen,  //UNIDAD DE MEDIDA TABLA 
      satclavec: req.body.satclavec,  //NUMERO
      ivacdivan: req.body.ivacdivan   //TABLA
    };
    //AGREGARLO A LA BD
    const articuloCreado = await articulos.create(nuevoArticulo);
    res.json({ mensaje: 'Se Agrego el articulo' });
    //CAMBIAR EL NUMERADOR 
    const ulti = req.body.artcdartn
    await numerador.update(
      { numfolcon: ulti },
      { where: { numcdnumn: 3 } }
    )
  } catch (error) {
    console.error('Error al obtener los artículos:', error.message); // Log detallado del error
    res.status(500).json({ error: `Ocurrió un error al obtener los artículos: ${error.message}` });
    next(error);
  }
};

/*DESACTIVAR ARTICULO */
exports.activarYDesactivarArticulo = async (req, res, next) => {
  try {
    const activoONo = await articulos.findOne({
      attributes: ['artstatuc'],
      where: {
        artcdartn: req.body.artcdartn,
      },
    });
    /*const nuevoVa = null
/*SI ES A CAMBIAR a D SI ES D cambiar a A */
    let nuevoVa = '';
    if (activoONo.artstatuc == 'A') {
      nuevoVa = 'C'
    }
    else if (activoONo.artstatuc == 'C') {
      nuevoVa = 'A'
    }


    /*ACTUALIZAR EL ESTATUS DEL ARTICULO */
    await articulos.update(
      { artstatuc: nuevoVa },
      { where: { artcdartn: req.body.artcdartn } }
    );

     // Enviar una única respuesta
     res.status(200).json({ mensaje: 'El artículo se actualizó correctamente.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
    next(error)
  }
};
/*MODIFICAR UN ARTICULO */
/*FALTA AGREGAR EL MODIFICAR */
exports.modificarArticulo = async (req, res) => {
  try {
    const { artcdartn } = req.params;
    const updateFields = {
      artdsartc: req.body.artdsartc,
      artdsgenc: req.body.artdsgenc,
      artclasic: req.body.artclasic,
      artcodbac: req.body.artcodbac,
      artfabric: req.body.artfabric,
      //artfecald: req.body.artfecald, // asegúrate de formatear la fecha si es necesario
      arttipprc: req.body.arttipprc,
      umecdumen: req.body.umecdumen,
      satclavec: req.body.satclavec,
      ivacdivan: req.body.ivacdivan
    };

    const [updated] = await articulos.update(updateFields, {
      where: { artcdartn: artcdartn }
    });

    if (updated) {
      const updatedArticulo = await articulos.findOne({ where: { artcdartn: artcdartn } });
      res.status(200).json({ articulo: updatedArticulo });
    } else {
      res.status(404).send('Artículo no encontrado');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
}