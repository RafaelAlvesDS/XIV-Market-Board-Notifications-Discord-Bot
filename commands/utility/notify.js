const { SlashCommandBuilder } = require('discord.js');
const notificationSchema = require('../../schemas/notification');
const retainerSchema = require('../../schemas/retainers');
const itemsIds = require('../../items');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('notify')
		.setDescription('Notify when someone cuts your price on the market board!')
		.addStringOption(option =>
			option.setName('item-id')
				.setDescription('The ID of the item')
				.setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('retainer')
                .setDescription('The name of the retainer selling the item')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('home-server')
                .setDescription('The name of your home server. Ex: Behemoth')
                .setRequired(true)
                .setAutocomplete(true)),
    async autocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        let choices;
        let filtered;
        if (focusedOption.name === 'item-id') {
            choices = itemsIds;
            // console.log(choices);
            filtered = choices.filter(choice => choice.en.toLowerCase().includes(focusedOption.value.toLowerCase())).slice(0, 25);

            await interaction.respond(
                filtered.map(choice => ({ name: choice.en, value: choice.id.toString() })),
            );

        }
        if (focusedOption.name === 'home-server') {
            choices = ['Ravana', 'Bismarck', 'Asura', 'Belias', 'Pandaemonium', 'Shinryu', 'Unicorn', 'Yojimbo', 'Zeromus', 'Twintania', 'Brynhildr', 'Famfrit', 'Lich', 'Mateus', 'Omega', 'Jenova', 'Zalera', 'Zodiark', 'Alexander', 'Anima', 'Carbuncle', 'Fenrir', 'Hades', 'Ixion', 'Kujata', 'Typhon', 'Ultima', 'Valefor', 'Exodus', 'Faerie', 'Lamia', 'Phoenix', 'Siren', 'Garuda', 'Ifrit', 'Ramuh', 'Titan', 'Diabolos', 'Gilgamesh', 'Leviathan', 'Midgardsormr', 'Odin', 'Shiva', 'Atomos', 'Bahamut', 'Chocobo', 'Moogle', 'Tonberry', 'Adamantoise', 'Coeurl', 'Malboro', 'Tiamat', 'Ultros', 'Behemoth', 'Cactuar', 'Cerberus', 'Goblin', 'Mandragora', 'Louisoix', 'Spriggan', 'Sephirot', 'Sophia', 'Zurvan', 'Aegis', 'Balmung', 'Durandal', 'Excalibur', 'Gungnir', 'Hyperion', 'Masamune', 'Ragnarok', 'Ridill', 'Sargatanas', 'Sagittarius', 'Phantom', 'Alpha', 'Raiden', 'Marilith', 'Seraph', 'Halicarnassus', 'Maduin', '红玉海', '神意之地', '拉诺西亚', '幻影群岛', '萌芽池', '宇宙和音', '沃仙曦染', '晨曦王座', '白银乡', '白金幻象', '神拳痕', '潮风亭', '旅人栈桥', '拂晓之间', '龙巢神殿', '梦羽宝境', '紫水栈桥', '延夏', '静语庄园', '摩杜纳', '海猫茶屋', '柔风海湾', '琥珀原', '水晶塔', '银泪湖', '太阳海岸', '伊修加德', '红茶川', '黄金谷', '月牙湾', '雪松原', '카벙클', '초코보', '모그리', '톤베리', '펜리르'];
            filtered = choices.filter(choice => choice.startsWith(focusedOption.value)).slice(0, 25);
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );
        }
        if (focusedOption.name === 'retainer') {
            // choices = itemsIds;
            choices = await retainerSchema.find({ userID:interaction.user.id });
            // console.log(choices);
            filtered = choices.filter(choice => choice.retainerName.includes(focusedOption.value)).slice(0, 25);

            await interaction.respond(
                filtered.map(choice => ({ name: choice.retainerName, value: choice.retainerName })),
            );

        }

    },
	async execute(interaction) {
        const itemID = interaction.options.getString('item-id').trim();
        const homeServer = interaction.options.getString('home-server').trim();
        const retainer = interaction.options.getString('retainer').trim();

        try {
            const data = await notificationSchema.findOne({
                retainer: retainer,
                itemID: itemID,
            });

            if (!data) {
                notificationSchema.create({
                    userID : interaction.user.id,
                    channelID: interaction.channel.id,
                    itemID: itemID,
                    homeServer: homeServer,
                    retainer: retainer,
                    notified: false,
                    listings: 0,
                });
                await interaction.reply('Tá salvo!');
            }
            if (data) {
                console.log(data);
                await interaction.reply('Já tinha pedido isso antes meu nobre.');
            }
        }
        catch (error) {
            console.log(error);
        }

	},
};
