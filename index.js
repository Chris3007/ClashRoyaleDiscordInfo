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
            bot.user.setActivity(`${prefix}help voor commands`, { type: 'PLAYING' });
    
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
        message.channel.send("Je kunt deze commands alleen uitvoeren in <#587903874334195753>.").then(msg=> {
            setTimeout(function(){ 
                msg.delete(); 
            }, 5000);
            
        })
    }else if(message.guild.id == restrictedGuild || message.channel.id == restrictedChannel) {

    switch(args[0].toLowerCase()) {        

        case "help":
            message.channel.send(`prefix: ${prefix}\nRegistreer: gebruik je playertag om je te registreren\n\`${prefix}registreer [playertag]\`\n\n Kisten: bekijk je kist cycle of die van iemand anders\n\`${prefix}kisten [playertag]\`\n\nProfiel: bekijk statistieken van jezelf of iemand anders\n\`${prefix}profiel [playertag]\`\n\n Clan: bekijk info over de clan\n\`\`\`${prefix}clan war\n${prefix}clan top\`\`\`\n**[BETA]**  Clan war vorige: bekijk de resultaten van de vorige clan wars  \n\`${prefix}clan war vorige [nummer (0-5)]\`\n\n**Als je al geregistreerd bent hoef je niet telkens je playertag achter je command te zetten**`) 
        break; 


        case "registreer":
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
                    message.channel.send("Je data wordt opgeslagen...").then((msg)=>{
                        const connection = mysql.createConnection({
                            host: login.host,
                            user: login.user,
                            password: login.password,
                            database: login.database
                        });
                        connection.connect((err) => {
                            if (err) {msg.edit(`Sorry, er ging iets mis!`);}
                        });

                        connection.query(`SELECT * FROM dcMembers where userid = "${messageId}"`, (err,rows) => {
                            if(err) throw err;

                            if(rows.length >= 1) {
                                msg.edit(`Je bent al geregistreed`);
                            }else {
                                connection.query(`INSERT INTO dcMembers(userid, tag, name) VALUES ("${messageId}","${args[1]}", "${result.name}")`, (err, rows) => {
                                    if (err) throw err;
                                    msg.edit("Je bent geregistreerd")
                                })
                            }
                        });
                    })

                }else{
                    message.channel.send("De playertag die je opgaf is niet gevonden")
                }
            }else{
                message.channel.send("Je moet een playertag geven. Deze kan je vinden in je Clash Royale profiel.")
            }
        break;




        case "kisten":
            //command kist
            if (!args[1]) {
                message.channel.send("Je data wordt opgehaald...").then((msg)=>{
                    const connection = mysql.createConnection({
                        host: login.host,
                        user: login.user,
                        password: login.password,
                        database: login.database
                        });
                    connection.connect((err) => {
                        if (err) {msg.edit(`Sorry, er ging iets mis!`);}
                    });

                    connection.query(`SELECT tag FROM dcMembers where userid = "${messageId}"`, (err,rows) => {
                        if(err) throw err;

                        if(rows.length == 0) {
                            msg.edit(`Je bent nog niet geregistreerd! Dit kan je doen met het command "${prefix}registreer`);
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
                                    .setTitle("Kisten Cycle")
                                    items.forEach(chest => {
                                        if (chest.index == 0) {
                                            chestMessage = chestMessage + "Nog " + parseInt(chest.index + 1) + " win voor een " + chest.name + ".\n"
                                            
                                        }else {
                                            chestMessage = chestMessage + "Nog " + parseInt(chest.index + 1) + " wins voor een " + chest.name + ".\n"   
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
                        .setTitle("Kisten Cycle")
                        items.forEach(chest => {
                            if (chest.index == 0) {
                                chestMessage = chestMessage + "Nog " + parseInt(chest.index + 1) + " win voor een " + chest.name + ".\n"
                                
                            }else {
                                chestMessage = chestMessage + "Nog " + parseInt(chest.index + 1) + " wins voor een " + chest.name + ".\n"   
                            }
                        });
                        embed.setDescription(chestMessage)
                        msg.edit(embed)
                    }
                })
            }
        
        break;

        
        case "profiel":
            //command profiel
                if (!args[1]) {
                    message.channel.send("Je data wordt opgehaald...").then((msg)=>{
                    const connection = mysql.createConnection({
                            host: login.host,
                            user: login.user,
                            password: login.password,
                            database: login.database
                            });
                        connection.connect((err) => {
                            if (err) {msg.edit(`Sorry, er ging iets mis!`);}
                        });
            
                        connection.query(`SELECT tag FROM dcMembers where userid = "${messageId}"`, (err,rows) => {
                            if(err) throw err;
            
                            if(rows.length == 0) {
                                msg.edit(`Je bent nog niet geregistreerd! Dit kan je doen met het command "${prefix}registreer`);
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
                                            .setTitle("Profiel van " + result.name)
                                            
                                            //Start datum
                                            if(result.badges[1].progress) {
                                                var startDate = new Date();
                                                var options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
                                                startDate.setDate(startDate.getDate() - result.badges[1].progress)
                                                
                                                startDate = startDate.toLocaleDateString('nl-NL', options);

                                                embedProfiel.addField("Algemeen", `EXP level: ${result.expLevel}\nSpeelt sinds: ${startDate}\nTotaal aantal gevechten: ${result.battleCount}\nWins/losses: ${result.wins} | ${result.losses}\n3-kroon wins: ${result.threeCrownWins}`)
                                            }else{
                                                embedProfiel.addField("Algemeen", `EXP level: ${result.expLevel} \nTotaal aantal gevechten: ${result.battleCount}\nWins/losses: ${result.wins} | ${result.losses}\n3-kroon wins: ${result.threeCrownWins}`)                                                
                                            }

                                            if (result.leagueStatistics.bestSeason == undefined) {
                                                embedProfiel.addField("Trophies", `Arena: ${result.arena.name}\nNu: ${result.trophies}<:trophy_working:590862428544303114>\nBeste seizoen: ${result.bestTrophies} <:trophy_working:590862428544303114>`)
                                            }else {
                                                embedProfiel.addField("Trophies", `Arena: ${result.arena.name}\nNu: ${result.trophies}<:trophy_working:590862428544303114>\nBeste seizoen (${result.leagueStatistics.bestSeason.id}): ${result.leagueStatistics.bestSeason.trophies}<:trophy_working:590862428544303114>\n Vorige seizoen (${result.leagueStatistics.previousSeason.id}): ${result.leagueStatistics.previousSeason.trophies}<:trophy_working:590862428544303114>`)
                                            }
                                            embedProfiel.addField("<:clan:589769271958175760>Clan" , `Rol: ${result.role.charAt(0).toUpperCase() + result.role.substring(1)}\nDonaties: ${result.donations}\nDonaties onstvangen: ${result.donationsReceived}\nTotale donaties: ${result.totalDonations}\nWarday wins: ${result.warDayWins}`)
                                            msg.edit(embedProfiel)

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
                        xmlHttp.open( "GET", `https://api.clashroyale.com/v1/players/%23${args[1]}/`, false ); // false for synchronous request
                        xmlHttp.setRequestHeader("Content-type", "application/json");
                        xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                        xmlHttp.send();
                        var result = JSON.parse(xmlHttp.responseText)
                            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                                var embedProfiel = new Discord.RichEmbed()
                                .setColor("#FF0000")
                                .setTitle("Profiel van " + result.name)

                                //Start datum
                                if(result.badges[1].progress) {
                                    var startDate = new Date();
                                    var options = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' };
                                    startDate.setDate(startDate.getDate() - result.badges[1].progress)
                                            
                                        startDate = startDate.toLocaleDateString('nl-NL', options);
                                    embedProfiel.addField("Algemeen", `EXP level: ${result.expLevel}\nSpeelt sinds: ${startDate}\nTotaal aantal gevechten: ${result.battleCount}\nWins/losses: ${result.wins} | ${result.losses}\n3-kroon wins: ${result.threeCrownWins}`)
                                }else{
                                    embedProfiel.addField("Algemeen", `EXP level: ${result.expLevel} \nTotaal aantal gevechten: ${result.battleCount}\nWins/losses: ${result.wins} | ${result.losses}\n3-kroon wins: ${result.threeCrownWins}`)                                                
                                }
                                if (result.leagueStatistics == undefined) {
                                    embedProfiel.addField("Trophies", `Arena: ${result.arena.name}\nNu: ${result.trophies}<:trophy_working:590862428544303114>\nBeste seizoen: ${result.bestSeason.trophies} <:trophy_working:590862428544303114>`)
                                }else {
                                    embedProfiel.addField("Trophies", `Arena: ${result.arena.name}\nNu: ${result.trophies}<:trophy_working:590862428544303114>\nBeste seizoen (${result.leagueStatistics.bestSeason.id}): ${result.leagueStatistics.bestSeason.trophies}<:trophy_working:590862428544303114>\n Vorige seizoen (${result.leagueStatistics.previousSeason.id}): ${result.leagueStatistics.previousSeason.trophies}<:trophy_working:590862428544303114>`)
                                }
                                embedProfiel.addField("<:clan:589769271958175760>Clan" , `Rol: ${result.role.charAt(0).toUpperCase() + result.role.substring(1)}\nDonaties: ${result.donations}\nDonaties onstvangen: ${result.donationsReceived}\nTotale donaties: ${result.totalDonations}\nWarday wins: ${result.warDayWins}`)
                                msg.edit(embedProfiel)
                            }else {
                                message.channel.send("Er ging iets mis")
                            }
                    })
                }

        break;


        case "seizoen":
            //command seizoen
            var countDownDate = new Date("Nov 4, 2019 9:00:00").getTime();


            // Get today's date and time
            var now = new Date().getTime();
                
            // Find the distance between now and the count down date
            var distance = countDownDate - now;
                
            // Time calculations for days, hours, minutes and seconds
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
            // Output the result in an element with id="demo"
            message.channel.send("Nog " + days + " dagen, " + hours + ":"
            + minutes + ":" + seconds + " tot het nieuwe seizoen.");
                
            // If the count down is over, write some text 
            if (distance < 0) {
                clearInterval(x);
                message.channel.send("Het nieuwe seizoen is begonnen!");
            }
        break;


        case "clan":
            //command clan
        message.channel.send("<:clan:589769271958175760> De data wordt opgehaald...").then(msg=> {
        if (!args[1]) {
            msg.delete()
        }else {
            switch(args[1].toLowerCase()) {
        

                        //Request de data, zet de top 10 in een ebmed (2 per field voor verschillende kleuren)
                case "top":
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.open( "GET", `https://api.clashroyale.com/v1/clans/%23PURV2URR/members`, false ); // false for synchronous request
                    xmlHttp.setRequestHeader("Content-type", "application/json");
                    xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                    xmlHttp.send(); 
                    var result = JSON.parse(xmlHttp.responseText)
                    var clanEmbed = new Discord.RichEmbed()
                    .setTitle(`<:clan:589769271958175760> Top spelers van PredictedLog`)
                    .addField("1. " + result.items[0].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[0].trophies, "2. " + result.items[1].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[1].trophies)
                    .addField("3. " + result.items[2].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[2].trophies, "4. " + result.items[3].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[3].trophies)
                    .addField("5. " + result.items[4].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[4].trophies, "6. " + result.items[5].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[5].trophies)
                    .addField("7. " + result.items[6].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[6].trophies, "8. " + result.items[7].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[7].trophies)
                    .addField("9. " + result.items[8].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[8].trophies, "10. " + result.items[9].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.items[9].trophies)
                    .setColor("#00FF00")
                    msg.edit(clanEmbed)
                break;
        

                       
                case "war":
                    //Check of dat de user vorige wars wilt zien of niet.
                    if(args[2] == "vorige" || args[2] == "v") {

                        //Als er geen 3e argument is, dan is die 0. Dit zorgt ervoor dat er alsnog een war gekozen wordt
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
                                    warlog.addField(`#${count} **${standing.clan.name}**`, standing.trophyChange + " trofeeën verloren")
                                }else {
                                    warlog.addField(`#${count} **${standing.clan.name}**`, standing.trophyChange + " trofeeën gewonnen")
                                }
                                count++
                        });

                        //Formateer de datum

                        //Het format van de datum die binnenkomt is yyyymmddThhmmss.000Z (ISO 8601)
                        //Dit wordt opgesplitst bij de T, zodat yyyymmdd en hhmmss overblijven. Daarna wordt dat ook opgesplitst

                        var str = result.items[args[3]].createdDate;
                        var all = str.split("T");
  
                        splitDate = all[0].match(/.{1,2}/g);
                                                
                        var year = splitDate[0]+splitDate[1];
                        var month = splitDate[2];
                        var day = splitDate[3];
                    
                        warlog.setColor("#f0f00f");
                        warlog.setTitle("De resultaten van " + day + "-" + month + "-" + year )
                        msg.edit(warlog)
                    }else {
                        //Request de data, kijk naar de status en voer per status iets uit
                        var xmlHttp = new XMLHttpRequest();
                        xmlHttp.open( "GET", `https://api.clashroyale.com/v1/clans/%23PURV2URR/currentwar`, false ); // false for synchronous request
                        xmlHttp.setRequestHeader("Content-type", "application/json");
                        xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                        xmlHttp.send(); 
                        var result = JSON.parse(xmlHttp.responseText)
                        msg.edit("<:clan:589769271958175760> Clanwar deelnemers")

                        if(result.state == "collectionDay"){
                            //Als het colletion day is, maakt dit een embed met voor iedere participant 1 field. 
                            var warEmbed = new Discord.RichEmbed()
                            .setTitle("<:clan:589769271958175760> Clanwar deelnemers")
                            .setColor("#0000FF")
                            var warMessage = "";
                            var part = result.participants;  
                            var count = 0;              
                            part.forEach(participant => {
                                    //Count+1 is voor de ranglijst. Dit zorgt ervoor dat nr 1 ook echt nr 1 is en niet 0
                                    warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].cardsEarned} kaarten, ${result.participants[count].collectionDayBattlesPlayed} collection battles\n`)
                                count++
                
                            });
                            warEmbed.setDescription(warMessage, inline=true)
                            msg.edit(warEmbed)


                        }else if(result.state == "warDay") {
                            //maak embed met data
                            var warEmbed = new Discord.RichEmbed()
                            .setTitle("<:clan:589769271958175760> Clanwar deelnemers")
                            .setColor("#0000FF");
                            var warMessage = "";
                            var part = result.participants;  
                            var count = 0;              
                            part.forEach(participant => {
                                //als wins = 0, hellaas verloren, anders hoera
                                if (result.participants[count].battlesPlayed == 0) {
                                    warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} kaarten, laatste battle niet gespeeld\n`)
                                }
                                else if (result.participants[count].wins == 0) {
                                    warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} kaarten, laatste battle verloren\n`)
                                }else {
                                    warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} kaarten, laatste battle gewonnen\n`)
                                }
                                count++
                            });
                            warEmbed.setDescription(warMessage, inline=true);
                            msg.edit(warEmbed);
                        }else{
                            //Spreek voor zich hé :p
                            msg.edit("De clan is nu niet in een oorlog.")
                        }
                    }
                break;
        
                
                case "arrow":
                    //predictedArrow stuff
                    switch(args[2].toLowerCase()) {
                        case "top":
                                var xmlHttp = new XMLHttpRequest();
                                xmlHttp.open( "GET", `https://api.clashroyale.com/v1/clans/%23PYYCVYJ0`, false ); // false for synchronous request
                                xmlHttp.setRequestHeader("Content-type", "application/json");
                                xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                                xmlHttp.send(); 
                                var result = JSON.parse(xmlHttp.responseText)
                    
                                var embed = new Discord.RichEmbed()
                                .setTitle("<:clan:589769271958175760> Top spelers van PredictedArrows")
                                .addField("1. " + result.memberList[0].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.memberList[0].trophies, "2. " + result.memberList[1].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.memberList[1].trophies)
                                .addField("3. " + result.memberList[2].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.memberList[2].trophies, "4. " + result.memberList[3].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.memberList[3].trophies)
                                .addField("5. " + result.memberList[4].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.memberList[4].trophies, "6. " + result.memberList[3].name +" <:trophy_working:590862428544303114> -")
                                .addField("7. " + result.memberList[6].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.memberList[6].trophies, "8. " + result.memberList[7].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.memberList[7].trophies)
                                //.addField("9. " + result.memberList[8].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.memberList[8].trophies, "10. " + result.memberList[9].name + "\xa0\xa0\xa0\xa0\xa0\xa0<:trophy_working:590862428544303114> " + result.memberList[9].trophies)
                                .setColor("#00FF00")
                    
                                msg.edit(embed)
                        break;
                        default:
                    }
        
        
                break; 
                default:
                    message.edit("Dit is geen geldig commando!")
                    msg.delete(2500)
                }
            }
        })
        break;

        default:
            message.channel.send("Dit is geen geldig commando!")
    }


}

})



bot.login(discordToken);
