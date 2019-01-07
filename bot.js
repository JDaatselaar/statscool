// node require
const Discord = require('discord.js');
const FortniteClient = require('fortnite-client').FortniteClient;
const FortniteBR = require('fnbrco.js');

// configurations and credentials
const config = require('./config.json');
const credentials = {
    email: config.fortnite.email,
    password: config.fortnite.pwd
};

// clients and logins
const client = new Discord.Client();
const api = new FortniteClient(credentials);
const fnbr = new FortniteBR(config.fortnite.fnbr)

// embed variables
var colors = ["#9d4dbb", "#cc0000", "#00aa00"]
var icons = ["https://pbs.twimg.com/profile_images/1017458813199372289/QtGv1tyn_400x400.jpg", "https://img.icons8.com/color/100/000000/close-window.png"]

client.on('ready', async () => {
    try {
        await api.login();
        console.log("Fortnite-Client Logged in")
    } catch (err) {
        console.error(`Logging into Fortnite Client failed, due to ${err}`)
    }
    console.log(`Logged in as ${client.user.tag}!`);
    let embed = new Discord.RichEmbed()
        .setTitle("Update")
        .setDescription(`Restarted ${client.user.username}`)
        .setColor(colors[2]);
    let sChannel = client.channels.find(x => x.id === "526434633957769216")
    sChannel.send(embed).then(msg => msg.delete(899000));
});

client.on('message', async message => {
    let ftnP = config.discord.prefix;
    let messageArray = message.content.split(" ");
    let cmd = messageArray[0].toLowerCase();
    let args = messageArray.slice(1);

    if (!message.content.startsWith(ftnP)) {
        return
    }
    setTimeout(function () {
        message.delete().catch()
    }, 5000);

    if (cmd === `${ftnP}pc` || cmd === `${ftnP}xb1` || cmd === `${ftnP}ps4`) {
        let platform = cmd.split(ftnP)[1]
        let channelId = message.channel.id
        let timeAll = args[1]
        let timewindow;
        if (timeAll) {
            timewindow = timeAll.toLowerCase()
        }
        let gamemode = args[2];
        let gamemodeName = gamemode
        let timewindowName = timewindow
        if (!timewindow) {
            timewindow = "alltime"
            timewindowName = "alltime"
        } else if (timewindow === 'week' || timewindow === '7' || timewindow === 'weekly') {
            timewindow = "weekly"
            timewindowName = "the past 7 days"
        } else if (timewindow === 'alltime' || timewindow === 'alltime') {
            timewindow = 'alltime'
            timewindowName = 'alltime'
        } else {
            gamemode = args[1];
            timewindow = "alltime"
            timewindowName = "alltime"
        }

        if (!gamemode) {
            gamemode = 'allGroupTypes'
            gamemodeName = "all"
        } else if (!(gamemode.toLowerCase() === 'solo' || gamemode.toLowerCase() === 'duo' || gamemode.toLowerCase() === 'squad')) {
            return error(`${gamemode} is not a __valid__ gamemode`, channelId)
        }
        let embed = new Discord.RichEmbed()
            .setAuthor("Fortnite", icons[0])
            .setDescription(`Checking stats with **Username** ${args[0]}, **Platform** ${platform}, **Gamemode** ${gamemodeName} and **timewindow** ${timewindowName}`)
            .setColor(colors[2]);
        message.channel.send(embed).then(msg => msg.delete(20000))
        await getFtnStats(args[0], platform, gamemode, timewindow, channelId);
        setTimeout(function () {
            message.delete().catch()
        }, 5000);

    }

    if (cmd === `${ftnP}item`) {
        let item = args.join(" ");
        let channelId = message.channel.id;
        let embed = new Discord.RichEmbed()
            .setAuthor("Fortnite", icons[0])
            .setDescription(`Searching items with **Query** ${item}`)
            .setColor(colors[2]);
        message.channel.send(embed).then(msg => msg.delete(20000))
        await lookupItems(item, channelId)
        setTimeout(function () {
            message.delete().catch()
        }, 5000);
    }

    if (cmd === `${ftnP}shop`) {
        channelId = message.channel.id
        let embed = new Discord.RichEmbed()
            .setAuthor("Fortnite", icons[0])
            .setDescription(`Gathering today's shop`)
            .setColor(colors[2]);
        message.channel.send(embed).then(msg => msg.delete(20000))
        await shopItems(channelId)
        
    }

    if (cmd === `${ftnP}status`) {
        try {
            let status = await FortniteClient.CHECK_STATUS();
            console.log(status[0].message);
            let embed = new Discord.RichEmbed()
                .setAuthor("Fortnite Status", icons[0])
                .setDescription(status[0].message.replace(".", ""))
                .setColor(colors[0])
            message.channel.send(embed)
        } catch (err) {
            console.error(err)
            error(err, message.channel.id)
        }
    }

    if (cmd === `${ftnP}news`) {
        let typeArg = args.join(" ")
        let type;
        if (!typeArg || typeArg.toLowerCase() === 'br' || typeArg.toLowerCase() === 'battle royale') {
            type = 'br'
        } else if (typeArg.toLowerCase() === 'stw' || typeArg.toLowerCase() === 'save the world') {
            type = 'stw'
        } else if (typeArg.toLowerCase() === 'bp' || typeArg.toLowerCase() === 'battle pass' || typeArg.toLowerCase() === 'battlepass') {
            type = 'bp'
        } else if (typeArg.toLowerCase() === 'tn' || typeArg.toLowerCase() === 'tournament' || typeArg.toLowerCase() === 'tournaments') {
            type = 'tn'
        }
        await ftnNews(type, message.channel.id)
    }

    if (cmd === `${ftnP}help`) {
        let webEmbed = new Discord.RichEmbed()
            .setAuthor("Help", client.user.avatarURL)
            .setDescription("Find all commands on https://stats.cool/commands")
            .setColor(colors[0])
        await message.channel.send(webEmbed)
    }

});

async function getFtnStats(username, platform, mode, time, channel) {
    // console.log(username, platform, channel, mode)
    let sChannel = client.channels.find(x => x.id === channel)
    let modeName = mode
    let timeName = time
    if (timeName === 'weekly') {
        timeName = "the past 7 days"
    }
    if (modeName === 'allGroupTypes') {
        modeName = 'all modes'
    }
    try {
        const playerLookup = await api.lookup(username);
        const playerStats = await api.getBattleRoyaleStatsById(playerLookup.id, time);
        if (isEmpty(playerStats.stats[platform])) {
            return error(`There are no stats on **${platform}** for **${username}** in ${timeName}`, channel)
        }

        let embed = new Discord.RichEmbed()
            .setAuthor("Fortnite stats", icons[0])
            .setDescription(`The **${platform.toUpperCase()}** stats of **${playerLookup.displayName}** in **${modeName}** in **${timeName}**`)
            .setColor(colors[0])
            .addField("Wins", playerStats.stats[platform][mode].placetop1 || '0', true)
            .addField("Kills", playerStats.stats[platform][mode].kills || '0', true)
            .addField("Matches", playerStats.stats[platform][mode].matchesPlayed || "'", true)
            .addField("Score", playerStats.stats[platform][mode].score || '0', true)
            .addField("K/D", Math.round(playerStats.stats[platform][mode].kills || '0' / (playerStats.stats[platform][mode].matchesPlayed || '0' - playerStats.stats[platform][mode].placetop1 || '0') * 100) / 100, true)
            .addField("Win%", `${Math.round(playerStats.stats[platform][mode].matchesPlayed || '0' / playerStats.stats[platform][mode].placetop1 || '0' * 100)/100}%`, true);
        sChannel.send(embed);
    } catch (err) {
        console.error(err);
    }
}

async function lookupItems(itemName, channel) {
    try {
        let sChannel = client.channels.find(x => x.id === channel);
        let items = await fnbr.getImages(itemName)
        if (items.length === 0) {
            return error(`There was no cosmetic found with the query: **${itemName}**`, channel)
        }
        let fnbrURL = `https://fnbr.co/${items[0].type}/${items[0].name.replace(" ", "-").replace(" ", "-")}`
        let imagePath = items[0].images.icon
        if (!imagePath) {
            console.log('imagePath changed')
            imagePath = items[0].images.featured
            let imagePath2 = items[0].images.featured
            if (!imagePath2) {
                imagePath = items[0].images.png
                imagePath2 = items[0].images.png
                if (!imagePath2) {
                    imagePath = icons[1]
                }
            }
        }
        let rarityColor = items[0].rarity
        if (rarityColor === 'legendary') {
            rarityColor = '#ff6d00'
        } else if (rarityColor === 'uncommon') {
            rarityColor = '#26c300'
        } else if (rarityColor === 'rare') {
            rarityColor = '#0060e2'
        } else if (rarityColor === 'epic') {
            rarityColor = '#7034a9'
        } else {
            rarityColor = colors[0]
        }

        let embed = new Discord.RichEmbed()
            .setAuthor("Fortnite Item", icons[0])
            .setDescription(`**${items[0].name}** ${fnbrURL} `)
            .setThumbnail(imagePath)
            .setColor(rarityColor)
            .addField("Name", items[0].name, true)
            .addField("Price", `${items[0].price} ${items[0].priceIcon}`, true)
            .addField("Rarity", items[0].rarity.charAt(0).toUpperCase() + items[0].rarity.substr(1), true)
            .addField("Type", items[0].type.charAt(0).toUpperCase() + items[0].type.substr(1), true);
        sChannel.send(embed).then(msg => msg.delete(300000))
    } catch (err) {
        console.error(err);
        return error("Some error came up. **We currently can't show upcoming items nor backpacks.**", channel)
    }
}

async function shopItems(channel) {
    try {
        let shop = await fnbr.getShop();
        let sChannel = client.channels.find(x => x.id === channel);
        let embed = new Discord.RichEmbed()
            .setColor(colors[0])
            .setDescription(`The items from today's itemshop https://fnbr.co/shop`)
            .setAuthor("Fortnite Itemshop", icons[0])
        for (let i = 0; i < shop.featured.length; i++) {

            const shopFeatured = shop.featured[i];
            if (!shopFeatured) {
                embed.addField("Not available cosmetic", "Empty", true)
            } else {
                embed.addField(shopFeatured.name, shopFeatured.price + " " + shopFeatured.priceIcon, true)
            }
        }
        embed.addBlankField()
        for (let i = 0; i < shop.daily.length; i++) {
            const shopDaily = shop.daily[i];
            embed.addField(shopDaily.name, shopDaily.price + " " + shopDaily.priceIcon, true)
        }
        sChannel.send(embed).then(msg => msg.delete(300000))


    } catch (err) {
        console.error(err)
    }
}

async function ftnNews(type, channel) {
    let sChannel = client.channels.find(x => x.id === channel)
    try {
        var news = await FortniteClient.GET_GAME_NEWS()
    } catch (err) {
        console.log(err)
    }
    if (type === 'br') {
        for (let i = 0; i < news.battleroyalenews.news.messages.length; i++) {
            let imageURL = news.battleroyalenews.news.messages[i].image
            if (!imageURL) {
                imageURL = icons[1];
            }
            let embed = new Discord.RichEmbed()
                .setColor(colors[0])
                .setTitle(news.battleroyalenews.news.messages[i].title)
                .setAuthor("Fortnite " + news.battleroyalenews.news._type, icons[0])
                .setDescription(news.battleroyalenews.news.messages[i].body)
                .setThumbnail(imageURL)
            sChannel.send(embed)
        }
    } else if (type === 'stw') {
        for (let i = 0; i < news.savetheworldnews.news.messages.length; i++) {
            let imageURL = news.savetheworldnews.news.messages[i].image
            if (!imageURL) {
                imageURL = icons[1];
            }
            let embed = new Discord.RichEmbed()
                .setColor(colors[0])
                .setTitle(news.savetheworldnews.news.messages[i].title)
                .setAuthor("Fortnite Save The World News", icons[0])
                .setDescription(news.savetheworldnews.news.messages[i].body)
                .setThumbnail(imageURL)
            sChannel.send(embed)
        }
    } else if (type === 'bp') {
        for (let i = 0; i < news.battlepassaboutmessages.news.messages.length; i++) {
            let imageURL = news.battlepassaboutmessages.news.messages[i].image
            if (!imageURL) {
                imageURL = icons[1];
            }
            let embed = new Discord.RichEmbed()
                .setColor(colors[0])
                .setTitle(news.battlepassaboutmessages.news.messages[i].title)
                .setAuthor("Fortnite Battlepass Information", icons[0])
                .setDescription(news.battlepassaboutmessages.news.messages[i].body)
                .setThumbnail(imageURL)
            sChannel.send(embed)
        }
    } else if (type === 'tn') {
        for (let i = 0; i < news.tournamentinformation.tournament_info.tournaments.length; i++) {
            let imageURL = news.tournamentinformation.tournament_info.tournaments[i].loading_screen_image
            let period = news.tournamentinformation.tournament_info.tournaments[i].schedule_info
            if (period === 'SOLO' || period === 'DUO' || period.endsWith("Prizes")) {
                period = "Not specified"
            }
            if (!imageURL) {
                imageURL = icons[1];
            }

            let embed = new Discord.RichEmbed()
                .setColor(colors[0])
                .setTitle(news.tournamentinformation.tournament_info.tournaments[i].long_format_title)
                .setAuthor("Fortnite Tournament Information", icons[0])
                .setDescription(news.tournamentinformation.tournament_info.tournaments[i].flavor_description)
                .setThumbnail(imageURL)
                .addField("Pins", news.tournamentinformation.tournament_info.tournaments[i].pin_score_requirement, true)
                .addField("Period", period.replace("!" || ".", ""), true)
            sChannel.send(embed)
        }
    }
}

function error(message, channel) {
    let sChannel = client.channels.find(x => x.id === channel);
    let embed = new Discord.RichEmbed()
        .setAuthor("Error", icons[1])
        .setDescription(message)
        .setColor(colors[1]);
    sChannel.send(embed).then(msg => msg.delete(300000))
}

function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

client.login(config.discord.token);