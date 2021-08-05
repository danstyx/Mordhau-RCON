import fetch from "node-fetch";
import {
    ButtonStyle,
    ComponentContext,
    ComponentType,
    MessageInteractionContext,
    MessageOptions,
} from "slash-create";
import {} from "slash-create/lib/creator";
import { Embed } from "../structures/DiscordEmbed";

// Cant get type from slash-create so made a hack
type ComponentRegisterCallback = (ctx: ComponentContext) => void;

export async function sendWebhookMessage(
    webhookCredentials: { id: string; token: string },
    content: string
) {
    if (!webhookCredentials) return "Webhook endpoint not provided";

    const body = {
        content,
    };

    return await send(webhookCredentials, body);
}

export async function sendWebhookEmbed(
    webhookCredentials: { id: string; token: string },
    embed: Embed
) {
    if (!webhookCredentials) return "Webhook endpoint not provided";

    const body = {
        embeds: [embed],
    };

    return await send(webhookCredentials, body);
}

function send(webhookCredentials: { id: string; token: string }, content: any) {
    return fetch(
        `https://discord.com/api/webhooks/${webhookCredentials.id}/${webhookCredentials.token}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(content),
        }
    );
}

export function mentionRole(id: string) {
    return `<@&${id}>`;
}

export async function ComponentConfirmation(
    ctx: MessageInteractionContext,
    message: MessageOptions,
    confirm: ComponentRegisterCallback,
    cancel?: ComponentRegisterCallback
) {
    await ctx.defer();

    await ctx.send({
        ...message,
        components: [
            {
                type: ComponentType.ACTION_ROW,
                components: [
                    {
                        type: ComponentType.BUTTON,
                        style: ButtonStyle.SUCCESS,
                        custom_id: "confirm",
                        label: "Confirm",
                        // emoji: {
                        //     name: "✅",
                        // },
                    },
                    {
                        type: ComponentType.BUTTON,
                        style: ButtonStyle.DESTRUCTIVE,
                        custom_id: "cancel",
                        label: "Cancel",
                        // emoji: { name: "❌" },
                    },
                ],
            },
        ],
    });

    ctx.registerComponent("confirm", confirm);

    ctx.registerComponent(
        "cancel",
        cancel
            ? cancel
            : async (btnCtx) => {
                  await btnCtx.editParent({
                      content: "Cancelled!",
                      embeds: [],
                      components: [],
                  });
              }
    );
}
