const CONFIG = require("../modules/config");

const handleDataCheck = require("../checks/handleData").check;

const COMMANDS = require("../modules/commandData").getCommands();

module.exports = {
    handler: (handleData, prefixUsed) => {
        console.log("[HANDLER:COMMAND] INFO Called.");

        if (handleDataCheck(handleData)) {
            console.log("[HANDLER:COMMAND] ERR handleData check failed. Returning false.");
            return false;
        }

        let msg = handleData.msg; // Get msg from handle data
        console.log("[HANDLER:COMMAND] DEBUG Prefix used: " + prefixUsed);
        let requestedCommandString = msg.content.split(prefixUsed)[1].split(" ")[0].toLowerCase(); // t!dEv:PiNg => dev:ping

        /* 
            Splits command category and command itself to an array as follows:
            dev:ping => ["dev", "ping"] ([category, command]);
            hello => ["hello"] ([command])
        */
        let requestedCommandArray = requestedCommandString.split(":");

        let requestedCommandCategoryName = false; // string (if command category exists) / bool (false if the category wasn't specified)
        let requestedCommandName; // string (command name itself)

        // If the command array has a category and a command name (length:>=2) NOTE: We don't really care about elements other than the first 2.
        if (requestedCommandArray.length > 1) {
            requestedCommandCategoryName = requestedCommandArray[0]; // The first element in the array is the category name
            requestedCommandName = requestedCommandArray[1]; // and the second one is the command
        } else if (requestedCommandArray.length == 1) { // If the array has 1 element (command only)
            requestedCommandName = requestedCommandArray[0]; // Just use the 1st (and only) element in the array
        } else { // No elements in the array ("t!"" will get an element in the array [""])
            // Houston we have a problem.
            console.log("[HANDLE:COMMAND] ERR No element in command array. Aborting.".error);
            return false;
        }

        let requestedCommandCategory = COMMANDS.filter(commandCategory => { // Now we get the command category from the category name (or the false category if none was defined)
            return commandCategory.categoryName == requestedCommandCategoryName;
        })[0];

        if (!requestedCommandCategory) {
            console.log(`[HANDLE:COMMAND] WARN Command category [${requestedCommandCategoryName}] does not exist.`.warn);

            let invalidCommandCategory = COMMANDS.filter(commandCategory => {
                return commandCategory.categoryName == "invalid";
            })[0];
            let invalidCommandCategoryCommand = invalidCommandCategory.commands.filter(command => {
                return command.keywords.indexOf("category") > -1;
            })[0];

            invalidCommandCategoryCommand.handler(handleData);

            return;
        }

        let requestedCommand = requestedCommandCategory.commands.filter(command => { // Get command itself from the category by the command name entered.
            return command.keywords.indexOf(requestedCommandName) > -1;
        })[0];

        if (!requestedCommand) { // If no command was found
            console.log(`[HANDLE:COMMAND] WARN Command [${requestedCommandName}] does not exist.`.warn);

            let invalidCommandCategory = COMMANDS.filter(commandCategory => {
                return commandCategory.categoryName == "invalid";
            })[0];
            let invalidCommandCommand = invalidCommandCategory.commands.filter(command => {
                return command.keywords.indexOf("command") > -1;
            })[0];

            invalidCommandCommand.handler(handleData);

            return false;
        }

        if (requestedCommand.rights) { // If the command has any rights
            if (requestedCommand.rights.adminOnly) {
                if (!msg.member.hasPermission('MANAGE_GUILD') || !msg.member.hasPermission('ADMINISTRATOR')) {
                    msg.channel.send({
                        "embed": {
                            "title": "Nope",
                            "color": CONFIG.EMBED.COLORS.FAIL,
                            "description": `
                            You don't have the MANAGE_GUILD permission. Oops.
                        `,
                            "footer": CONFIG.EMBED.FOOTER(handleData)
                        }
                    }).then((botMsg) => {
                        botMsg.delete(15000);
                    });

                    return false;
                }
            }
            if (requestedCommand.rights.devOnly) {
                if (msg.author.id != 342227744513327107) {
                    // Basically fake invalid command so no one sees anything

                    let invalidCommandCategory = COMMANDS.filter(commandCategory => {
                        return commandCategory.categoryName == "invalid";
                    })[0];
                    let invalidCommandCommand = invalidCommandCategory.commands.filter(command => {
                        return command.keywords.indexOf("command") > -1;
                    })[0];

                    invalidCommandCommand.handler(handleData);

                    return false;
                }
            }
        }

        console.log(`[HANDLE:COMMAND] INFO Command [${requestedCommandName}]`.info);
        requestedCommand.handler(handleData);
        return true;
    }
};