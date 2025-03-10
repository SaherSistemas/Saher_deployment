const { Op } = require('sequelize');
const Usuarios = require('../models/USUARIOS/Usuarios.js');
const Clientes = require('../models/CLIENTES/Clientes.js');
const Agentes = require('../models/AGENTES/Agentes.js');
const Administradores = require('../models/ADMINISTRADORES/Administradores.js')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Factura = require('../models/CLIENTES/Facturas.js');
const Remision = require('../models/CLIENTES/Remision.js');
require('dotenv').config({ path: 'variables.env' });

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
        const usuarioLimpio = usuarioweb.trim();
        const usuario = await Usuarios.findOne({
            where: { usuarioweb: usuarioLimpio },
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
            return res.status(403).json({ mensaje: 'Usuario no activado. Comunicate con tu agente de venta' });
        }

        // Verifica si la contraseña es incorrecta
        if (!bcrypt.compareSync(contraweb, usuario.contraweb)) {
            return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
        }

        if (usuario.clvcli) {
            const clienteID = usuario.clvcli.trim();

            const ClienteFecha = await Clientes.findOne({
                where: { clicdclic: clienteID },
                attributes: ['clifecald']
            });

            if (!ClienteFecha) {
                return res.status(404).json({ mensaje: 'Cliente no encontrado' });
            }

            const fechaCliente = new Date(ClienteFecha.clifecald);
            const hoy = new Date();
            const unMesAtras = new Date(hoy);
            const tresMesesAtras = new Date();
            unMesAtras.setMonth(unMesAtras.getMonth() - 1);//1 mes
            tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3); // Restar 3 meses

            const [facturasRecientes, remisiones] = await Promise.all([
                Factura.findOne({
                    where: {
                        clicdclic: clienteID,
                        fclfecfad: { [Op.gte]: tresMesesAtras }, // Facturas en los últimos 3 meses
                        empcdempn: 20,
                    },
                }),
                Remision.findOne({
                    where: {
                        clicdclic: clienteID,
                        empcdempn: 20,
                        remstatuc: 'A',
                        remfecred: { [Op.gte]: tresMesesAtras } // Remisiones en los últimos 3 meses
                    }
                })
            ]);
            if (facturasRecientes || remisiones) {

                const token = jwt.sign(
                    {
                        usuarioweb: usuario.usuarioweb,
                    },
                    process.env.KEY,
                    {
                        expiresIn: '1h',
                    }
                );
                await Usuarios.update(
                    { fechainiciosesion: new Date() }, // Actualiza con la fecha/hora actual
                    { where: { usuarioweb } }
                );
                return res.json({
                    token,
                    tipoUsuario: 'C',
                    claveUsuario: clienteID
                });
            } else if (fechaCliente < unMesAtras && !(facturasRecientes || remisiones)) {
                await Usuarios.update(
                    { statusadmin: 'D' },
                    { where: { usuarioweb } }
                );
                return res.status(403).json({
                    mensaje: 'Tu usuario de prueba a sido desactivo, porque no realizaste ningun pedido en 1 mes. Comunicate con tu agente de ventas.'
                });
            } else if (facturasRecientes && facturasRecientes.fclfecfad < tresMesesAtras) {
                //DESACTIVAR USUARIO POR NO TENER FACTURAS RECIENTES
                await Usuarios.update(
                    { statusadmin: 'D' },
                    { where: { usuarioweb } }
                );
                return res.status(403).json({
                    mensaje: 'Tu usuario ha sido desactivado por no tener facturas recientes. Comunicate con tu agente de ventas.'
                });
            } else {
                const token = jwt.sign(
                    {
                        usuarioweb: usuario.usuarioweb,
                    },
                    process.env.KEY,
                    {
                        expiresIn: '1h',
                    }
                );

                await Usuarios.update(
                    { fechainiciosesion: new Date() }, // Actualiza con la fecha/hora actual
                    { where: { usuarioweb } }
                );
                return res.json({
                    token,
                    tipoUsuario: 'C',
                    claveUsuario: clienteID
                });
            }
        }

        let tipoUsuario = '';
        let claveUsuario = '';

        if (usuario.clvadmin) {
            tipoUsuario = 'A';
            claveUsuario = usuario.clvadmin;
        } else if (usuario.clvage) {
            tipoUsuario = 'B';
            claveUsuario = usuario.clvage;
        } else if (usuario.clvcli) {
            tipoUsuario = 'C';
            claveUsuario = usuario.clvcli;
        }

        const token = jwt.sign(
            {
                usuarioweb: usuario.usuarioweb,
            },
            process.env.KEY,
            {
                expiresIn: '1h',
            }
        );

        await Usuarios.update(
            { fechainiciosesion: new Date() }, // Actualiza con la fecha/hora actual
            { where: { usuarioweb } }
        );

        res.json({
            token,
            tipoUsuario,
            claveUsuario
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
                    { usuarioweb: { [Op.iLike]: `%${searchTerm}%` } },
                    { '$cliente.clinomcoc$': { [Op.iLike]: `%${searchTerm}%` } },
                    { '$cliente.clirazonc$': { [Op.iLike]: `%${searchTerm}%` } },
                    { '$agente.agedsagec$': { [Op.iLike]: `%${searchTerm}%` } },
                    { '$administrador.nom_adminweb$': { [Op.iLike]: `%${searchTerm}%` } }
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
            order: [['fechainiciosesion', 'DESC']]
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
exports.obtenerUsuario = async (req, res) => {
    try {
        const { claveUsuario } = req.query; // Asegúrate de que accedes a req.query para parámetros GET

        // Lógica para obtener el usuario basado en claveUsuario
        const usuarioWeb = await Usuarios.findOne({
            where: {
                [Op.or]: [
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

        res.json(usuarioWeb); // Devuelve el usuario encontrado

    } catch (error) {
        console.error('Error al obtener el usuario:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al obtener el usuario' });
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
        } else if (tipoUsuario === 'B') {
            infoUsuario = await Agentes.findOne({
                where: {
                    agecdagen: claveUsuario
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

