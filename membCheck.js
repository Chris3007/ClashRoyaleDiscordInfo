const Discord = require("discord.js");
const bot = new Discord.Client();

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const mysql = require('mysql');

const login = require("login"); 

const tokens = require('tokens');
const apiToken =tokens.apiToken;
const discordToken = tokens.discordToken;
const clanTag = tokens.clantoken;

async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
  }



//maak een mysql pool aan
var pool  = mysql.createPool({
    host: login.host,
    user: login.user,
    password: login.password,
    database: login.database
});

async function memberToDB(member) {
    await delay(1500)
    pool.getConnection((err, conn) => {
        if (err) console.log(`Sorry, er ging iets mis!`);

        conn.query(`INSERT INTO members (tag, username, role, trophies, level, joined, lastUpdate) VALUES ('${member.tag}', 'username', 'role', 'troph', 'xp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, (err,rows) => {
            if(err) throw err;         
            data = rows;   
        });
        
        conn.release();
    });
    console.log("geloged")
    return
}

async function update() {
    console.log("updated")
}


//Globals
var data = 0;


bot.on("ready" ,function() {
    console.log("[" + new Date().toLocaleString() + "]");
    console.log(`Bot is active in ${bot.guilds.size} guilds, which have ${bot.users.size} users and ${bot.channels.size} channels.`); 
    console.log("The additional script is ready\n\n");


    let run  = async ()=>{
        await delay(10000) //5 minuten = 300000
        

        
        var xmlHttp = new XMLHttpRequest(); //192.168.11.95/api/clashroyale/api.json
        xmlHttp.open( "GET", `https://api.clashroyale.com/v1/clans/%23${clanTag}/members`, false ); // false for synchronous request
        xmlHttp.setRequestHeader("Content-type", "application/json");
        xmlHttp.setRequestHeader("authorization", "Bearer "+apiToken);
        xmlHttp.send(); 
        var result =  JSON.parse(xmlHttp.responseText);
        var resultItems = result.items 

    

        pool.getConnection((err, conn) => {
            if (err) console.log(`Sorry, er ging iets mis!`);

            conn.query(`SELECT * FROM members`, (err,rows) => {
                if(err) throw err;         
                data = rows;   
            });
            
            conn.release();
        });

        await delay(5000) //Wacht op resultaat
        console.log("rest")


        var joined = false
        var loop = 0;


        resultItems.forEach(async result1 => {

            data.forEach(async member =>  {
                resultTag = result.items[loop].tag
                
                tag = member.tag/*
                console.log(loop)
                loop++
                console.log(loop)
                console.log(tag)
                console.log(resultTag)
                console.log("--------")*/

                if(tag == resultTag) {
                    joined = true
                    console.log("aaaaa")
                    return;
                }
                
                
                
                if (loop === resultItems.length && tag !== resultTag) {
                  await memberToDB(result.items[loop])
                }else if (loop === resultItems.length-1) { 
                    await update()
                }else {
                    console.log("asjfajfoid")
                }
    
                //var checked = (resultTag.indexOf() > -1)
                
                //console.log(checked)
    
                
            });

            
            console.log(loop)
            loop = 0;

        });



       
        data.forEach(async member =>  {

            resultItems.forEach(async result1 => {
                if(loop == result.items.length) {
                    console.log("aaaaaaaaaaaaaksopdksopdksdpo")
                }
                resultTag = result.items[loop].tag
                
                tag = member.tag
                console.log(loop)
                loop++
                console.log(loop)
                console.log(tag)
                console.log(resultTag)
                console.log("--------")

                if(tag == resultTag) {
                    joined = true
                    console.log("aaaaa")
                    return;
                }

                console.log(result.items[loop])
                
                
                
                if (loop === resultItems.length && tag !== resultTag) {
                  await memberToDB(result.items[loop])
                }else if (loop === resultItems.length-1) { 
                    await update()
                }else {
                    console.log("asjfajfoid")
                }
    
                //var checked = (resultTag.indexOf() > -1)
                
                //console.log(checked)
    
                
            });

            
            console.log(loop)
            loop = 0;

        });




        run()
    };

    run()

});

bot.login(discordToken);