/*
    Hello, L.A. BEAST HERE
    Now, all I'm going to do, is to try to code this bridge and service with so much sleep deprivation that i can literally drop to sleep any minute now.

    Have a good day :)
*/

const fbMessenger = require("facebook-chat-api");
const fetch = require('node-fetch');
const htmlParser = require('node-html-parser');

const dbBridge = require("../../db/bridge");
const discordClient = require("../../discord/client").getDiscordClient();

module.exports.init = function () {
    fbMessenger({ email: process.env.T_FB_USER, password: process.env.T_FB_PASS, forceLogin: true }, (err, api) => {
        if (err) return console.log(err);

        api.listen((err, msg) => {
            console.log("[SERVICE: MESSENGER] Message event", msg);
            module.exports.messageEventHandler(msg);
        });
    });
};

module.exports.messageEventHandler = function (msg) {
    module.exports.bridgingHandler(msg);
};

module.exports.bridgingHandler = async function (msg) {
    if (msg.isGroup) {
        let bridgeDoc;
        try { bridgeDoc = await dbBridge.bridges.getDocFromSource("messenger", msg.threadID); }
        catch (e) { console.error("Could not get bridgeDoc: " + e); }

        if (bridgeDoc) {
            let username;
            try {
                const res = await fetch("https://www.facebook.com/profile.php?id=" + msg.senderID);
                const pageContent = await res.text();

                let document = htmlParser.parse(pageContent, "text/html");
                username = document.querySelector("#pageTitle").innerHTML.split(" | ")[0];
            } catch (e) {
                console.error("Failed to fetch userpage for fb profile: " + e);
            }

            console.log(username);

            if (bridgeDoc.target.service == "discord") { // TODO: Integrate this with services when they're done.
                let channel;
                try {
                    channel = await discordClient.channels.get(bridgeDoc.target.target_id);
                } catch (e) {
                    console.error("Could not send bridge message: " + e);
                }

                let files = [];
                if (msg.attachments.length > 0) {
                    for (const attachment of msg.attachments) {
                        files.push(attachment.url);
                    }
                }

                try {
                    const msgDate = new Date(parseInt(msg.timestamp));
                    await channel.send({
                        body: `${msgDate.getHours()}:${msgDate.getMinutes()}:${msgDate.getSeconds()} **${username}**: ${msg.body}`,
                        files
                    });
                } catch (e) {
                console.log("Failed to send msg to target: " + e);
            }
        }
    }
}
};