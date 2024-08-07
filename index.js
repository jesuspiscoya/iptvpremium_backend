const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const pool = require("./postgre");
const e = require("express");

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

const errorServer = {
  status: 500,
  message: "Ocurrió un error en el servidor.",
};

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "¡Hola, mundo!" });
});

app.post("/api/login", async (req, res) => {
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

    if (user.rows.length > 0) {
      res.status(200).json({ data: listUser, metadata: success });
    } else {
      res.status(400).json({ data: [], metadata: incorrect });
    }
  } catch (error) {
    res.status(500).json({ error: error, metadata: errorServer });
  }
});

app.get("/api/channels", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const payload = jwt.verify(token, SECRET);

    if (!token) return res.status(401).json({ error: "Token required." });
    if (Date.now() >= payload.exp)
      return res.status(401).json({ error: "Token expired." });
  } catch (error) {
    return res.status(401).json({ error: error.message });
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
    res.status(500).json({ error: error, metadata: errorServer });
  }
});

app.post("/api/channel", async (req, res) => {
  const { id } = req.body;

  try {
    const token = req.headers.authorization?.split(" ")[1];
    const payload = jwt.verify(token, SECRET);

    if (!token) return res.status(401).json({ error: "Token required." });
    if (Date.now() >= payload.exp)
      return res.status(401).json({ error: "Token expired." });
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    const channel = await pool.query("SELECT * FROM channels WHERE id = $1", [
      id,
    ]);

    if (channel.rows.length > 0) {
      res.status(200).json({ data: channel.rows, metadata: success });
    } else {
      res.status(404).json({ data: [], metadata: incorrect });
    }
  } catch (error) {
    res.status(500).json({ error: error, metadata: errorServer });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
