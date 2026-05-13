class ZeptoMailService {
    getConfig() {
        return {
            apiUrl: process.env.ZEPTOMAIL_API_URL,
            apiKey: process.env.ZEPTOMAIL_API_KEY,
            fromEmail: process.env.ZEPTOMAIL_FROM_EMAIL,
            fromName: process.env.ZEPTOMAIL_FROM_NAME || 'Mafaza Investments'
        };
    }

    isConfigured() {
        const { apiUrl, apiKey, fromEmail } = this.getConfig();
        return Boolean(apiUrl && apiKey && fromEmail);
    }

    async sendTemporaryPasswordEmail({ toEmail, toName, temporaryPassword, loginUrl }) {
        const { apiUrl, apiKey, fromEmail, fromName } = this.getConfig();
        if (!apiUrl || !apiKey || !fromEmail) {
            throw new Error('ZeptoMail is not configured');
        }

        const safeName = toName || toEmail;
        const safeLoginUrl = loginUrl || 'http://localhost:3001/login';

        const payload = {
            from: {
                address: fromEmail,
                name: fromName
            },
            to: [
                {
                    email_address: {
                        address: toEmail,
                        name: safeName
                    }
                }
            ],
            subject: 'Your Mafaza temporary login password',
            htmlbody: `
                <p>Hi ${escapeHtml(safeName)},</p>
                <p>Your account has been migrated to Mafaza.</p>
                <p><strong>Temporary Password:</strong> ${escapeHtml(temporaryPassword)}</p>
                <p>Please log in at <a href="${escapeHtml(safeLoginUrl)}">${escapeHtml(safeLoginUrl)}</a>.</p>
                <p>You will be asked to set a new password during first login.</p>
                <p>Regards,<br/>Mafaza Investments</p>
            `
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`ZeptoMail request failed: ${response.status} ${text}`);
        }

        return await response.json();
    }

    async sendPasswordResetEmail({ toEmail, toName, resetUrl }) {
        const { apiUrl, apiKey, fromEmail, fromName } = this.getConfig();
        if (!apiUrl || !apiKey || !fromEmail) {
            throw new Error('ZeptoMail is not configured');
        }

        const safeName = toName || toEmail;
        const safeResetUrl = resetUrl || 'http://localhost:3001/reset-password';

        const payload = {
            from: {
                address: fromEmail,
                name: fromName
            },
            to: [
                {
                    email_address: {
                        address: toEmail,
                        name: safeName
                    }
                }
            ],
            subject: 'Reset your Mafaza account password',
            htmlbody: `
                <p>Hi ${escapeHtml(safeName)},</p>
                <p>We received a request to reset your Mafaza account password.</p>
                <p>Click here to reset it: <a href="${escapeHtml(safeResetUrl)}">${escapeHtml(safeResetUrl)}</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request this, you can safely ignore this email.</p>
                <p>Regards,<br/>Mafaza Investments</p>
            `
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: apiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`ZeptoMail request failed: ${response.status} ${text}`);
        }

        return await response.json();
    }
}

module.exports = new ZeptoMailService();

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
