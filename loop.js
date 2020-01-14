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

//Global vars. There is probaly a better way to do this, so please let me know
var data = 0;
var SQLresult = 0;

//Re-used functions

//This function is like a sleep function
async function delay(ms) {
    return await new Promise(resolve => setTimeout(resolve, ms));
  } 


//This function updates the 'clanwar' table in the MmySQL DataBase
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

//This function will connect the bot with discord and execute all the code inside
bot.on("ready" ,function() {

    console.log("[" + new Date().toLocaleString() + "]");
    console.log(`Bot is active in ${bot.guilds.size} guilds, which have ${bot.users.size} users and ${bot.channels.size} channels.`); 
    console.log("The additional script is ready\n\n");



    let run = async ()=>{
        
        //This causes this function to stop for 300000 milliseconds, which is 5 minutes
        await delay(300000)

        //For some reason it appears that including the clanTag in xmlHttp.open() does noet give the expected result. This way it will return the data you want. 
        var reqUrl = `https://api.clashroyale.com/v1/clans/%23`+clanTag+`/currentwar`;
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", reqUrl, false ); // false for synchronous request
        xmlHttp.setRequestHeader("Content-type", "application/json");
        xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
        xmlHttp.send(); 
        await xmlHttp.responseText;
        var result =  JSON.parse(xmlHttp.responseText)
        console.log(result)

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
                .setTitle("<:clan:589769271958175760> Collection day is over and Battle day is going to begin!\nThis is everyone who participates:")
                .setColor("#0000FF")
                var warMessage = "";
                var part = result.participants;
                var count = 0;


                part.forEach(participant => {
                    if(result.participants[count].collectionDayBattlesPlayed < 3) {
                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].cardsEarned} cards, **${result.participants[count].collectionDayBattlesPlayed} collection battles**\n`)
                    }else {
                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].cardsEarned} cards, ${result.participants[count].collectionDayBattlesPlayed} collection battles\n`)
                    }
                    
                    count++
                });
                
                warEmbed.setDescription(warMessage, inline=true)
                bot.channels.get(restrictedChannelClan).send(warEmbed);

            }else if(result.state == "collectionDay" && data[0].status == "notInWar"){


                //Clan war just started
                bot.channels.get(restrictedChannelClan).send("A new clan war just started!")
                console.log("[" + new Date().toLocaleString() + "] Clan war just started")

            }else if(result.state == "notInWar" && data[0].status == "collectionDay") {
                //Clan war cancelled
                bot.channels.get(restrictedChannelClan).send("The clan war just got cancelled")
                console.log("[" + new Date().toLocaleString() + "] Clan war just cancelled ")
            }else if(result.state == "notInWar" && data[0].status == "warDay"){


                //Get the data from the last war (the one that just ended). This is necessary because the previous result only contains '{status:'notInWar'}'.
                var reqUrl = `https://api.clashroyale.com/v1/clans/%23`+clanTag+`/warlog`;
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open( "GET", reqUrl, false ); // false for synchronous request
                xmlHttp.setRequestHeader("Content-type", "application/json");
                xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
                xmlHttp.send(); 
                await xmlHttp.responseText;
                var result =  JSON.parse(xmlHttp.responseText)
                console.log(result)
                var result = result.items[0]

                //This is for when clanwar ended
                console.log("[" + new Date().toLocaleString() + "] The clan war is finished")
                var standing = "";
                if(result.standings[0].clan.tag == "#PURV2URR") {
                    standing = "**This clanwar we finished first!**";
                }else if(result.standings[1].clan.tag == "#PURV2URR") {
                    standing = "**This clanwar we finished second!**";
                }else if(result.standings[2].clan.tag == "#PURV2URR") {
                    standing = "**This clanwar we finished third**";
                }else if(result.standings[3].clan.tag == "#PURV2URR") {
                    standing = "**This clanwar we finished fourth**";
                }else if(result.standings[4].clan.tag == "#PURV2URR") {
                    standing = "**This clanwar we finished fifth**";
                }

                var warEmbed = new Discord.RichEmbed()
                .setTitle("<:clan:589769271958175760> The clan war is over!\n"+standing+"\nThis was everyone who participated:")
                .setColor("#0000FF");
                var warMessage = "";
                
                var part = result.participants;  
                var count = 0;              
                part.forEach(participant => {
                    //als wins = 0, helaas verloren, anders hoera
                    if (result.participants[count].battlesPlayed == 0) {
                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} cards, **did not play last battle!**\n`)
                    }
                    else if (result.participants[count].wins == 0) {
                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} cards, lost last battle\n`)
                    }else {
                        warMessage = warMessage + (`${count+1}. **${result.participants[count].name}** :\n ${result.participants[count].collectionDayBattlesPlayed} collection battles, ${result.participants[count].cardsEarned} cards, won last battle\n`)
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
