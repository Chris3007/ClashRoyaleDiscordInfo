const Discord = require("discord.js");
const bot = new Discord.Client();

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const mysql = require('mysql');

const login = require("login"); 

const tokens = require('tokens');
const apiToken = tokens.apiToken;
const discordToken = tokens.discordToken;
const clanTag = tokens.clantoken
const restrictedChannelClan = tokens.restrictedChannelClan


//Create a mysql pool
var pool  = mysql.createPool({
    host: login.host,
    user: login.user,
    password: login.password,
    database: login.database
});



async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
  } 


var SQLresult = 0;
async function update(result) {
    
    pool.getConnection((err, conn) => {
        if (err) throw err;

        conn.query(`UPDATE clanwar SET status='${result.state}' WHERE 1`, (err, SQLIresult) => {
            if (err) throw err;
            
            SQLresult = SQLIresult;
        });
                    
        conn.release();
    });

    return await SQLresult;

}

//global
var data = 0;

bot.on("ready" ,function() {
    console.log("[" + new Date().toLocaleString() + "]");
    console.log(`Bot is active in ${bot.guilds.size} guilds, which have ${bot.users.size} users and ${bot.channels.size} channels.`); 
    console.log("The additional script is ready\n\n");



    let run = async ()=>{
        
        await delay(300000)

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", `https://api.clashroyale.com/v1/clans/%23PURV2URR/currentwar`, false ); // false for synchronous request
        xmlHttp.setRequestHeader("Content-type", "application/json");
        xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
        xmlHttp.send(); 
        await xmlHttp.responseText;
        var result =  JSON.parse(xmlHttp.responseText)


        pool.getConnection((err, conn) => {
            if (err) throw err;

            conn.query(`SELECT status FROM clanwar`, (err,rows) => {
                if(err) throw err;         
                data = rows;   
            });
            
            conn.release();
        });
        

        await delay(5000)


        if(data[0].status == result.state) {
            console.log("[" + new Date().toLocaleString() + "] Checked");
        }else {
            
            
            if(result.state == "warDay" && data[0].status == "collectionDay") {
                

                console.log("[" + new Date().toLocaleString() + "] The warday just started")
                var warEmbed = new Discord.RichEmbed()
                .setTitle("<:clan:589769271958175760> Collection day is voorbij en Battle day gaat nu beginnen!\nDit is iedereen die meedoet:")
                .setColor("#0000FF")
                var warMessage = "";
                var part = result.participants;  
                var count = 0;     
                
                


                part.forEach(participant => {
                        //warMessage = warMessage + (`**${result.participants[count].name}** :\n ${result.participants[count].cardsEarned} kaarten, ${result.participants[count].collectionDayBattlesPlayed} battles, waarvan ${result.participants[count].wins} gewonnen\n`)
                        
                        if(result.participants[count].collectionDayBattlesPlayed < 3) {
                            warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].cardsEarned} kaarten, **${result.participants[count].collectionDayBattlesPlayed} collection battles**\n`)
                        }else {
                            warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].cardsEarned} kaarten, ${result.participants[count].collectionDayBattlesPlayed} collection battles\n`)
                        }
                        
                        count++

                });
                
                warEmbed.setDescription(warMessage, inline=true)
                bot.channels.get(restrictedChannelClan).send(warEmbed);

            }else if(result.state == "collectionDay" && data[0].status == "notInWar"){


                //Clan war just started
                bot.channels.get(restrictedChannelClan).send("Er is weer een nieuwe clanwar begonnen!")
                console.log("[" + new Date().toLocaleString() + "] Clan war just started")

            }else if(result.state == "notInWar" && data[0].status == "collectionDay") {
                //Clan war cancelled
                bot.channels.get(restrictedChannelClan).send("De clan war is geanuleerd")
                console.log("[" + new Date().toLocaleString() + "] Clan war just stopped")
            }else if(result.state == "notInWar" && data[0].status == "warDay"){


                //Get the data from the last war (the one that just ended). This is necessary because the previous result only contains '{status:'notInWar'}'.
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open( "GET", `https://api.clashroyale.com/v1/clans/%23PURV2URR/warlog`, false ); // false for synchronous request
                xmlHttp.setRequestHeader("Content-type", "application/json");
                xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                xmlHttp.send(); 
                var result =  JSON.parse(xmlHttp.responseText)

                var result = result.items[0]

                //This is for when clanwar ended
                console.log("[" + new Date().toLocaleString() + "] De clan war is nu afgelopen")
                var standing = "";
                if(result.standings[0].clan.tag == "#PURV2URR") {
                    standing = "**Deze clanwar zijn we eerste geworden!**";
                }else if(result.standings[1].clan.tag == "#PURV2URR") {
                    standing = "**Deze clanwar zijn we tweede geworden!**";
                }else if(result.standings[2].clan.tag == "#PURV2URR") {
                    standing = "**Deze clanwar zijn we derde geworden**";
                }else if(result.standings[3].clan.tag == "#PURV2URR") {
                    standing = "**Deze clanwar zijn we vierde geworden**";
                }else if(result.standings[4].clan.tag == "#PURV2URR") {
                    standing = "**Deze clanwar zijn we vijfde geworden**";
                }

                var warEmbed = new Discord.RichEmbed()
                .setTitle("<:clan:589769271958175760> De clanwar is voorbij!\n"+standing+"\nDit was iedereen die meedeed:")
                .setColor("#0000FF");
                var warMessage = "";
                
                var part = result.participants;  
                var count = 0;              
                part.forEach(participant => {
                    //als wins = 0, helaas verloren, anders hoera
                    if (result.participants[count].battlesPlayed == 0) {
                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} kaarten, **laatste battle niet gespeeld!**\n`)
                    }
                    else if (result.participants[count].wins == 0) {
                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} kaarten, laatste battle verloren\n`)
                    }else {
                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} kaarten, laatste battle gewonnen\n`)
                    }
                    count++
                });
                warEmbed.setDescription(warMessage, inline=true);
                bot.channels.get(restrictedChannelClan).send(warEmbed)


            }else{
                console.log("[" + new Date().toLocaleString() + "]");
                console.log("Something went wrong. This is result.state: " + result.state + "\nThis is data[0].status: " + data[0].status)
            }
            

        }

        await update(result)

        run()
    }

    run();

})


bot.login(discordToken);
