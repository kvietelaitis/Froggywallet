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

func GetCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	var category models.Kategorija
	if err := initializers.DB.First(&category, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Kategorija nerasta",
		})
	}
	return c.JSON(fiber.Map{
		"status": "success",
		"data":   category,
	})
}

// CreateCategory – sukurti naują kategoriją
func CreateCategory(c *fiber.Ctx) error {
	var body struct {
		Pavadinimas string `json:"name"`
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

func UpdateCategory(c *fiber.Ctx) error {
	id := c.Params("id")

	var body struct {
		Pavadinimas string `json:"pavadinimas"`
	}

	if err := c.BodyParser(&body); err != nil || body.Pavadinimas == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Nurodykite kategorijos pavadinimą",
		})
	}

	var category models.Kategorija
	if err := initializers.DB.First(&category, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Kategorija nerasta",
		})
	}

	category.Pavadinimas = body.Pavadinimas

	if err := initializers.DB.Save(&category).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko atnaujinti kategorijos",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Kategorija atnaujinta sėkmingai",
		"data":    category,
	})
}

func DeleteCategory(c *fiber.Ctx) error {
	id := c.Params("id")
	var category models.Kategorija

	if err := initializers.DB.First(&category, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Kategorija nerasta",
		})
	}

	if err := initializers.DB.Delete(&category).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko ištrinti kategorijos",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Kategorija ištrinta sėkmingai",
	})
}
