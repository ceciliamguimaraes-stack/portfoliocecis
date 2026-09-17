const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// CONEXÃO COM O MYSQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "portfolio"
});


// TESTAR CONEXÃO
db.connect((erro) => {

    if (erro) {
        console.error("Erro ao conectar ao MySQL:", erro);
        return;
    }

    console.log("Conectado ao banco de dados PORTFOLIO!");
});


// LOGIN
app.post("/login", (req, res) => {

    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Preencha usuário e senha."
        });
    }

    const sql = `
        SELECT id, usuario, tipo
        FROM usuarios
        WHERE usuario = ? AND senha = ?
    `;

    db.query(sql, [usuario, senha], (erro, resultados) => {

        if (erro) {
            console.error(erro);

            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro no banco de dados."
            });
        }

        if (resultados.length === 0) {

            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário ou senha incorretos."
            });
        }

        const usuarioEncontrado = resultados[0];

        res.json({
            sucesso: true,
            mensagem: "Login realizado!",
            usuario: usuarioEncontrado.usuario,
            tipo: usuarioEncontrado.tipo
        });
    });
});


// INICIAR SERVIDOR
app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});