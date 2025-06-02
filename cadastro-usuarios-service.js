// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Método HTTP GET /hello - envia a mensagem: Hello World
app.get('/hello', (req, res) => {
 res.send('Hello World');
});

// Inicia o Servidor na porta 8080
let porta = 8080;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});

// Importa o package do SQLite
const sqlite3 = require('sqlite3');

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database('./dados-usuarios.db', (err) => {
        if (err) {
            console.log('ERRO: não foi possível conectar ao SQLite.');
            throw err;
        }
        console.log('Conectado ao SQLite!');
    });

// Cria a tabela cadastro, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS cadastro 
        (nome TEXT NOT NULL, email TEXT NOT NULL, 
         cpf INTEGER PRIMARY KEY NOT NULL UNIQUE,
         numero BIGINT(14) NOT NULL UNIQUE)`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela.');
              throw err;
           }
      });

// Método HTTP POST /usuarios - cadastra um novo usuário
app.post('/usuarios', (req, res, next) => {
    db.run(`INSERT INTO cadastro(nome, email, cpf, numero) VALUES(?,?,?,?)`, 
         [req.body.nome, req.body.email, req.body.cpf, req.body.numero], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao cadastrar usuário.');
        } else {
            console.log('Usuário cadastrado com sucesso!');
            res.status(200).send('Usuário cadastrado com sucesso!');
        }
    });
});

// Método HTTP PUT /usuarios/:id - Atualiza todos os dados de um usuário
app.put('/usuarios/:id', (req, res, next) => {
    db.run(`UPDATE cadastro SET nome = ?, email = ?, cpf = ?, numero = ? WHERE id = ?`, 
         [req.body.nome, req.body.email, req.body.cpf, req.body.numero, req.params.id], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao atualizar usuário.');
        } else {
            console.log('Usuário atualizado com sucesso!');
            res.status(200).send('Usuário atualizado com sucesso!');
        }
    });
});

// Método HTTP PATCH /usuarios/:cpf - Atualiza parcialmente os dados de um usuário (exceto o CPF)
app.patch('/usuarios/:cpf', (req, res, next) => {
    let updates = [];
    let values = [];
    
    // Verifica quais campos foram enviados no body (exceto CPF)
    if (req.body.nome !== undefined) {
        updates.push("nome = ?");
        values.push(req.body.nome);
    }
    if (req.body.email !== undefined) {
        updates.push("email = ?");
        values.push(req.body.email);
    }
    if (req.body.numero !== undefined) {
        updates.push("numero = ?");
        values.push(req.body.numero);
    }
    // CPF não é incluído nas atualizações, mesmo se enviado
    
    values.push(req.params.cpf); // Adiciona o CPF no final para o WHERE
    
    if (updates.length === 0) {
        return res.status(400).send('Nenhum campo válido para atualização fornecido.');
    }
    
    const query = `UPDATE cadastro SET ${updates.join(", ")} WHERE cpf = ?`;
    
    db.run(query, values, (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao atualizar cliente.');
        } else {
            console.log('Usuário atualizado parcialmente com sucesso!');
            res.status(200).send('Usuário atualizado parcialmente com sucesso!');
        }
    });
});

// Método HTTP GET /usuarios - retorna todos os cadastros
app.get('/usuarios', (req, res, next) => {
    db.all(`SELECT * FROM cadastro`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /usuarios/:cpf - retorna cadastro do usuário com base no CPF
app.get('/usuarios/:cpf', (req, res, next) => {
    db.get( `SELECT * FROM cadastro WHERE cpf = ?`, 
            req.params.cpf, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Usuário não encontrado.");
            res.status(404).send('Usuário não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});

//Método HTTP DELETE /usuarios/:cpf - remove um usuário do cadastro
app.delete('/usuarios/:cpf', (req, res, next) => {
    db.run(`DELETE FROM cadastro WHERE cpf = ?`, req.params.cpf, function(err) {
      if (err){
         res.status(500).send('Erro ao remover usuário.');
      } else if (this.changes == 0) {
         console.log("Usuário não encontrado.");
         res.status(404).send('Usuário não encontrado.');
      } else {
         res.status(200).send('Usuário removido com sucesso!');
      }
   });
});