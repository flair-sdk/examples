// only works with node-fetch@2 (pnpm i node-fetch@2)
import fetch from 'node-fetch';

async function sendToWebhook(webhookUrl, data) {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error(`Failed to send data to webhook. Status: ${response.status}`);
        } else {
            console.log('Data sent successfully to webhook.');
        }
    } catch (error) {
        console.error('Error sending data to webhook:', error);
        throw error;
    }
}

export async function handleInput({ data }: {
    data: {
        positionAddress: string;
        borrowRateLast24H: number;
        borrowRateLast48H: number;
    }
}) {
    if (!data || !data.borrowRateLast24H || !data.borrowRateLast48H || !data.positionAddress) {
        throw new Error(
            `Skipping processing item, missing borrowRateLast24H, borrowRateLast48H or positionAddress : ${JSON.stringify(
                { data },
            )}`,
        );
    }

    const zapierWebhookUrl = 'REPLACE_ME';
    const webhookUrls = [zapierWebhookUrl];

    const requestBody = {
        positionAddress: data?.positionAddress,
        borrowRateLast24H: data?.borrowRateLast24H,
        borrowRateLast48H: data?.borrowRateLast48H,
    };

    webhookUrls.forEach((webhookUrl) => {
        sendToWebhook(webhookUrl, requestBody);
    });
};