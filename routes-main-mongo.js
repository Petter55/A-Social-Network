const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const flash = require('connect-flash')
const bcrypt = require('bcryptjs')
const mysql = require('mysql')
const session = require('express-session')
const path = require('path')
const app = express()
const formidable = require('formidable')
const mongoClient = require('mongodb').MongoClient

const LocalStrategy = require('passport-local').Strategy

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(__dirname))
app.set('trust proxy', 1) // trust first proxy
app.use(passport.initialize())
bcrypt.genSalt(10, (err, salt) => {
  if (err) console.log(err)
  app.use(session({ secret: salt, resave: true, saveUninitialized: true })) // If your application uses persistent login sessions, passport.session() middleware must also be used.
})

app.use(flash()) // flash eh a mensagem padrao de erro ou sucesso de login do passport

let user = {nome: '', id: '', imagem: '', authToken: ''}

passport.use(new LocalStrategy( // o filtro de buscar o usuario no banco de dados.
  function (username, password, done) {
    mongoClient.connect('mongodb://localhost:27017/User', { useNewUrlParser: true }, (err, client) => {
      if (err) console.log(`Não conseguiu se conectar ao servidor mongo: ${err}`)

      const db = client.db('User')
      db.collection('User').findOne({nome: username}).then((docs) => {
        console.log('print:' + docs)
        if (docs === null) {
          console.log('usuario nao achado' + err)
          client.close()
          return done(null, false)
        } else {
          bcrypt.compare(password, docs.password, (err, resul) => {
            if (err) {
              console.log(err)
            }
            if (resul === false) {
              client.close()
              console.log('false')
              return done(null, false)
            } else {
              console.log('true')
              user = docs
              client.close()
              return done(null, user)
            }
          })
        }
      }, (err) => {
        console.log('usuario nao achado' + err)
        client.close()
        return done(null, false)
      })
    })
  })
)

passport.serializeUser(function (user, done) {
  done(null, user._id)
})

passport.deserializeUser(function (id, done) {
  mongoClient.connect('mongodb://localhost:27017/User', { userNewUrlParser: true }, (err, client) => {
    if (err) console.log(`Não conseguiu se conectar ao servidor mongo: ${err}`)
    const db = client.db('User')
    db.collection('User').findOne({_id: id}).then((docs) => {
      user = docs
      client.close()
      done(err, user)
    })
  })
})

app.post('/', passport.authenticate('local', { failureRedirect: '/nada', failureFlash: true }), (req, res) => {
  user.nome = req.user.nome
  user.id = req.user.id
  user.authToken = req.user.auth_token
  user.imagem = req.user.imagem
  let form = formidable.IncomingForm()
  form.uploadDir = './images'
  form.keepExtensions = true
  form.parse(req, function (err, fields, files) {
    if (err) {
      console.log(err)
    }
    console.log('fields: ' + fields)
    console.log('files: ' + files)
  })
  res.redirect(`/home:${req.user.auth_token}`) // esse user.id tá vindo do done(null, user) do localStrategy
}) // aqui passport.authenticate eh um middleware, entao depois ainda pode ter o (req,res) => {}

app.get('/home:id', (req, res) => {
  let usuario = {nome: user.nome, imagem: '', amigos: '', posts: ''}
  mongoClient.connect('mongodb://localhost:27017/User', { useNewUrlParser: true }, (err, client) => {
    if (err) console.log(err)
    const db = client.db('User')
    db.collection('User').findOne({nome: usuario.nome}).then((docs) => {
      console.log(docs)
      usuario.imagem = docs.imagem
      usuario.amigos = docs.amigos_id
      usuario.posts = docs.posts
      res.render(path.join(__dirname, '/views/home.hbs'), usuario)
    })
  })
}) // aqui passport eh um middleware, entao depois ainda pode ter o (req,res) =>

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/views/index.html'))
})

app.get('/config:id', passport.authenticate('local', { successRedirect: `/config:${user.authToken}`, failureRedirect: '/nada', failureFlash: true }), (req, res) => {
  res.send('foi')
})

app.post('/home', (req, res) => {
  console.log('entrou')
  console.log('body: ' + JSON.stringify(req.body, undefined, 4))
  // console.log('userCadastro: ' + JSON.parse(req, undefined, 4))
  if (req.body.user_cadastro) {
    let cadastro = {user: req.body.user_cadastro, email: req.body.email_cadastro, password: req.body.senha_cadastro, auth_token: req.body.user_cadastro}
    // if (!validator.isEmail(cadastro.email_cadastro)) {
    //   res.send('email invalido')
    // }
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.log(err)
      }
      bcrypt.hash(cadastro.password, salt, (err, hash) => {
        if (err) {
          console.log(err)
        }
        cadastro.password = hash
      })
      bcrypt.hash(cadastro.auth_token, salt, (err, hash) => {
        if (err) {
          console.log(err)
        }
        cadastro.auth_token = hash
      })
    })
    // cadastro.auth_token = jwt.sign(cadastro.user, 'galinha').toString()
    mongoClient.connect('mongodb://localhost:27017/User', { useNewUrlParser: true }, (err, client) => {
      if (err) console.log(`Não conseguiu se conectar ao servidor mongo: ${err}`)
      const db = client.db('User')
      db.collection('User').findOne({nome: cadastro.user}).then((docs) => {
        console.log('docos: ' + docs)
        if (docs === null) {
          db.collection('User').insertOne({nome: cadastro.user, email: cadastro.email, password: cadastro.password, auth_token: cadastro.auth_token, imagem: './user_images/avatar.jpg', amigos_id: [], posts: []}).then((docs) => {
            console.log('entrou ' + docs)
            client.close()
            res.redirect(`/`)
          }, (err) => console.log('unable', err))
        } else {
          res.send('usuario já cadastrado')
          client.close()
        }
      })
    })
  }
})

app.listen(3001)
