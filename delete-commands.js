const { REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

const rest = new REST().setToken(process.env.DISCORD_TOKEN);
/*
const commands = [
        '1143537632186486824',
        '1143537632186486825',
        '1143537632186486826',
    ];
*/
/*
// for ALL guild-based
rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, '1133956402466005024'), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);
*/
/*
// for global commands BY IDS array
for (let i = 0; i < commands.length; i++) {
    rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, commands[i]))
        .then(() => console.log('Successfully deleted application command'))
        .catch(console.error);
}
*/
// for ALL global commands
rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);

