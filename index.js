const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const pool = require("./postgre");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY;

const success = {
  status: 200,
  message: "El proceso fue exitoso.",
};

const incorrect = {
  status: 400,
  message: "Error en la solicitud.",
};

const errorToken = {
  status: 401,
  message: "Se requiere Token.",
};

const errorServer = {
  status: 500,
  message: "Ocurrió un error en el servidor.",
};

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Hello world from Perú 🇵🇪!",
    developer: "API REST made for Jesus Piscoya 🧑‍💻",
  });
});

app.post("/api/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );
    const token = jwt.sign(
      { email: email, exp: Date.now() + 12 * 60 * 60 * 1000 },
      SECRET
    );

    const listUser = user.rows.map((user) => {
      return {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        status: user.status,
        token: token,
      };
    });

    if (user.rows.length === 0)
      return res
        .status(400)
        .json({ error: "Email or password incorrect", metadata: incorrect });

    res.status(200).json({ data: listUser, metadata: success });
  } catch (error) {
    next(error);
  }
});

app.get("/api/channels", async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const payload = jwt.verify(token, SECRET);

    if (Date.now() >= payload.exp)
      next({ name: "JsonWebTokenError", message: "token expired" });
  } catch (error) {
    next(error);
  }

  try {
    const channels = await pool.query("SELECT * FROM channels");
    const listChannels = channels.rows.map((channel) => {
      return {
        id: channel.id,
        name: channel.name,
        logo: channel.logo,
      };
    });

    res.status(200).json({ data: listChannels, metadata: success });
  } catch (error) {
    next(error);
  }
});

app.get("/api/channel/:id", async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const payload = jwt.verify(token, SECRET);

    if (Date.now() >= payload.exp)
      next({ name: "JsonWebTokenError", message: "token expired" });
  } catch (error) {
    next(error);
  }

  try {
    const channel = await pool.query("SELECT * FROM channels WHERE id = $1", [
      req.params.id,
    ]);

    res.status(200).json({ data: channel.rows, metadata: success });
  } catch (error) {
    next(error);
  }
});

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "Not found endpoint" });
};

const errorHandler = (error, req, res, next) => {
  if (error.routine === "pg_strtoint64") {
    return res.status(400).json({ error: error.message, metadata: incorrect });
  } else if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error: error.message, metadata: errorToken });
  }

  return res.status(500).json({ error: error.message, metadata: errorServer });
};

app.use(unknownEndpoint);
app.use(errorHandler);

app.listen(PORT);
