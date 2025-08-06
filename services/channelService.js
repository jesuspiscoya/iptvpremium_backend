const MysqlService = require("./mysqlService");

class ChannelService {
  constructor() {
    this.mysql = new MysqlService().getConnection();
  }

  getChannel = async (id) => {
    const [channel] = await this.mysql.query(
      "SELECT * FROM channels WHERE id = ?",
      [id]
    );

    return {
      id: channel[0].id,
      channel_id: channel[0].channel_id,
      name: channel[0].name,
      logo: channel[0].logo,
      group: channel[0].group_title,
      url: channel[0].url,
      state: channel[0].state,
    };
  };

  getChannels = async () => {
    const [channels] = await this.mysql.query(
      "SELECT * FROM channels ORDER BY id"
    );

    return channels.map((channel) => {
      return {
        id: channel.id,
        channel_id: channel.channel_id,
        name: channel.name,
        logo: channel.logo,
        group: channel.group_title,
        state: channel.state,
      };
    });
  };

  getPlaylist = async () => {
    const [channels] = await this.mysql.query(
      "SELECT * FROM channels ORDER BY id"
    );

    const header = "#EXTM3U\n";
    const body = channels
      .map(({ channel_id, name, logo, group_title, url }) => {
        return `#EXTINF:-1 tvg-id="${channel_id}" tvg-name="${name}" tvg-logo="${logo}" group-title="${group_title}", ${name}\n${url}`;
      })
      .join("\n\n");

    return header + body;
  };

  getChannelsEpg = async () => {
    const [channels] = await this.mysql.query(
      "SELECT * FROM channels GROUP BY channel_id ORDER BY id"
    );
    return channels;
  };
}

module.exports = ChannelService;
