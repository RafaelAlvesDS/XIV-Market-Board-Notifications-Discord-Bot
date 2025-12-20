const User = require('../models/User');

async function ensureUserHasRetainer(interaction) {
    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user || !user.retainers || user.retainers.length === 0) {
        await interaction.reply({ 
            content: '❌ Você precisa registrar pelo menos um retainer antes de usar este comando. Use `/register-retainer`.', 
            ephemeral: true 
        });
        return false;
    }
    return user;
}

module.exports = { ensureUserHasRetainer };
