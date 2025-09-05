require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const distube = new DisTube(client, {
  leaveOnEmpty: true,
  plugins: [new YtDlpPlugin()]
});

client.once('ready', () => {
  console.log(`✅ Bot aktif sebagai ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const args = message.content.split(' ');
  const command = args.shift().toLowerCase();

  // !play <url or query>
  if (command === '!play') {
    if (!message.member.voice.channel) {
      return message.reply('❌ Kamu harus join voice channel dulu!');
    }
    const query = args.join(' ');
    if (!query) return message.reply('🎵 Masukkan judul lagu atau link YouTube!');

    distube.play(message.member.voice.channel, query, {
      textChannel: message.channel,
      member: message.member
    });
  }

  if (command === '!skip') {
    distube.skip(message);
  }

  if (command === '!stop') {
    distube.stop(message);
    message.channel.send('⏹️ Musik dihentikan.');
  }

  if (command === '!queue') {
    const queue = distube.getQueue(message);
    if (!queue) return message.reply('Queue kosong.');
    message.channel.send('🎶 Queue:\n' + queue.songs.map((s, i) =>
      `${i + 1}. ${s.name} - \`${s.formattedDuration}\``).join('\n'));
  }
});

// Event distube
distube
  .on('playSong', (queue, song) =>
    queue.textChannel.send(`▶️ Memutar: **${song.name}** - \`${song.formattedDuration}\``))
  .on('addSong', (queue, song) =>
    queue.textChannel.send(`➕ Ditambahkan: **${song.name}** - \`${song.formattedDuration}\``))
  .on('error', (channel, error) => {
    console.error(error);
    channel.send('❌ Terjadi error saat memutar lagu!');
  });

client.login(process.env.DISCORD_TOKEN);
