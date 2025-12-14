package controllers

import (
	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

// GetCategories – gauti visas kategorijas
func GetCategories(c *fiber.Ctx) error {
	var categories []models.Kategorija
	if err := initializers.DB.Find(&categories).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko gauti kategorijų",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   categories,
	})
}

// CreateCategory – sukurti naują kategoriją
func CreateCategory(c *fiber.Ctx) error {
	var body struct {
		Pavadinimas string `json:"pavadinimas"`
	}

	if err := c.BodyParser(&body); err != nil || body.Pavadinimas == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Nurodykite kategorijos pavadinimą",
		})
	}

	category := models.Kategorija{
		Pavadinimas: body.Pavadinimas,
	}

	if err := initializers.DB.Create(&category).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko sukurti kategorijos",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"status":  "success",
		"message": "Kategorija sukurta sėkmingai",
		"data":    category,
	})
}