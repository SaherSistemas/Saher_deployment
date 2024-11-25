const { Op } = require('sequelize');
const Usuarios = require('../models/USUARIOS/Usuarios.js');
const Clientes = require('../models/CLIENTES/Clientes.js');
const Agentes = require('../models/AGENTES/Agentes.js');
const Administradores = require('../models/ADMINISTRADORES/Administradores.js')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


exports.agregarUsuario = async (req, res) => {

    try {
        let clienteExistente, agenteExistente, adminExistente;

        // Verificar si la clave del cliente (clvcli) existe en la base de datos
        if (req.body.clvcli !== undefined) {
            clienteExistente = await Clientes.findOne({ where: { clicdclic: req.body.clvcli } });
            if (!clienteExistente) {
                return res.status(400).json({ mensaje: 'La clave de cliente no existe' });
            }
        } else if (req.body.clvage !== undefined) {
            agenteExistente = await Agentes.findOne({ where: { agecdagen: req.body.clvage } });
            if (!agenteExistente) {
                return res.status(400).json({ mensaje: 'La clave de vendedor no existe' });
            }
        } else if (req.body.clvadmin !== undefined) {
            adminExistente = await Administradores.findOne({ where: { cd_adminweb: req.body.clvadmin } });
            if (!adminExistente) {
                return res.status(400).json({ mensaje: 'La clave de adminstr no existe' });
            }
        }

        const usuarioNuevo = {
            usuarioweb: req.body.usuarioweb,
            contraweb: await bcrypt.hash(req.body.contraweb, 12),
            clvcli: clienteExistente ? req.body.clvcli : null,
            clvage: agenteExistente ? req.body.clvage : null,
            clvadmin: req.body.clvadmin ? req.body.clvadmin : null,
        };

        // Guardar nuevo usuario en la base de datos
        await Usuarios.create(usuarioNuevo);

        res.json({ mensaje: 'Usuario creado correctamente' });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ mensaje: 'Hubo un error al crear el usuario' });
    }
};
exports.autenticarUsuario = async (req, res, next) => {
    const { usuarioweb, contraweb } = req.body;

    try {
        const usuario = await Usuarios.findOne({
            where: { usuarioweb },
            include: [
                { model: Clientes, as: 'cliente' },
                { model: Agentes, as: 'agente' },
                { model: Administradores, as: 'administrador' }
            ]
        });

        // Si no existe el usuario, devuelve un mensaje de error
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Ese usuario no existe' });
        }

        // Verifica si el usuario está activado
        if (usuario.statusadmin !== 'A') {
            return res.status(403).json({ mensaje: 'Usuario no activado' });
        }

        // Verifica si la contraseña es incorrecta
        if (!bcrypt.compareSync(contraweb, usuario.contraweb)) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        // Determinar el tipo de usuario
        let tipoUsuario = '';
        let claveUsuario = '';

        if (usuario.clvadmin) {
            tipoUsuario = 'A'; // Administrador
            claveUsuario = usuario.clvadmin; // Clave del administrador
        } else if (usuario.clvage) {
            tipoUsuario = 'B'; // Agente
            claveUsuario = usuario.clvage; // Clave del agente
        } else if (usuario.clvcli) {
            tipoUsuario = 'C'; // Cliente
            claveUsuario = usuario.clvcli; // Clave del cliente
        }

        // Si todo es correcto, generar el token
        const token = jwt.sign(
            {
                usuarioweb: usuario.usuarioweb,
            },
            'LLAVESECRETA',
            {
                expiresIn: '1h',
            }
        );

        // Enviar el token, tipo de usuario y la clave al cliente
        res.json({
            token,
            tipoUsuario,  // A: Administrador, B: Agente, C: Cliente
            claveUsuario  // Clave según el tipo de usuario
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};



exports.allUsers1 = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;
        const searchTerm = req.query.nombre || '';
        const estado = req.query.estado || 'A';

        const whereCondition = {
            ...(estado && { statusadmin: estado }),
            ...(searchTerm && {
                [Op.or]: [
                    { usuarioweb: { [Op.iLike]: `%${searchTerm}%` } }, // Búsqueda en usuario
                    { '$cliente.clinomcoc$': { [Op.iLike]: `%${searchTerm}%` } }, // Búsqueda en nombre del cliente
                    { '$agente.agedsagec$': { [Op.iLike]: `%${searchTerm}%` } }, // Búsqueda en nombre del agente
                    { '$administrador.nom_adminweb$': { [Op.iLike]: `%${searchTerm}%` } } // Búsqueda en nombre del administrador
                ]
            })
        };

        const { count, rows } = await Usuarios.findAndCountAll({
            where: whereCondition,
            include: [
                { model: Clientes, attributes: ['clinomcoc'], as: 'cliente' },
                { model: Agentes, attributes: ['agedsagec'], as: 'agente' },
                { model: Administradores, attributes: ['nom_adminweb'], as: 'administrador' }
            ],
            offset: offset,
            limit: limit,
            order: [['usuarioweb', 'ASC']]
        });

        const processedRows = rows.map(row => {
            let fieldWithValue = {};
            if (row.clvcli) {
                fieldWithValue = {
                    clvcli: row.clvcli.trim(),
                    clienteNombre: row.cliente ? row.cliente.clinomcoc.trim() : null
                };
            } else if (row.clvage) {
                fieldWithValue = {
                    clvage: row.clvage,
                    agenteNombre: row.agente ? row.agente.agedsagec.trim() : null
                };
            } else if (row.clvadmin) {
                fieldWithValue = {
                    clvadmin: row.clvadmin,
                    adminNombre: row.administrador ? row.administrador.nom_adminweb.trim() : null
                };
            }

            return {
                usuarioweb: row.usuarioweb.trim(),
                statusadmin: row.statusadmin.trim(),
                ...fieldWithValue
            };
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            items: processedRows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
        next(error);
    }
};

/*DESACTIVAR ARTICULO */
exports.activarYDesactivarUsuario = async (req, res, next) => {
    try {
        const activoONo = await Usuarios.findOne({
            attributes: ['statusadmin'],
            where: {
                usuarioweb: req.body.usuarioweb,
            },
        });
     
        /*const nuevoVa = null
    /*SI ES A CAMBIAR a D SI ES D cambiar a A */
        if (activoONo.statusadmin == 'A') {
            nuevoVa = 'D'
        }
        else if (activoONo.statusadmin == 'D') {
            nuevoVa = 'A'
        }


        /*ACTUALIZAR EL ESTATUS DEL ARTICULO */
        await Usuarios.update(
            { statusadmin: nuevoVa },
            { where: { usuarioweb: req.body.usuarioweb } }
        );
        res.status(200).json({ mensaje: 'Usuario actualizado correctamente' })
    } catch (error) {
        res.status(400).json({ error: error.message });
        next(error)
    }
};


exports.cambiarContrasena = async (req, res, next) => {
    try {
        const { usuarioweb, contrawebAntigua, contrawebNueva } = req.body;

        // Buscar usuario por nombre de usuario
        const usuario = await Usuarios.findOne({ where: { usuarioweb } });
        if (!usuario) {
            // SI EL USUARIO NO EXISTE
            return res.status(401).json({ mensaje: 'Ese usuario no existe' });
        }

        // Verificar si la contraseña antigua es correcta
        if (!bcrypt.compareSync(contrawebAntigua, usuario.contraweb)) {
            // SI LA CONTRASEÑA ANTIGUA ES INCORRECTA
            return res.status(401).json({ mensaje: 'Contraseña antigua incorrecta' });
        }

        // Encriptar la nueva contraseña
        const hashedNewPassword = await bcrypt.hash(contrawebNueva, 12);

        // Actualizar la contraseña del usuario
        await Usuarios.update(
            { contraweb: hashedNewPassword },
            { where: { usuarioweb } }
        );

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ mensaje: 'Hubo un error al cambiar la contraseña' });
    }
};

exports.obtenerUsuario = async (req, res, next) => {
    try {
        const { claveUsuario } = req.body;

        // Busca el usuario que tenga alguna de las claves proporcionadas
        const usuarioWeb = await Usuarios.findOne({
            where: {
                [sequelize.Op.or]: [
                    { clvcli: claveUsuario },
                    { clvage: claveUsuario },
                    { clvadmin: claveUsuario }
                ]
            },
            include: [
                { model: Clientes, as: 'cliente' },
                { model: Agentes, as: 'agente' },
                { model: Administradores, as: 'administrador' }
            ]
        });

        if (!usuarioWeb) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.json(usuarioWeb);

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el usuario' });
    }
};

exports.cambiarContrasenaSinVerificarAntigua = async (req, res, next) => {
    try {
        const { usuarioweb } = req.params; // Obtener el parámetro de la URL
        const { contrawebNueva } = req.body;


        // Buscar usuario por nombre de usuario
        const usuario = await Usuarios.findOne({ where: { usuarioweb } });
        if (!usuario) {
            // Si el usuario no existe
            return res.status(401).json({ mensaje: 'Ese usuario no existe' });
        }

        // Encriptar la nueva contraseña
        const hashedNewPassword = await bcrypt.hash(contrawebNueva, 12);

        // Actualizar la contraseña del usuario
        await Usuarios.update(
            { contraweb: hashedNewPassword },
            { where: { usuarioweb } }
        );

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ mensaje: 'Hubo un error al cambiar la contraseña' });
    }
};



/*CLIENTES */
exports.perfil = async (req, res, next) => {
    try {
        const { tipoUsuario, claveUsuario } = req.query;

        if (!tipoUsuario || !claveUsuario) {
            return res.status(400).json({ message: 'Faltan parámetros' });
        }

        let infoUsuario;

    


        if (tipoUsuario === 'A') {
            infoUsuario = await Administradores.findOne({
                where: {
                    cd_adminweb: claveUsuario
                }
            });
        } else if (tipoUsuario === 'C') {
            infoUsuario = await Clientes.findOne({
                where: {
                    clicdclic: claveUsuario.trim()
                }
            });
        }

        if (!infoUsuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json(infoUsuario);
    } catch (error) {
        console.error("Error en el controlador perfil:", error);
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

