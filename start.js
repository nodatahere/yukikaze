/*
 * YUKIKAZE KAI
 * a beaver for various things
 * Author: Eternith
 */

var Eris = require('eris');

// modules
var schedule = require("node-schedule");
var moment = require("moment");
var jsonfile = require("jsonfile");

var http = require("http");
var env = process.env;

// Load database
var filePath = "./db.json";
if (process.env.OPENSHIFT_DATA_DIR != undefined)
    filePath = process.env.OPENSHIFT_DATA_DIR + "db.json";

var db = jsonfile.readFileSync(filePath);
console.log(getTimestamp() + " Loaded db from " + filePath);

var beaver = new Eris(db.token);

// custom modules
var kancolle = require("./kancolle.js")(beaver, db);
var msgCounting = require("./msgCounting.js")(beaver, db);
var fun = require("./fun.js")(beaver, db);
var internal = require("./internal.js")(beaver, db, filePath);



beaver.on("ready", () => { // When the bot is ready
    console.log(getTimestamp() + " On duty!");
    fun.play("with logs~", false); // set default play message
});
beaver.on("error", (err) => {
   console.log(getTimestamp() + " Error: " + err + err.message);
});
beaver.on("connect", () => {
    console.log(getTimestamp() + " Connected.");
});
beaver.on("disconnect", () => {
    console.log(getTimestamp() + " Disconnected.");
});

// on new member join
beaver.on("guildMemberAdd", (guild, member) => {
    fun.memberJoinLeave(guild, member, "j");
});
beaver.on("guildMemberRemove", (guild, member) => {
    fun.memberJoinLeave(guild, member, "l");
});


beaver.connect();


beaver.on("messageCreate", (msg) => {

    // ignore PMs for now
    if (msg.channel.guild === undefined) return;

    // Message Count if r/anime server or r/LL server
    if ((msg.channel.guild.id === db.etc.rAnimeServerID) ||
        (msg.channel.guild.id === db.etc.rLLServerID))
        msgCounting.count(msg);

    if (msg.channel.guild.id === "284969274240532481")
        db.count++;

    // ignore ~~slash~~
    if (msg.content.startsWith("~~")) return;



    // ~ Commands
    if (msg.content.startsWith('~')) {
        var legitCommand = false;

        /*****************
         ETER ONLY COMMANDS
         ******************/
        if (msg.author.id === db.etc.eterID) {
            
        // msgCounting commands
            if (msg.content === "~resetcounts") {
                msgCounting.resetCounts(msg);
                legitCommand = true;
            }
            else if (msg.content.startsWith("~optin")) {
                msgCounting.newOptin(msg);
                legitCommand = true;
            }
            else if (msg.content.startsWith("~deleteoptin")) {
                msgCounting.deleteOptin(msg);
                legitCommand = true;
            }
            else if (msg.content.startsWith("~back")) {
                msgCounting.backCount(msg);
                legitCommand = true;
            }
            else if (msg.content.startsWith("~lighttheme")) {
                fun.lightCount(msg);
                legitCommand = true;
            }
                
        // internal commands
            else if (msg.content === "~savedb") {
                internal.saveDB(msg);
                legitCommand = true;
            }
            else if (msg.content === "~loaddb") {
                internal.loadDB();
                legitCommand = true;
            }
            else if (msg.content === "~test") {
                internal.playground(msg);
                legitCommand = true;
            }
                
                
        // fun commands
            else if (msg.content.startsWith("~say")) {
                fun.say(msg);
                legitCommand = true;
            }
            else if (msg.content.startsWith("~play")) {
                fun.play(msg, true);
                legitCommand = true;
            }

        // kancolle comamnds
            /*else if (msg.content === "~pvptest") {
                kancolle.pvpAlert('A');
                kancolle.pvpAlert('B');
                legitCommand = true;
            }*/

                // broken
            /*else if (msg.content.startsWith("~pm")) {
                var user = msg.content.split(' ')[1];
                var m = msg.content.split(' ')[2];
                var dmChan = beaver.getDMChannel(user);
                beaver.createMessage(dmChan, m);
            }*/
        }

        /*********************
         ADMIN/FOUNDER COMMANDS
         *********************/
        // COMMAND: Count update
        if (msg.author.id === db.etc.eterID || isAdminFounder(msg.member.roles)) {
            if (msg.content === "~counts" || msg.content === "~count") {
                msgCounting.requestCounts(msg.channel.guild.id, msg.channel.id);
                legitCommand = true;
            }
            /*else if (msg.content === "~order") {
                internal.order(msg);
                legitCommand = true;
            }*/
        }



        /*****************
         PUBLIC COMMANDS
         *****************/
        if (msg.content.startsWith("~kc ")) {
            kancolle.kcWikia(msg);
            legitCommand = true;
        }
        else if (msg.content === "~beaver" || msg.content === "~ping") {
            fun.beaverCheck(msg);
            legitCommand = true;
        }
        else if (msg.content === "~poi") {
            fun.poi(msg);
            legitCommand = true;
        }
        else if (msg.content.startsWith("~registerpvp")) {
            kancolle.registerPvp(msg);
            legitCommand = true;
        }

        // log command usage after
        if (legitCommand) {
            var command = msg.channel.name + " -> " + msg.author.username + " used " + msg.content;
            console.log(getTimestamp() + " " + command);
        }
    }

});




/*
***************************
* HELPER FUNCTIONS
* **************************
 */

// get the current timestamp for logging
function getTimestamp() {
    return "[" + moment().format() + "]";
}


// helper function to check if a member is an admin or founder
function isAdminFounder(roles) {
    if (roles.indexOf(db.etc.adminRoleID) != -1 ||
        roles.indexOf(db.etc.founderRoleID) != -1 ||
        roles.indexOf(db.etc.rLLModRoleID) != -1 ||
        roles.indexOf(db.etc.discordModRoleID) != -1)
        return true;
    else
        return false;
}


// prevent idle

var server = http.createServer(function (req, res) {
    //console.log("http server respond sent")
    res.writeHead(200);
    res.end();
});

server.listen(env.NODE_PORT || 3000, env.NODE_IP || 'localhost', function () {
    console.log(`Request get`);
})