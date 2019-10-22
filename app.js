require('dotenv').config();

const { App } = require('@slack/bolt');

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

// entering app home
app.event('app_home_opened', async ({ event, say }) => {
    say({
        blocks: [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `How may I help you,<@${event.user}>?`
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Online Update",
                            "emoji": true
                        },
                        "style": "primary",
                        "value": "online_update_click",
                        "action_id": "online_update_click"
                    }
                ]
            }
        ]
      });
});

// clicking "online update" button in app home
app.action('online_update_click', ({ body, ack, payload, context }) => {
    // Acknowledge the action
    ack();
    // Create pop-up conversation
    try {
        const result = app.client.views.open({
            token: context.botToken,
            trigger_id: body.trigger_id,
            view: {
                "type": "modal",
                "callback_id": 'online_update_form',
                "title": {
                    "type": "plain_text",
                    "text": "Online Update",
                    "emoji": true
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Submit",
                    "emoji": true
                },
                "close": {
                    "type": "plain_text",
                    "text": "Cancel",
                    "emoji": true
                },
                "blocks": [
                    {
                        "type": "input",
                        "block_id": "update-channel",
                        "element": {
                            "type": "channels_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select a channel",
                                "emoji": true
                            },
                            "action_id": "update-channel-select"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "Post update to: "
                        }
                        
                    },
                    {
                        "type": "input",
                        "block_id": "update-done",
                        "label": {
                            "type": "plain_text",
                            "text": "我昨天進行的事情"
                        },
                        "element": {
                            "type": "plain_text_input",
                            "multiline": true,
                            "action_id": "update-input-done"
                        }
                    },
                    {
                        "type": "input",
                        "block_id": "update-todo",
                        "label": {
                            "type": "plain_text",
                            "text": "我今天要做的事情"
                        },
                        "element": {
                            "type": "plain_text_input",
                            "multiline": true,
                            "action_id": "update-input-todo"
                        }
                    },
                    {
                        "type": "input",
                        "block_id": "update-problems",
                        "element": {
                            "type": "plain_text_input",
                            "multiline": true,
                            "action_id": "update-input-problems"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "有沒有遇到哪些困難",
                            "emoji": true
                        }
                    }
                ]
            }
        });
        console.log(result);
    } catch (err) {
        console.error(error);
    }
});

// sending message with online update dialog
app.view("online_update_form", async({ ack, body, view, context }) => {
    ack();
    
    const selectedChannel = view["state"]["values"]["update-channel"]["update-channel-select"]["selected_channel"];
    const done = view["state"]["values"]["update-done"]["update-input-done"]["value"];
    const todo = view["state"]["values"]["update-todo"]["update-input-todo"]["value"]; 
    const problems = view["state"]["values"]["update-problems"]["update-input-problems"]["value"]; 
    const user = body["user"]["id"];
    try {
        app.client.chat.postMessage({
            token: context.botToken,
            channel: selectedChannel,
            blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "我昨天進行的事情" 
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `\`\`\`${done}\`\`\``
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "我今天要做的事情" 
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `\`\`\`${todo}\`\`\``
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "有沒有遇到哪些困難" 
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `\`\`\`${problems}\`\`\``
                    }
                }
            ]
        });
    } catch (err) {
        console.log(err);
    }
});

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');
})();