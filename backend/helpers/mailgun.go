package helpers

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
)

func SendInviteEmail(to, token, groupName string) error {
	domain := os.Getenv("MAILGUN_DOMAIN")
	apiKey := os.Getenv("MAILGUN_API_KEY")
	fromEmail := os.Getenv("EMAIL_FROM")
	baseURL := os.Getenv("FRONTEND_URL")

	if domain == "" || apiKey == "" {
		return fmt.Errorf("Mailgun not configured")
	}

	if fromEmail == "" {
		fromEmail = "FroggyWallet <mailgun@" + domain + ">"
	}

	inviteLink := strings.TrimRight(baseURL, "/") + "/invite?token=" + token

	htmlBody := fmt.Sprintf(`
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4CAF50;">You've been invited to join %s</h2>
                <p>You have been invited to join the group <strong>%s</strong> on FroggyWallet.</p>
                <p>Click the button below to accept the invitation:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="%s" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Accept Invitation</a>
                </div>
                <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="font-size: 12px; color: #666; word-break: break-all;">%s</p>
            </div>
        </body>
        </html>
    `, groupName, groupName, inviteLink, inviteLink)

	// Mailgun expects form data, not JSON
	data := url.Values{}
	data.Set("from", fromEmail)
	data.Set("to", to)
	data.Set("subject", "You've been invited to join "+groupName)
	data.Set("html", htmlBody)

	apiURL := fmt.Sprintf("https://api.mailgun.net/v3/%s/messages", domain)
	req, err := http.NewRequest("POST", apiURL, strings.NewReader(data.Encode()))
	if err != nil {
		return err
	}

	req.SetBasicAuth("api", apiKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Mailgun API error: status %d, body: %s", resp.StatusCode, string(body))
	}

	return nil
}
