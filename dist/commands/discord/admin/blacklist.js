"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const slash_create_1 = require("slash-create");
const PlayFab_1 = require("../../../services/PlayFab");
const Config_1 = __importDefault(require("../../../structures/Config"));
const SlashCommand_1 = __importDefault(require("../../../structures/SlashCommand"));
class Blacklist extends SlashCommand_1.default {
    constructor(creator, bot, commandName) {
        super(creator, bot, {
            name: commandName,
            description: "Blacklist commands",
            options: [
                {
                    type: slash_create_1.CommandOptionType.SUB_COMMAND,
                    name: "on",
                    description: "Enable the blacklist",
                    options: [
                        {
                            name: "server",
                            description: "Server to run the command on",
                            required: true,
                            type: slash_create_1.CommandOptionType.STRING,
                            choices: Config_1.default.get("servers").map((server) => ({
                                name: server.name,
                                value: server.name,
                            })),
                        },
                    ],
                },
                {
                    type: slash_create_1.CommandOptionType.SUB_COMMAND,
                    name: "off",
                    description: "Disable the blacklist",
                    options: [
                        {
                            name: "server",
                            description: "Server to run the command on",
                            required: true,
                            type: slash_create_1.CommandOptionType.STRING,
                            choices: Config_1.default.get("servers").map((server) => ({
                                name: server.name,
                                value: server.name,
                            })),
                        },
                    ],
                },
                {
                    type: slash_create_1.CommandOptionType.SUB_COMMAND,
                    name: "list",
                    description: "List the blacklisted players",
                    options: [
                        {
                            name: "server",
                            description: "Server to run the command on",
                            required: true,
                            type: slash_create_1.CommandOptionType.STRING,
                            choices: Config_1.default.get("servers").map((server) => ({
                                name: server.name,
                                value: server.name,
                            })),
                        },
                    ],
                },
                {
                    type: slash_create_1.CommandOptionType.SUB_COMMAND,
                    name: "add",
                    description: "Add a player to the blacklist",
                    options: [
                        {
                            name: "server",
                            description: "Server to run the command on",
                            required: true,
                            type: slash_create_1.CommandOptionType.STRING,
                            choices: Config_1.default.get("servers").map((server) => ({
                                name: server.name,
                                value: server.name,
                            })),
                        },
                        {
                            name: "player",
                            description: "PlayFab ID or name of the player",
                            required: true,
                            type: slash_create_1.CommandOptionType.STRING,
                        },
                    ],
                },
                {
                    type: slash_create_1.CommandOptionType.SUB_COMMAND,
                    name: "remove",
                    description: "Remove a player from the blacklist",
                    options: [
                        {
                            name: "server",
                            description: "Server to run the command on",
                            required: true,
                            type: slash_create_1.CommandOptionType.STRING,
                            choices: Config_1.default.get("servers").map((server) => ({
                                name: server.name,
                                value: server.name,
                            })),
                        },
                        {
                            name: "player",
                            description: "PlayFab ID or name of the player",
                            required: true,
                            type: slash_create_1.CommandOptionType.STRING,
                        },
                    ],
                },
            ],
            dmPermission: false,
            requiredPermissions: [],
        });
    }
    hasPermission(ctx) {
        return ctx.member.roles.some((r) => Config_1.default.get("discord.roles")
            .filter((role) => role.commands.includes(this.commandName))
            .find((role) => role.Ids.includes(r)));
    }
    async run(ctx) {
        await ctx.defer();
        const options = ctx.options[ctx.subcommands[0]];
        const server = this.bot.servers.get(options.server);
        if (!server) {
            return (await ctx.send(`Server not found, existing servers are: ${[
                ...this.bot.servers.keys(),
            ].join(", ")}`));
        }
        if (!server.rcon.connected || !server.rcon.authenticated) {
            return (await ctx.send(`Not ${!server.rcon.connected ? "connected" : "authenticated"} to server`));
        }
        switch (ctx.subcommands[0]) {
            case "on": {
                this.bot.blacklist.on(server.rcon, {
                    ids: { playFabID: ctx.member.id },
                    id: ctx.member.id,
                    name: `${ctx.member.displayName}#${ctx.member.user.discriminator}`,
                });
                return (await ctx.send(`Blacklist enabled on ${server.name}`));
            }
            case "off": {
                this.bot.blacklist.off(server.rcon, {
                    ids: { playFabID: ctx.member.id },
                    id: ctx.member.id,
                    name: `${ctx.member.displayName}#${ctx.member.user.discriminator}`,
                });
                return (await ctx.send(`Blacklist disabled on ${server.name}`));
            }
            case "list": {
                console.log(server.rcon);
                const players = await this.bot.blacklist.list(server.rcon);
                return (await ctx.send(`Blacklisted players on ${server.name}: ${players.length
                    ? players.map((player) => player.id).join(", ")
                    : "none"}`));
            }
            case "add": {
                const ingamePlayer = await server.rcon.getIngamePlayer(options.player);
                const player = this.bot.cachedPlayers.get((ingamePlayer === null || ingamePlayer === void 0 ? void 0 : ingamePlayer.id) || options.player) || {
                    server: server.name,
                    ...(await (0, PlayFab_1.LookupPlayer)((ingamePlayer === null || ingamePlayer === void 0 ? void 0 : ingamePlayer.id) || options.player)),
                };
                if (!(player === null || player === void 0 ? void 0 : player.id)) {
                    return await ctx.send("Invalid player provided");
                }
                this.bot.blacklist.add(server.rcon, {
                    ids: {
                        playFabID: player.ids.playFabID,
                        steamID: player.ids.steamID,
                    },
                    id: ctx.member.id,
                    name: `${ctx.member.displayName}#${ctx.member.user.discriminator}`,
                }, {
                    ids: { playFabID: player.id },
                    id: player.id,
                    name: player.name,
                });
                return (await ctx.send(`Added ${player.name} to the blacklist on ${server.name}`));
            }
            case "remove": {
                const ingamePlayer = await server.rcon.getIngamePlayer(options.player);
                const player = this.bot.cachedPlayers.get((ingamePlayer === null || ingamePlayer === void 0 ? void 0 : ingamePlayer.id) || options.player) || {
                    server: server.name,
                    ...(await (0, PlayFab_1.LookupPlayer)((ingamePlayer === null || ingamePlayer === void 0 ? void 0 : ingamePlayer.id) || options.player)),
                };
                if (!(player === null || player === void 0 ? void 0 : player.id)) {
                    return await ctx.send("Invalid player provided");
                }
                this.bot.blacklist.remove(server.rcon, {
                    ids: { playFabID: ctx.member.id },
                    id: ctx.member.id,
                    name: `${ctx.member.displayName}#${ctx.member.user.discriminator}`,
                }, {
                    ids: {
                        playFabID: player.ids.playFabID,
                        steamID: player.ids.steamID,
                    },
                    id: player.id,
                    name: player.name,
                });
                return (await ctx.send(`Removed ${player.name} from the blacklist on ${server.name}`));
            }
        }
    }
}
exports.default = Blacklist;
