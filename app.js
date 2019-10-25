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
                        "value": "online-update-button",
                        "action_id": "online-update-button"
                    }
                ]
            }
        ]
      });
});

// Create online update modal skeleton
onlineUpdateTemplate = (token) => {
    return {
        token: token,
        view: {
            "type": "modal",
            "callback_id": 'online-update-form',
            "title": {
                "type": "plain_text",
                "text": "Hello World",
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
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "*Select a channel to post:*"
                    }
                },
                {
                    "type": "actions",
                    "block_id": "update-conversation",
                    "elements": [{
                        "type": "conversations_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select a conversation",
                            "emoji": true
                        },
                        "action_id": "update-conversation-select"
                    }]
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
                    "optional": true,
                    "label": {
                        "type": "plain_text",
                        "text": "有沒有遇到哪些困難",
                        "emoji": true
                    }
                }
            ]
        }
    }
}
// clicking "online update" button in app home
app.action('online-update-button', ({ body, ack, payload, context }) => {
    // Acknowledge the action
    ack();
    // Create pop-up conversation
    const jsonPayload = onlineUpdateTemplate(context.botToken);
    jsonPayload.trigger_id = body.trigger_id;
    try {
        const result = app.client.views.open(jsonPayload);
        console.log(result);
    } catch (err) {
        console.error(error);
    }
});

app.action("update-conversation-select", async({body, ack, payload, context}) => {
    ack();

    const conversation = payload.selected_conversation;
    
    const messagesResponse = await app.client.channels.history({
        token: process.env.SLACK_OAUTH_TOKEN,
        channel:conversation 
    });
    const optionList = [];
    messagesResponse.messages.map( (x) => {
        
        if ((!x.hasOwnProperty("thread_ts") || x["thread_ts"] === x["ts"]) && x.text.length > 0 ) {
            optionList.push({
                "text":{
                    "type": "plain_text",
                    "text": x.text.slice(0,21)
                },
                "value": `${x.ts}#${conversation}`
            });
        }
    });
    const jsonPayload = onlineUpdateTemplate(context.botToken);
    // set necessary view_id when updating
    jsonPayload.view_id = body.view.id;
    // change the value of "Do not start new thread" to the conversation id
    jsonPayload.view.blocks.splice(2,0, {
        "type": "input",
        "block_id": "update-thread",
        "label": {
            "type": "plain_text",
            "text": "Post update to thread: "
        },
        "element": {
            "type": "static_select",
            "placeholder": {
                "type": "plain_text",
                "text": "Select a message thread",
                "emoji": true
            },
            "action_id": "update-thread-select",
            "options":[{
                "text": {
                    "type": "plain_text",
                    "text": "Start a new thread"
                },
                "value": `#${conversation}`
            }, ...optionList],
        }
    });

    try {
        const result = await app.client.views.update(jsonPayload);
        console.log(result);
    } catch (error) {
        console.error(error.data.response_metadata);
    }
});

// sending message with online update dialog
app.view("online-update-form", async({ ack, body, view, context }) => {
    ack();

    const selectedThread = view["state"]["values"]["update-thread"]["update-thread-select"]["selected_option"]["value"]
    const done = view["state"]["values"]["update-done"]["update-input-done"]["value"];
    const todo = view["state"]["values"]["update-todo"]["update-input-todo"]["value"]; 
    const problems = view["state"]["values"]["update-problems"]["update-input-problems"]["value"];
    const user = body["user"]["id"];
    // Extract thread_id & channel_id correspondingly
    const [threadID, channelID] = selectedThread.split("#");
    // grab user info: name & icon
    try{
        var user_info = await app.client.users.info({
            token: context.botToken,
            user: user
        });
    } catch (err) {
        console.log(err);
    }
    const jsonPayload = {
        token: context.botToken,
        channel: channelID,
        username: user_info.user.name,
        icon_url: user_info.user.profile.image_72,
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
            }
        ]
    }
    if (threadID.length > 0) {
        jsonPayload.thread_ts = threadID;
    }
    // attach problem section if not null
    if (problems) {
        jsonPayload.blocks.push(
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
        });
    }
    try {
        const result = await app.client.chat.postMessage(jsonPayload);
        console.log(result);
    } catch (err) {
        console.log(err);
    }
});

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');
})();
