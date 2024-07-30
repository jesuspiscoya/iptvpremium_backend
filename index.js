const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.json({ message: "¡Hola, mundo!" });
});

app.get("/channels", (req, res) => {
  res.json({ message: "Listado de canales" });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
