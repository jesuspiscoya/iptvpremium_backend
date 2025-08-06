const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const ChannelService = require("../services/channelService");
const EpgService = require("../services/epgService");
const LoginService = require("../services/loginService");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.SECRET_KEY;

app.use(cors());
app.use(express.json());

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

const verifyToken = (req, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const payload = jwt.verify(token, SECRET);

  if (Date.now() >= payload.exp)
    next({ name: "JsonWebTokenError", message: "token expired" });
};

app.get("/", (req, res) => {
  res.json({
    message: "Hello world from Perú 🇵🇪!",
    developer: "API REST made for Jesus Piscoya 🧑‍💻",
  });
});

app.post("/api/login", async (req, res, next) => {
  try {
    const user = await new LoginService().login(req.body);
    res.status(200).json({ data: user, metadata: success });
  } catch (error) {
    next(error);
  }
});

app.get("/api/channels", async (req, res, next) => {
  try {
    verifyToken(req, next);
    const channels = await new ChannelService().getChannels();
    res.status(200).json({ data: channels, metadata: success });
  } catch (error) {
    next(error);
  }
});

app.get("/api/channel/:id", async (req, res, next) => {
  try {
    verifyToken(req, next);
    const channel = await new ChannelService().getChannel(req.params.id);
    res.status(200).json({ data: channel, metadata: success });
  } catch (error) {
    next(error);
  }
});

app.get("/api/playlist", async (req, res, next) => {
  try {
    const playlist = await new ChannelService().getPlaylist();

    res.type("application/x-mpegURL");
    res.set({
      "Content-Type": "application/x-mpegURL",
      "Content-Disposition": "filename=playlist.m3u",
    });
    res.send(playlist);
  } catch (error) {
    next(error);
  }
});

app.get("/api/epg", async (req, res, next) => {
  try {
    const epg = await new EpgService().getEpg();
    res.type("application/xml");
    res.status(200).send(epg);
  } catch (error) {
    next(error);
  }
});

app.get("/api/epg/update", async (req, res, next) => {
  try {
    const data = await new EpgService().updateEpg();
    res.status(200).json({ messaje: data, metadata: success });
  } catch (error) {
    next(error);
  }
});

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: "Not found endpoint" });
};

const errorHandler = (error, req, res, next) => {
  if (error.name === "TypeError") {
    return res.status(400).json({ error: error.message, metadata: incorrect });
  } else if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error: error.message, metadata: errorToken });
  }

  return res.status(500).json({ error: error.message, metadata: errorServer });
};

app.use(unknownEndpoint);
app.use(errorHandler);

app.listen(PORT);
