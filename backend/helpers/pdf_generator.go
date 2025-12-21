package helpers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"
)

// User info from Narys
type PDFUser struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Username  string `json:"username"`
}

// Group info from Grupe
type PDFGroup struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	CreatedAt   string `json:"created_at"`
}

// Income from Pajama
type PDFIncome struct {
	Amount      float64 `json:"amount"`
	Date        string  `json:"date"`
	Description string  `json:"description"`
	Currency    string  `json:"currency"`
}

// Expense from Islaida
type PDFExpense struct {
	Amount     float64 `json:"amount"`
	Date       string  `json:"date"`
	Name       string  `json:"name"`
	Comment    string  `json:"comment"`
	CategoryID *uint   `json:"category_id,omitempty"`
	GroupID    *uint   `json:"group_id,omitempty"`
}

type PDFData struct {
	User       PDFUser      `json:"user"`
	Group      PDFGroup     `json:"group"`
	Incomes    []PDFIncome  `json:"incomes"`
	Expenses   []PDFExpense `json:"expenses"`
	ReportDate string       `json:"report_date"`
}

type pdfRequest struct {
	Template struct {
		ID string `json:"id"`
	} `json:"template"`
	Data interface{} `json:"data"`
}

type pdfResponse struct {
	Response string `json:"response"` // PDF URL
}

func PrintSamplePDFData() {
	sample := PDFData{
		User: PDFUser{
			FirstName: "Jonas",
			LastName:  "Jonaitis",
			Email:     "jonas@example.com",
			Username:  "jonasj",
		},
		Group: PDFGroup{
			ID:          1,
			Name:        "Šeimos biudžetas",
			Description: "Pagrindinė šeimos grupė",
			CreatedAt:   "2025-01-01",
		},
		Incomes: []PDFIncome{
			{Amount: 2500.00, Date: "2025-12-05", Description: "Alga", Currency: "EUR"},
			{Amount: 2500.00, Date: "2025-12-20", Description: "Premija", Currency: "EUR"},
		},
		Expenses: []PDFExpense{
			{Amount: 1200.00, Date: "2025-12-10", Name: "Nuoma", Comment: "Butas", CategoryID: nil, GroupID: nil},
			{Amount: 200.00, Date: "2025-12-12", Name: "Maistas", Comment: "Parduotuvė", CategoryID: nil, GroupID: nil},
		},
		ReportDate: time.Now().Format("2006-01-02"),
	}
	b, _ := json.MarshalIndent(sample, "", "  ")
	fmt.Println(string(b))
}

func GeneratePDF(data PDFData) (string, error) {
	apiKey := os.Getenv("PDFGENERATOR_API_KEY")
	secret := os.Getenv("PDFGENERATOR_SECRET2")
	templateID := os.Getenv("PDFGENERATOR_TEMPLATE_ID")

	if secret == "" && apiKey == "" {
		return "", fmt.Errorf("missing PDFGENERATOR_SECRET and PDFGENERATOR_API_KEY")
	}
	if templateID == "" {
		return "", fmt.Errorf("missing PDFGENERATOR_TEMPLATE_ID")
	}

	payload := map[string]interface{}{
		"template": map[string]interface{}{
			"id":   templateID,
			"data": data,
		},
		"format": "pdf",
		"output": "url",
		"name":   fmt.Sprintf("Report %s", time.Now().Format("2006-01-02_15-04-05")),
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", "https://us1.pdfgeneratorapi.com/api/v4/documents/generate", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", err
	}
	if secret != "" {
		req.Header.Set("Authorization", "Bearer "+secret)
	}
	if apiKey != "" {
		req.Header.Set("X-API-KEY", apiKey)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("PDF API error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	// Try to extract URL from common response shapes
	var respMap map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &respMap); err != nil {
		return "", fmt.Errorf("invalid response JSON: %s", string(bodyBytes))
	}

	// check response.url or response (string) or url
	if r, ok := respMap["response"]; ok {
		switch v := r.(type) {
		case string:
			return v, nil
		case map[string]interface{}:
			if u, ok := v["url"].(string); ok && u != "" {
				return u, nil
			}
			if u, ok := v["data"].(map[string]interface{})["url"].(string); ok && u != "" {
				return u, nil
			}
		}
	}
	if u, ok := respMap["url"].(string); ok && u != "" {
		return u, nil
	}
	// fallback: return whole body as string for debugging
	return string(bodyBytes), nil
}
