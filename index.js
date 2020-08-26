const Discord = require("discord.js");
const bot = new Discord.Client();

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const mysql = require('mysql');
const login = require("login"); 

const tokens = require('tokens');
const apiToken = tokens.apiToken;
const discordToken = tokens.discordToken;
const clanTag = tokens.clantoken;
const prefix = tokens.prefix;
const restrictedChannel = tokens.restrictedChannel;
const restrictedGuild = tokens.restrictedGuild;


async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}



bot.on("ready" ,function() {
    bot.user.setActivity(`prefix: '${prefix}'`, { type: 'STREAMING' });
    console.log("[" + new Date().toLocaleString() + "]");
    console.log(`Bot is active in ${bot.guilds.size} guilds, which have ${bot.users.size} users and ${bot.channels.size} channels.`); 
    console.log("The bot is ready!\n\n");


    var actSwitch = 0

    async function activity() {
        
        if(actSwitch == 0)    {
            bot.user.setActivity(`${prefix}help for available commands`, { type: 'PLAYING' });
    
            actSwitch = 1;
            }else {
                
            bot.user.setActivity(`prefix: '${prefix}'`, { type: 'STREAMING' });
            actSwitch = 0;
            }

    await delay(15000)  
    activity()
    }
    activity()

})



bot.on('message', function(message) {

    if (message.author.equals(bot.user)) return;   
    if (!message.content.startsWith(prefix)) return;

    const command = message.content.substring(prefix.length).split(/[ \n]/)[0].toLowerCase().trim();
    const suffix = message.content.substring(prefix.length + command.length).trim();
    var args = message.content.substring(prefix.length).split(" ");

    const messageId = message.author.id;
    if(message.channel.id !== restrictedChannel && message.guild.id !== restrictedGuild ) {
        message.channel.send("You can only use these command in <#"+restrictedChannel+">.").then(msg=> {
            setTimeout(function(){ 
                msg.delete(); 
            }, 5000);
            
        })
    }else if(message.guild.id == restrictedGuild || message.channel.id == restrictedChannel) {

    switch(args[0].toLowerCase()) {        

        case "help":
            message.channel.send(`prefix: ${prefix}\nRegister: Use your playertag to register\n\`${prefix}register [playertag]\`\n\n Chests: Check your (or someone else's) chest cycle\n\`${prefix}chest [playertag]\`\n\nProfile: Check your (or someone else's) statistics\n\`${prefix}profile [playertag]\`\n\n Clan: Check info about your clan\n\`\`\`${prefix}clan war\n${prefix}clan top\`\`\`\n**[BETA]**  Clan war previous: view the results of the previous clan wars\n\`${prefix}clan war (previous/p) [number (0-5)]\`\n\n**If you're already registered you won't have to place your playertag after all the commands.**`) 
        break; 


        case "register":
            if(args[1]) {
                if (args[1].charAt(0) == "#") {
                    args[1] = args[1].substr(1)
                }


                //check tag
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open( "GET", `https://api.clashroyale.com/v1/players/%23${args[1]}`, false ); // false for synchronous request
                xmlHttp.setRequestHeader("Content-type", "application/json");
                xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                xmlHttp.send();
                var result = JSON.parse(xmlHttp.responseText);
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    message.channel.send("Your data is being saved...").then((msg)=>{
                        const connection = mysql.createConnection({
                            host: login.host,
                            user: login.user,
                            password: login.password,
                            database: login.database
                        });
                        connection.connect((err) => {
                            if (err) {msg.edit(`Sorry, someting went wrong!`);}
                        });

                        connection.query(`SELECT * FROM dcMembers where userid = "${messageId}"`, (err,rows) => {
                            if(err) throw err;

                            if(rows.length >= 1) {
                                msg.edit(`You're already registerd.`);
                            }else {
                                connection.query(`INSERT INTO dcMembers(userid, tag, name) VALUES ("${messageId}","${args[1]}", "${result.name}")`, (err, rows) => {
                                    if (err) throw err;
                                    msg.edit("You're now registerd.")
                                })
                            }
                        });
                    })

                }else{
                    message.channel.send("The playertag you used was not found.")
                }
            }else{
                message.channel.send("You have to use a playertag. These are located in your in-game Clash Royale profile.")
            }
        break;


        case "chest":
            //command kist
            if (!args[1]) {
                message.channel.send("Your data is being collected").then((msg)=>{
                    const connection = mysql.createConnection({
                        host: login.host,
                        user: login.user,
                        password: login.password,
                        database: login.database
                        });
                    connection.connect((err) => {
                        if (err) {msg.edit(`Sorry, something went wrong!`);}
                    });

                    connection.query(`SELECT tag FROM dcMembers where userid = "${messageId}"`, (err,rows) => {
                        if(err) throw err;

                        if(rows.length == 0) {
                            msg.edit(`You're not registerd yet! You can do this using the '${prefix}register' command.`);
                        }else if (rows.length == 1) {
                            rows.forEach(row => {
                                /* GET kisten & laat ze zien met emotes */
                                var xmlHttp = new XMLHttpRequest();
                                xmlHttp.open( "GET", `https://api.clashroyale.com/v1/players/%23${row.tag}/upcomingchests`, false ); // false for synchronous request
                                xmlHttp.setRequestHeader("Content-type", "application/json");
                                xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                                xmlHttp.send();
                                var result = JSON.parse(xmlHttp.responseText)
                                var items = result.items;
                                    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                                    var chestMessage = "";
                                    var embed = new Discord.RichEmbed()
                                    .setColor("#0000FF")
                                    .setTitle("Chests Cycle")
                                    items.forEach(chest => {
                                        if(chest.name !== "Epic Chest") {
                                            chest.name = "a " + chest.name
                                        }else {
                                            chest.name = "an " + chest.name
                                        }
            

                                        if (chest.index == 0) {
                                            chestMessage = chestMessage + parseInt(chest.index + 1) + " win remaining for " + chest.name + ".\n"
                                            
                                        }else {
                                            chestMessage = chestMessage + parseInt(chest.index + 1) + " wins remaining for " + chest.name + ".\n"   
                                        }
                                    });
                                    embed.setDescription(chestMessage)
                                    msg.edit(embed)
                                    }else {
                                        message.channel.send("Er ging iets mis")
                                    }

                            })
                        }else {

                        }
                    });
                    connection.end()
                })
            }else {
                message.channel.send("Je data wordt opgehaald...").then((msg)=>{
                    if (args[1].charAt(0) == "#") {
                        args[1] = args[1].substr(1)
                    }

                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open( "GET", `https://api.clashroyale.com/v1/players/%23${args[1]}/upcomingchests`, false ); // false for synchronous request
                    xmlHttp.setRequestHeader("Content-type", "application/json");
                    xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                    xmlHttp.send();
                    var result = JSON.parse(xmlHttp.responseText)
                    var items = result.items;
                        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                        var chestMessage = "";
                        var embed = new Discord.RichEmbed()
                        .setColor("#0000FF")
                        .setTitle("Chests Cycle")
                        items.forEach(chest => {
                            if(chest.name !== "Epic Chest") {
                                chest.name = "a " + chest.name
                            }else {
                                chest.name = "an " + chest.name
                            }

                            if (chest.index == 0) {
                                chestMessage = chestMessage + parseInt(chest.index + 1) + " win remaining for " + chest.name + ".\n"
                                
                            }else {
                                chestMessage = chestMessage + parseInt(chest.index + 1) + " wins remaining for " + chest.name + ".\n"   
                            }
                        });
                        embed.setDescription(chestMessage)
                        msg.edit(embed)
                    }
                })
            }
        
        break;

        
        case "profile":
            // If there is no tag specified the bot will collect the information from the user that issued the command
            if (!args[1]) {
                message.channel.send("Your data is being collected...").then((msg)=>{
                const connection = mysql.createConnection({
                        host: login.host,
                        user: login.user,
                        password: login.password,
                        database: login.database
                        });
                    connection.connect((err) => {
                        if (err) {msg.edit(`Sorry, something went wrong!`);console.log("[" + new Date().toLocaleString() + "] Could not connect to database")}
                    });
        
                    connection.query(`SELECT tag FROM dcMembers where userid = "${messageId}"`, (err,rows) => {
                        if(err) throw err;
        
                        if(rows.length == 0) {
                            msg.edit(`You're not registerd yet! You can do this using the '${prefix}register' command.`);
                        }else if (rows.length == 1) {
                            rows.forEach(row => {
                                var xmlHttp = new XMLHttpRequest();
                                xmlHttp.open( "GET", `https://api.clashroyale.com/v1/players/%23${row.tag}/`, false ); // false for synchronous request
                                xmlHttp.setRequestHeader("Content-type", "application/json");
                                xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                                xmlHttp.send();
                                var result = JSON.parse(xmlHttp.responseText)
                                    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                                        var embedProfiel = new Discord.RichEmbed()
                                        .setColor("#FF0000")
                                        .setTitle("The profile of " + result.name)
            
                                        //Start datum
                                        if(result.badges[1].progress) {
                                            var startDate = new Date();
                                            var options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
                                            startDate.setDate(startDate.getDate() - result.badges[1].progress)
                                                    
                                            startDate = startDate.toLocaleDateString('en-GB', options);
                                            
                                            embedProfiel.addField("General", `EXP level: ${result.expLevel}\nStarted playing: ${startDate}\nTotal battles: ${result.battleCount}\nWins/losses: ${result.wins} | ${result.losses}\n3-crown wins: ${result.threeCrownWins}`)
                                        }else{
                                            embedProfiel.addField("General", `EXP level: ${result.expLevel} \nTotal battles: ${result.battleCount}\nWins/losses: ${result.wins} | ${result.losses}\n3-crown wins: ${result.threeCrownWins}`)                                                
                                        }
                                        //If the requested user is not in a league it will not show anything from leagueStatistics 
                                        if (result.leagueStatistics == undefined) {
                                            embedProfiel.addField("Trophies", `Arena: ${result.arena.name}\nNu: ${result.trophies}<:trophy_working:590862428544303114>\nBest season: ${result.bestSeason.trophies} <:trophy_working:590862428544303114>`)
                                        }else {
                                            embedProfiel.addField("Trophies", `Arena: ${result.arena.name}\nNow: ${result.trophies}<:trophy_working:590862428544303114>\nBest season (${result.leagueStatistics.bestSeason.id}): ${result.leagueStatistics.bestSeason.trophies}<:trophy_working:590862428544303114>\n Previous season (${result.leagueStatistics.previousSeason.id}): ${result.leagueStatistics.previousSeason.trophies}<:trophy_working:590862428544303114>`)
                                        }
                                        embedProfiel.addField("<:clan:589769271958175760>Clan" , `Rol: ${result.role.charAt(0).toUpperCase() + result.role.substring(1)}\nDonations: ${result.donations}\nDonations onstvangen: ${result.donationsReceived}\nTotal donations: ${result.totalDonations}\nWarday wins: ${result.warDayWins}`)
                                        msg.edit(embedProfiel)

                                    }else {
                                        message.channel.send("Something went wrong!")
                                    }
        
                            })
                        }else {
        
                        }
                    });
                    connection.end()
                })
            }else {
                message.channel.send("The data is being collected...").then((msg)=>{
                    if (args[1].charAt(0) == "#") {
                        args[1] = args[1].substr(1)
                    }
        
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open( "GET", `https://api.clashroyale.com/v1/players/%23${args[1]}/`, false ); // false for synchronous request
                    xmlHttp.setRequestHeader("Content-type", "application/json");
                    xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                    xmlHttp.send();
                    var result = JSON.parse(xmlHttp.responseText)
                        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                            var embedProfiel = new Discord.RichEmbed()
                            .setColor("#FF0000")
                            .setTitle("The profile of " + result.name)

                            //Start datum
                            if(result.badges[1].progress) {
                                var startDate = new Date();
                                var options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
                                startDate.setDate(startDate.getDate() - result.badges[1].progress)
                                        
                                startDate = startDate.toLocaleDateString('en-GB', options);
                                
                                embedProfiel.addField("General", `EXP level: ${result.expLevel}\nStarted playing: ${startDate}\nTotal battles: ${result.battleCount}\nWins/losses: ${result.wins} | ${result.losses}\n3-crown wins: ${result.threeCrownWins}`)
                            }else{
                                embedProfiel.addField("General", `EXP level: ${result.expLevel} \nTotal battles: ${result.battleCount}\nWins/losses: ${result.wins} | ${result.losses}\n3-crown wins: ${result.threeCrownWins}`)                                                
                            }
                            //If the requested user is not in a league it will not show anything from leagueStatistics 
                            if (result.leagueStatistics == undefined) {
                                embedProfiel.addField("Trophies", `Arena: ${result.arena.name}\nNu: ${result.trophies}<:trophy_working:590862428544303114>\nBest season: ${result.bestSeason.trophies} <:trophy_working:590862428544303114>`)
                            }else {
                                embedProfiel.addField("Trophies", `Arena: ${result.arena.name}\nNow: ${result.trophies}<:trophy_working:590862428544303114>\nBest season (${result.leagueStatistics.bestSeason.id}): ${result.leagueStatistics.bestSeason.trophies}<:trophy_working:590862428544303114>\n Previous season (${result.leagueStatistics.previousSeason.id}): ${result.leagueStatistics.previousSeason.trophies}<:trophy_working:590862428544303114>`)
                            }
                            embedProfiel.addField("<:clan:589769271958175760>Clan" , `Rol: ${result.role.charAt(0).toUpperCase() + result.role.substring(1)}\nDonations: ${result.donations}\nDonations onstvangen: ${result.donationsReceived}\nTotal donations: ${result.totalDonations}\nWarday wins: ${result.warDayWins}`)
                            msg.edit(embedProfiel)
                        }else if(result.reason == 'notFound'){
                            message.channel.send("This user could not be found. Please check the playertag. Playertags can only use the following letters and numbers:\n```0, 2, 8, 9.\nC, G, J, L, P, Q, R, U, V, Y```")
                        }else {
                            console.log(result.reason)
                            message.channel.send("Something went wrong!")
                        }
                })
            }

        break;

    /*\
    |*|     This command is currently disabled. It would have been a countdown to the next season, but I had to manually update it. N
    |*|    case "season":
    |*|        //command season
    |*|        var countDownDate = new Date("Nov 4, 2019 9:00:00").getTime();
    |*|
    |*|
    |*|        // Get today's date and time
    |*|           var now = new Date().getTime();
    |*|            
    |*|        // Find the distance between now and the count down date
    |*|        var distance = countDownDate - now;
    |*|            
    |*|        // Time calculations for days, hours, minutes and seconds
    |*|        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    |*|        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    |*|        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    |*|        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    |*|            
    |*|        // Output the result in an element with id="demo"
    |*|        message.channel.send("Nog " + days + " dagen, " + hours + ":"
    |*|        + minutes + ":" + seconds + " tot het nieuwe season.");
    |*|            
    |*|        // If the count down is over, write some text 
    |*|        if (distance < 0) {
    |*|            clearInterval(x);
    |*|            message.channel.send("Het nieuwe season is begonnen!");
    |*|        }
    |*|    break;
    \*/

        case "clan":
                
            message.channel.send("<:clan:589769271958175760> The data is being processed...").then(msg=> {
            
            if (!args[1]) {
                msg.delete()
            }else {
                switch(args[1].toLowerCase()) {
            
                    //Request the data, put the top 10 in an embed with different colours for each row. This is done by using the title and content field of each addField 
            
                    case "top":
                        var xmlHttp = new XMLHttpRequest();
                        xmlHttp.open( "GET", `https://api.clashroyale.com/v1/clans/%23PURV2URR/members`, false ); // false for synchronous request
                        xmlHttp.setRequestHeader("Content-type", "application/json");
                        xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                        xmlHttp.send(); 
                        var result = JSON.parse(xmlHttp.responseText)
                        var clanEmbed = new Discord.RichEmbed()
                        .setTitle(`<:clan:589769271958175760> Top players from [clan]`)
                        .addField("1. " + result.items[0].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[0].trophies, "2. " + result.items[1].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[1].trophies)
                        .addField("3. " + result.items[2].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[2].trophies, "4. " + result.items[3].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[3].trophies)
                        .addField("5. " + result.items[4].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[4].trophies, "6. " + result.items[5].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[5].trophies)
                        .addField("7. " + result.items[6].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[6].trophies, "8. " + result.items[7].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[7].trophies)
                        .addField("9. " + result.items[8].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[8].trophies, "10. " + result.items[9].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[9].trophies)
                        .setColor("#00FF00")
                        msg.edit(clanEmbed)

                    break;
            

                        
                    case "war":
                        //Check if user wants to see previous wars.
                        if(args[2] == "previous" || args[2] == "p") {

                            //If the third argument has not been specified, it'll be 3. This ensures there will be a war chosen
                            if (!args[3]) {
                                message
                                args[3] = 0
                            }

                            var xmlHttp = new XMLHttpRequest();
                            xmlHttp.open( "GET", `https://api.clashroyale.com/v1/clans/%23PURV2URR/warlog`, false ); // false for synchronous request
                            xmlHttp.setRequestHeader("Content-type", "application/json");
                            xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                            xmlHttp.send(); 
                            var result = JSON.parse(xmlHttp.responseText);
                            var standings = result.items[args[3]].standings;

                            var warlog = new Discord.RichEmbed();

                            var count = 1;
                            standings.forEach(standing => {
                                    //check of dat de eerste character van de tropheen een '-' is of niet
                                    var trophyChange = standing.trophyChange.toString();
                                    if (standing.trophyChange.toString().charAt(0) == "-") {
                                        warlog.addField(`#${count} **${standing.clan.name}**`, standing.trophyChange + " trophies lost")
                                    }else {
                                        warlog.addField(`#${count} **${standing.clan.name}**`, standing.trophyChange + " trophies won")
                                    }
                                    count++
                            });

                            /*\     Format the date
                            |*|
                            |*| The format used is the ISO 8601 standard (yyyymmddThhmmss.000Z)
                            |*| This is split up at the T, resulting 2 parts:
                            |*|     all[0] contains yyyymmdd   
                            |*|     all[1] contains hhmmss.000Z. Because the exact minute that the clan war was started is not very usefull, this will be left alone
                            |*| 
                            |*| all[0] will be spilt up in the correct format after which it will be used in the title of the embed                           
                            \*/

                            var str = result.items[args[3]].createdDate;
                            var all = str.split("T");
    
                            splitDate = all[0].match(/.{1,2}/g);
                                                    
                            var year = splitDate[0]+splitDate[1];
                            var month = splitDate[2];
                            var day = splitDate[3];
                        
                            warlog.setColor("#f0f00f");
                            warlog.setTitle("The results of " + day + "-" + month + "-" + year )
                            msg.edit(warlog)
                        }else {

                            //If the user doesnt want a previous war, this will check what the current state of the war is. Depending on the state, it will display different things
                            var xmlHttp = new XMLHttpRequest();
                            xmlHttp.open( "GET", `https://api.clashroyale.com/v1/clans/%23PURV2URR/currentwar`, false ); // false for synchronous request
                            xmlHttp.setRequestHeader("Content-type", "application/json");
                            xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                            xmlHttp.send(); 
                            var result = JSON.parse(xmlHttp.responseText)
                            msg.edit("<:clan:589769271958175760> Clanwar participants")

                            if(result.state == "collectionDay"){
                                var warEmbed = new Discord.RichEmbed()
                                .setTitle("<:clan:589769271958175760> Clanwar participants")
                                .setColor("#0000FF")
                                var warMessage = "";
                                var part = result.participants;  
                                var count = 0;              
                                part.forEach(participant => {
                                        //Count+1 is for the list. This is to ensure that #1 is actually #1 and not #0, because arrays start at 0
                                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].cardsEarned} cards, ${result.participants[count].collectionDayBattlesPlayed} collection battles\n`)
                                    count++
                    
                                });
                                warEmbed.setDescription(warMessage, inline=true)
                                msg.edit(warEmbed)


                            }else if(result.state == "warDay") {
                                var warEmbed = new Discord.RichEmbed()
                                .setTitle("<:clan:589769271958175760> Clanwar participants")
                                .setColor("#0000FF");
                                var warMessage = "";
                                var part = result.participants;  
                                var count = 0;              
                                part.forEach(participant => {
                                    //If wins == 0, lost. Else person won
                                    if (result.participants[count].battlesPlayed == 0) {
                                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} cards, did not play last battle\n`)
                                    }
                                    else if (result.participants[count].wins == 0) {
                                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} cards, lost last battle\n`)
                                    }else {
                                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} kaarten, won last battle\n`)
                                    }
                                    count++
                                });
                                warEmbed.setDescription(warMessage, inline=true);
                                msg.edit(warEmbed);
                            }else{
                                //Pretty self-explanatory
                                msg.edit("This clan is currently not at war.")
                            }
                        }
                    break; 
                    default:
                        message.edit("This is not a valid command!")
                        msg.delete(2500)
                    }

                }
            })
        break;

        default:
            msg = message.channel.send("This is not a valid command!").then(msg=> {
                msg.delete(2500);
            })
    }


}

})



bot.login(discordToken);
