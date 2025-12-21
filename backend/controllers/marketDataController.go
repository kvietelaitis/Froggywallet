package controllers

import (
	"log"
	"math/rand"
	"time"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

/* =======================
   MARKET DATA CONTROLLERS
======================= */

var marketAssets = []struct {
	Name  string
	Price float64
}{
	{"AAPL", 175}, {"MSFT", 320}, {"GOOGL", 140}, {"AMZN", 155}, {"TSLA", 210},
	{"META", 480}, {"NFLX", 450}, {"NVDA", 265}, {"INTC", 55}, {"AMD", 110},
	{"BABA", 95}, {"ORCL", 85}, {"IBM", 125}, {"ADBE", 520}, {"PYPL", 250},
	{"CRM", 230}, {"UBER", 45}, {"LYFT", 35}, {"SHOP", 65}, {"SQ", 75},
	{"TWTR", 65}, {"SNAP", 40}, {"SPOT", 240}, {"ROKU", 100}, {"ZM", 120},
	{"DOCU", 120}, {"COIN", 55}, {"PINS", 25}, {"BIDU", 160}, {"JD", 45},
	{"TCEHY", 60}, {"V", 230}, {"MA", 360}, {"GS", 400}, {"JPM", 155},
	{"BAC", 35}, {"WFC", 45}, {"C", 65}, {"TSM", 100}, {"ASML", 680},
	{"SAP", 140}, {"SNE", 95}, {"SONY", 95}, {"TM", 180}, {"GM", 55},
	{"F", 45}, {"NIO", 35}, {"LI", 25}, {"RIVN", 35},
}

// =====================
// Helper: update prices
// =====================
func UpdateMarketPricesInDB() error {
	var count int64

	// Check if table is empty
	if err := initializers.DB.
		Model(&models.RinkosDuomenys{}).
		Count(&count).Error; err != nil {
		return err
	}

	now := time.Now()

	// Seed if empty
	if count == 0 {
		for _, asset := range marketAssets {
			md := models.RinkosDuomenys{
				Pavadinimas:     asset.Name,
				Kaina:           asset.Price,
				AtnaujinimoData: now,
			}
			if err := initializers.DB.Create(&md).Error; err != nil {
				return err
			}
		}
		log.Println("Market table empty — seeded initial data")
		return nil
	}

	// Fetch latest prices
	var latest []models.RinkosDuomenys
	if err := initializers.DB.Raw(`
		SELECT DISTINCT ON (pavadinimas) *
		FROM rinkos_duomenys
		ORDER BY pavadinimas, atnaujinimo_data DESC
	`).Scan(&latest).Error; err != nil {
		return err
	}

	// Update prices
	for _, asset := range latest {
		change := asset.Kaina * (rand.Float64()*0.06 - 0.03)
		newPrice := asset.Kaina + change
		if newPrice < 1 {
			newPrice = asset.Kaina
		}

		md := models.RinkosDuomenys{
			Pavadinimas:     asset.Pavadinimas,
			Kaina:           newPrice,
			AtnaujinimoData: now,
		}
		if err := initializers.DB.Create(&md).Error; err != nil {
			return err
		}
	}

	log.Println("Market prices updated")
	return nil
}

// =====================
// API Handlers
// =====================

// SeedMarketAssets – fills table with initial options
func SeedMarketAssets(c *fiber.Ctx) error {
	now := time.Now()

	for _, asset := range marketAssets {
		md := models.RinkosDuomenys{
			Pavadinimas:     asset.Name,
			Kaina:           asset.Price,
			AtnaujinimoData: now,
		}
		initializers.DB.Create(&md)
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Market assets seeded",
	})
}

// UpdateMarketPrices – API endpoint for manual update
func UpdateMarketPrices(c *fiber.Ctx) error {
    log.Println("UpdateMarketPrices called") // 

    if err := UpdateMarketPricesInDB(); err != nil {
        log.Println("Error updating market prices:", err) //
        return c.Status(500).JSON(fiber.Map{
            "status": "error",
            "error":  err.Error(),
        })
    }

    return c.JSON(fiber.Map{
        "status":  "success",
        "message": "Market data ensured & updated",
    })
}

// GetMarketAssets – return distinct investment names
func GetMarketAssets(c *fiber.Ctx) error {
	var names []string
	initializers.DB.
		Model(&models.RinkosDuomenys{}).
		Distinct("pavadinimas").
		Pluck("pavadinimas", &names)

	return c.JSON(fiber.Map{"status": "success", "data": names})
}

// GetLatestMarketPrices – returns latest price per asset
func GetLatestMarketPrices(c *fiber.Ctx) error {
	var prices []models.RinkosDuomenys

	err := initializers.DB.Raw(`
		SELECT DISTINCT ON (pavadinimas) *
		FROM rinkos_duomenys
		ORDER BY pavadinimas, atnaujinimo_data DESC
	`).Scan(&prices).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status": "error",
			"error": err.Error(),
		})
	}

	result := make(map[string]float64)
	for _, p := range prices {
		result[p.Pavadinimas] = p.Kaina
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   result,
	})
}

// GetMarketAssetNames – returns distinct market asset names
func GetMarketAssetNames(c *fiber.Ctx) error {
	var names []string
	if err := initializers.DB.
		Model(&models.RinkosDuomenys{}).
		Distinct("pavadinimas").
		Pluck("pavadinimas", &names).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": "error",
			"error":  err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   names,
	})
}