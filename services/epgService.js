const ChannelService = require("./channelService");
const MysqlService = require("./mysqlService");
const cheerio = require("cheerio");
const xml2js = require("xml2js");

class EpgService {
  constructor() {
    this.channelService = new ChannelService();
    this.mysql = new MysqlService().getConnection();
    this.timeNow = new Date();
    this.timeNow.setHours(0, 0, 0, 0);
    this.timeStart = this.timeNow / 1000;
    this.timeEnd = this.timeNow.setDate(this.timeNow.getDate() + 3) / 1000;
    this.timeNow.setDate(this.timeNow.getDate() - 5);
  }

  // FUNCIÓN PARA OBTENER LA PROGRAMACIÓN DE CANALES DE MOVISTAR
  #fetchProgrammingMovistar = async (url, programming, pais) => {
    return new Promise((resolve, reject) => {
      const executeFetch = async () => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Error en la programación de Movistar ${pais}`);
          }

          const data = await response.json();
          data.Content.map((channel) => {
            var image;
            Object.keys(channel.Images).length === 0
              ? (image =
                  "https://www.imporpec.com.bo/images/image_not_available.gif")
              : (image = channel.Images.VideoFrame[0].Url);
            programming.push({
              id: channel.LiveChannelPid,
              start: channel.Start * 1000,
              stop: channel.End * 1000,
              title: channel.Title,
              description: channel.Description,
              image: image,
            });
            resolve(data);
          });
        } catch (error) {
          reject(error);
        }
      };

      executeFetch();
    });
  };

  // FUNCIÓN PARA OBTENER LOS PROGRAMACIÓN DE UNIVERSAL+
  #fetchProgrammingUniversal = async (start, end, programming) => {
    return new Promise((resolve, reject) => {
      const executeFetch = async () => {
        try {
          const response = await fetch(
            `https://www.tccvivo.com.uy/api/v1/navigation_filter/1646/filter/?cable_operator=1&emission_start=${start}&emission_end=${end}&format=json`
          );
          if (!response.ok) {
            throw new Error("Error la programación de Universal+");
          }

          const data = await response.json();
          data.results.map((channel) => {
            channel.events.map((data) => {
              programming.push({
                id: `CH${channel.id}`,
                start: new Date(data.emission_start).getTime(),
                stop: new Date(data.emission_end).getTime(),
                title: data.original_title,
                description: data.localized[0].description,
                image: data.images[0].image_media.file,
              });
              resolve(data);
            });
          });
        } catch (error) {
          reject(error);
        }
      };

      executeFetch();
    });
  };

  // FUNCIÓN PARA OBETENER LA PROGRAMACIÓN DE CANALES DE MITV
  #fetchProgrammingMiTv = async (origin, channel, date, id, programming) => {
    return new Promise((resolve, reject) => {
      const executeFetch = async () => {
        try {
          const response = await fetch(
            `https://mi.tv/${origin}/async/channel/${channel}/${date}/-300`
          );

          if (!response.ok) {
            throw new Error("Error en la programación de Mi TV");
          }

          const html = await response.text();
          const $ = cheerio.load(html);

          const chan_id = `CH${id}`;
          const programa = $(".broadcasts li a");

          for (let i = 0; i < programa.length; i++) {
            const hora_inicio = $(programa[i])
              .children()
              .children(".time")
              .text()
              .replace(/(am|pm)/g, (match) => (match === "am" ? " am" : " pm"));
            const hora_fin = $(programa[i + 1])
              .children()
              .children(".time")
              .text()
              .replace(/(am|pm)/g, (match) => (match === "am" ? " am" : " pm"));
            const inicio = new Date(`${date} ${hora_inicio}`).getTime();
            const fin =
              hora_fin !== ""
                ? new Date(`${date} ${hora_fin}`).getTime()
                : inicio + 60 * 60 * 1000;
            const titulo = $(programa[i])
              .children()
              .children("h2")
              .text()
              .trim();
            const descripcion = $(programa[i])
              .children()
              .children(".synopsis")
              .text()
              .trim();
            const imagen = $(programa[i])
              .children()
              .children(".image")
              .css("background-image")
              .replace(/(url\(|\)|"|')/g, "");

            programming.push({
              id: chan_id,
              start: id === "1083" ? inicio + 120 * 60 * 1000 : inicio,
              stop: id === "1083" ? fin + 120 * 60 * 1000 : fin,
              title: titulo,
              description: descripcion,
              image: imagen,
            });
          }

          resolve(html);
        } catch (error) {
          reject(error);
        }
      };

      executeFetch();
    });
  };

  #getProgramming = async () => {
    const programming = [];
    const timeBefore =
      new Date(this.timeNow.setHours(this.timeNow.getHours() - 5))
        .toJSON()
        .slice(0, -5) + "Z";
    const timeAfter =
      new Date(this.timeNow.setDate(this.timeNow.getDate() + 5))
        .toJSON()
        .slice(0, -5) + "Z";

    // API GUIA DE PROGRAMACION MOVISTAR PERU
    await this.#fetchProgrammingMovistar(
      `https://contentapi-pe.cdn.telefonica.com/28/default/es-PE/schedules?fields=Title,Description,ChannelName,CallLetter,Start,End,LiveChannelPid,images.videoFrame,images.banner&orderBy=START_TIME:a&filteravailability=false&starttime=${this.timeStart}&endtime=${this.timeEnd}&livechannelpids=lch2201,lch2202,lch2203,lch2205,lch3451,lch2204,lch2318,lch2219,lch2459,lch5595,lch2215,lch2319,lch3298,lch3297,lch6517,lch6518,lch5701,lch6295,lch6559,lch5623,lch2375,lch6301,lch2238,lch6290,lch5705,lch2492,lch5593,lch2303,lch2304,lch2770,lch2382,lch2328,lch2775,lch3952,lch2776,lch2813,lch2339,lch2341,lch2340,lch2342,lch2225,lch2227,lch2325,lch2228,lch6490,lch6491,lch6492,lch6496,lch6493,lch6494,lch6495,lch2333,lch2424,lch2796,lch2229,lch2322,lch2335,lch2336,lch5699,lch2189,lch2224,lch6489,lch5602,lch2344,lch2273,lch2275,lch2343,lch2353,lch2327,lch2354,lch2278,lch2277,lch5703,lch3091,lch3489,lch2269,lch2359,lch2314,lch6620,lch6298,lch2285,lch2291,lch2287,lch2491,lch2357,lch2188,lch2358,lch5625,lch6313`,
      programming,
      "PERU"
    );
    // API GUIA DE PROGRAMACION MOVISTAR COLOMBIA
    await this.#fetchProgrammingMovistar(
      `https://contentapi-co.cdn.telefonica.com/33/default/es-CO/schedules?fields=Title,Description,ChannelName,CallLetter,Start,End,LiveChannelPid,images.videoFrame,images.banner&orderBy=START_TIME:a&filteravailability=false&starttime=${this.timeStart}&endtime=${this.timeEnd}&livechannelpids=lch5689,lch2713,lch3912,lch2653,lch2738,lch3770,lch2692,lch2651,lch2632,lch3769,lch3780,lch3772,lch2680,lch2655,lch2597,lch3927,lch3839,lch2822,lch5677,lch2734`,
      programming,
      "COLOMBIA"
    );
    // API GUIA DE PROGRAMACION MOVISTAR ARGENTINA
    await this.#fetchProgrammingMovistar(
      `https://contentapi-ar.cdn.telefonica.com/29/default/es-AR/schedules?fields=Title,Description,ChannelName,CallLetter,Start,End,LiveChannelPid,images.videoFrame,images.banner&orderBy=START_TIME:a&filteravailability=false&starttime=${this.timeStart}&endtime=${this.timeEnd}&livechannelpids=lch3358,lch3356,lch3178,lch3172,lch3268,lch3128,lch3440,lch3122,lch6466`,
      programming,
      "ARGENTINA"
    );
    // API GUIA DE PROGRAMACION MOVISTAR CHILE
    await this.#fetchProgrammingMovistar(
      `https://contentapi-cl.cdn.telefonica.com/26/default/es-CL/schedules?fields=Title,Description,ChannelName,CallLetter,Start,End,LiveChannelPid,images.videoFrame,images.banner&orderBy=START_TIME:a&filteravailability=false&starttime=${this.timeStart}&endtime=${this.timeEnd}&livechannelpids=lch5542,lch4114,lch597,lch593,lch615,lch1281,lch639,lch624,lch621,lch630`,
      programming,
      "CHILE"
    );
    // API GUIA DE PROGRAMACION UNIVERSAL+
    await this.#fetchProgrammingUniversal(timeBefore, timeAfter, programming);
    // API GUIA DE PROGRAMACIÓN MITV
    for (let i = 0; i < 5; i++) {
      var date = this.timeStart * 1000 + i * 24 * 60 * 60 * 1000;
      var dateFormat = new Date(date).toISOString().slice(0, 10);

      await this.#fetchProgrammingMiTv(
        "pe",
        "de-pelicula",
        dateFormat,
        "1370",
        programming
      );
      await this.#fetchProgrammingMiTv(
        "mx",
        "hbo-oeste",
        dateFormat,
        "1570",
        programming
      );
      await this.#fetchProgrammingMiTv(
        "pe",
        "golden-edge",
        dateFormat,
        "1069",
        programming
      );
      await this.#fetchProgrammingMiTv(
        "co",
        "golden-premier-hd",
        dateFormat,
        "1082",
        programming
      );
      await this.#fetchProgrammingMiTv(
        "co",
        "golden-premier-hd",
        dateFormat,
        "1083",
        programming
      );
      await this.#fetchProgrammingMiTv(
        "ar",
        "zoomoo",
        dateFormat,
        "3271",
        programming
      );
      await this.#fetchProgrammingMiTv(
        "co",
        "fox-news-internacional",
        dateFormat,
        "5780",
        programming
      );
    }

    return programming;
  };

  getEpg = async () => {
    let xmlTv = {
      tv: {
        $: {
          generator_info_name: "Jesus Piscoya Dev",
          generator_info_url: "https://jesuspiscoya.online",
        },
      },
    };
    let xmlChannel = [];
    let xmlProgramme = [];

    const channels = await this.channelService.getChannelsEpg();
    const [programming] = await this.mysql.query(
      "SELECT * FROM programming order by id"
    );

    // Agregar canales
    channels.map((channel) => {
      xmlChannel.push({
        $: { id: channel.channel_id },
        "display-name": {
          $: { lang: "es" },
          _: channel.name.replace(/ SD| HD| FHD/g, ""),
        },
        icon: {
          $: { src: channel.logo },
        },
      });
    });

    // Agregar programas
    programming.map((program) => {
      if (!program.start || !program.end) {
        console.log(program);
      }
      xmlProgramme.push({
        $: {
          start: new Date(program.start)
            .toISOString()
            .replace(/[^0-9]/g, "")
            .slice(0, -3),
          stop: new Date(program.end)
            .toISOString()
            .replace(/[^0-9]/g, "")
            .slice(0, -3),
          channel: program.channel_id,
        },
        title: {
          $: { lang: "es" },
          _: program.title,
        },
        desc: {
          $: { lang: "es" },
          _: program.description,
        },
        icon: {
          $: { src: program.image },
        },
      });
    });

    xmlTv.tv.channel = xmlChannel;
    xmlTv.tv.programme = xmlProgramme;

    return new xml2js.Builder().buildObject(xmlTv);
  };

  updateEpg = async () => {
    await this.mysql.query("DELETE FROM programming");

    const programming = await this.#getProgramming();

    console.log(programming.length);

    // Agregar programas
    programming.forEach(async (element) => {
      const sql =
        "INSERT INTO programming (channel_id, start, end, title, description, image) VALUES (?, ?, ?, ?, ?, ?)";
      this.mysql.query(sql, Object.values(element));
    });

    return "Guía EPG actualizada con éxito!";
  };
}

module.exports = EpgService;
