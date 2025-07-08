const { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const teams = require('./config/teams');
const { token, ownerId } = require('./config/botconfig');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
  console.log(`Bot aktif: ${client.user.tag}`);
});

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

client.on('messageCreate', async (message) => {
  if (message.content === '!takım-rol') {
    if (message.author.id !== ownerId) return message.reply('Bu komutu sadece bot sahibi kullanabilir.');

    // Takımları 25'lik parçalara böl
    const teamChunks = chunkArray(teams, 25);
    const rows = teamChunks.map((chunk, idx) => {
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`takim_rolu_${idx+1}`)
          .setPlaceholder(`Takımını seç (Bölüm ${idx+1})`)
          .setMinValues(0)
          .setMaxValues(1)
          .addOptions(
            chunk.map(team => ({
              label: team.name,
              value: team.roleId,
              emoji: team.emoji ? { name: team.emoji } : undefined
            }))
          )
      );
    });

    const embed = new EmbedBuilder()
      .setAuthor({
        name: 'Neva Development - Takım Rolleri',
        iconURL: client.user.displayAvatarURL()
      })
      .setDescription('Aşağıdaki menülerden takımını seçerek ilgili rolü alabilirsin!\n\n> Her kullanıcı sadece **bir** takım seçebilir. Sadece bir menüden seçim yapmalısın.')
      .setColor(0xE30A17);

    await message.channel.send({ embeds: [embed], components: rows });
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (!interaction.customId.startsWith('takim_rolu_')) return;

  const selectedRoleId = interaction.values[0];
  const member = interaction.member;

  // Önce eski takım rollerini kaldır
  const teamRoleIds = teams.map(t => t.roleId);
  await member.roles.remove(teamRoleIds);

  // Eğer bir seçim yaptıysa rolü ekle
  if (selectedRoleId) {
    await member.roles.add(selectedRoleId);
    await interaction.reply({ content: 'Takım rolün başarıyla güncellendi!', ephemeral: true });
  } else {
    await interaction.reply({ content: 'Seçim yapmadın, takım rolün kaldırıldı.', ephemeral: true });
  }
});

client.login(token); 