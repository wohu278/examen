const {Router} = require('express')
const router = Router()
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')

async function connectBD() {

    const connection = await mysql.createConnection({

        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'peliculas'

    })

    return connection

}

let permisos = false

router.get('/', (req, res) => {

    res.render('mainp')

})

router.get('/login', (req, res) => {

    res.render('login')

})

router.post('/login', async(req, res) => {

    const connection = await connectBD()

    const {email, pass} = req.body

    const [usuario] = await connection.execute("SELECT * FROM usuarios WHERE email = ?", [email])

    if(usuario.length > 0) {

        const decryptPass = await bcrypt.compare(pass, usuario[0].pass)

        if(decryptPass){

            permisos = true
            return res.redirect('/welcome/'+usuario[0].id)

        }

    }
    else {

        return res.redirect('/register')

    }

})

router.get('/register', (req, res) => {

    res.render('register')

})

router.post('/register', async(req, res) => {

    const connection = await connectBD()

    const {email, pass} = req.body
    const encrypPass = await bcrypt.hash(pass, 10)

    await connection.execute('INSERT INTO usuarios (email, pass) VALUES (?,?)', [email, encrypPass])
    permisos = true

    res.redirect('/welcome/'+usuario[0].id)

})

router.get('/welcome/:id', async (req, res) => {

    const connection = await connectBD()

    const{id} = req.params

    const [usuario] = await connection.execute('SELECT * FROM usuarios WHERE id = ?', [id])

    console.log(usuario);

    if(permisos) {

        res.render('welcome', {usuario})

    }
    else{

        res.sendStatus(403)

    }

})

router.get('/empty', async(req, res) => {

    const connection = await connectBD()

    if(permisos) {

        res.render('empty')

    }
    else{

        res.sendStatus(403)

    }

})

router.get('/catalogo', async(req, res) => {

    const connection = await connectBD()

    const {id} = req.params

    const [rows, fields] = await connection.execute("SELECT * FROM catalogo")

    if(permisos) {

        if(rows.length > 0) {

            res.render('catalogo', {catalogo:rows})
    
        }
        else{
    
            res.redirect("/empty")
    
        }

    }
    else {

        res.sendStatus(403)
        
    }

})

router.get('/crear', (req, res) => {

    if(permisos) {

        res.render('crear')

    }
    else{

        res.sendStatus(403)

    }

})

router.post('/crear', async(req, res) => {

    const connection = await connectBD()

    const {nombre, portada, descripcion, genero} = req.body

    await connection.execute('INSERT INTO catalogo (nombre, portada, descripcion, genero) VALUES (?, ?, ?, ?)', [nombre, portada, descripcion, genero])

    res.redirect('/catalogo')

})

router.get('/editar/:id', async(req, res) => {

    const {id} = req.params

    const connection = await connectBD()

    const [pelicula] = await connection.execute('SELECT * FROM catalogo WHERE id = ?', [id])

    if(permisos) {

        res.render('editar', {pelicula})

    }
    else{

        res.sendStatus(403)

    }

})

router.post('/editar/:id', async(req, res) => {

    const connection = await connectBD()

    const {id} = req.params

    const {nombre, portada, descripcion, genero} = req.body

    await connection.execute('UPDATE catalogo SET nombre = ?, portada = ?, descripcion = ?, genero = ? WHERE id = ?', [nombre, portada, descripcion, genero, id])

    res.redirect('/catalogo')

})

router.get('/delete/:id', async(req, res) => {

    const connection = await connectBD()

    const {id} = req.params

    if(permisos) {

        await connection.execute('DELETE FROM catalogo WHERE id = ?', [id])

        res.redirect('/catalogo')

    }
    else {

        res.sendStatus(403)

    }

})

router.use((req, res, next) => {

    res.status(404).render('404')
    next()

})

module.exports = router