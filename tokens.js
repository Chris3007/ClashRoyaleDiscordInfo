module.exports.discordToken = "Discord bot token";
module.exports.apiToken = "Clash Royale dev token";


//Put the your clantag without the # here
module.exports.clanToken = "Clash royale clan #";

//This is the prefix that the bot will respond to
module.exports.prefix = "!!"

//This will be the channel where the bot posts information about clan war
module.exports.restrictedChannelClan = "Discord channel id for clan info";

//This is to limit the bot to 1 channel (apart from the restrictedChannelClan)
// It's not necessary to add this. If you leave it blank, the bot will work in every channel where it has writing premissions
module.exports.restrictedChannel = "Discord channel id for user info";

/*\ This is to limit to 1 extra server.
|*| The bot will only work in the restrictedChannel and this server
|*| It is not necessary to add this, as it is mainly for testing the bot
\*/
module.exports.restrictedGuild = "Discord server id for user info";
