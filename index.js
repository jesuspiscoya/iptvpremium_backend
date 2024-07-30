const express = require("express");
const cors = require("cors");
const pool = require("./postgre");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "¡Hola, mundo!" });
});

app.get("/channels", async (req, res) => {
  try {
    const channels = await pool.query("SELECT * FROM channels");
    const listChannels = channels.rows.map((channel) => {
      return {
        id: channel.id,
        name: channel.name,
        logo: channel.logo,
      };
    });
    res.status(200).json(listChannels);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los canales" });
  }
});

app.post("/channel", async (req, res) => {
  const { id } = req.body;

  try {
    const channel = await pool.query("SELECT * FROM channels WHERE id = $1", [
      id,
    ]);

    if (channel.rows.length > 0) {
      res.status(200).json(channel.rows);
    } else {
      res.status(404).json({ error: "No se encontró el canal" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los canales" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
