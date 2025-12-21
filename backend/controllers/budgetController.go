package controllers

import (
	"time"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

type CreateBudgetRequest struct {
	Pavadinimas         string  `json:"pavadinimas"`
	PlanuojamosPajamos  float64 `json:"planuojamos_pajamos"`
	PlanuojamosIslaidos float64 `json:"planuojamos_islaidos"`
	DataNuo             string  `json:"data_nuo"`
	DataIki             string  `json:"data_iki"`
	GrupeID             *uint   `json:"grupe_id"`
}

type EditBudgetRequest struct {
	Pavadinimas         *string  `json:"pavadinimas"`
	PlanuojamosPajamos  *float64 `json:"planuojamos_pajamos"`
	PlanuojamosIslaidos *float64 `json:"planuojamos_islaidos"`
	DataNuo             *string  `json:"data_nuo"`
	DataIki             *string  `json:"data_iki"`
	Statusas            *string  `json:"statusas"`
}

func GetBudgets(c *fiber.Ctx) error {
	groupID := c.Query("grupe_id")

	var budgets []models.Biudzetas
	query := initializers.DB

	if groupID != "" {
		query = query.Where("grupe_id = ?", groupID)
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Group ID is required",
		})
	}

	if err := query.Find(&budgets).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch budgets",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"budgets": budgets,
	})
}

func GetBudget(c *fiber.Ctx) error {
	budgetID := c.Params("id")
	groupID := c.Query("grupe_id")

	var budget models.Biudzetas
	query := initializers.DB.Where("id = ?", budgetID)

	if groupID != "" {
		query = query.Where("grupe_id = ?", groupID)
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Group ID is required",
		})
	}

	if err := query.First(&budget).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Budget not found",
		})
	}
	return c.JSON(fiber.Map{
		"biudzetas": budget,
	})
}

func CreateBudget(c *fiber.Ctx) error {
	var body CreateBudgetRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	fromDate, err := time.Parse("2006-01-02", body.DataNuo)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Incorrect date format",
		})
	}

	toDate, err := time.Parse("2006-01-02", body.DataIki)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Incorrect date format",
		})
	}

	budget := models.Biudzetas{
		Pavadinimas:         body.Pavadinimas,
		LaikotarpioPradzia:  fromDate,
		LaikotarpioPabaiga:  toDate,
		PlanuojamosPajamos:  body.PlanuojamosPajamos,
		PlanuojamosIslaidos: body.PlanuojamosIslaidos,
		Statusas:            "aktyvus", // Default status
		GrupeID:             body.GrupeID,
	}

	result := initializers.DB.Create(&budget)
	if result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save budget",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"biudzetas": budget,
	})
}

func EditBudget(c *fiber.Ctx) error {
	groupID := c.Query("grupe_id")
	budgetID := c.Params("id")

	var body EditBudgetRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Failed to parse request body",
		})
	}

	var budget models.Biudzetas
	query := initializers.DB.Where("id = ?", budgetID)

	if groupID != "" {
		query = query.Where("grupe_id = ?", groupID)
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Group ID is required",
		})
	}

	if err := query.First(&budget).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Budget not found",
		})
	}

	if body.Pavadinimas != nil {
		budget.Pavadinimas = *body.Pavadinimas
	}
	if body.PlanuojamosPajamos != nil {
		budget.PlanuojamosPajamos = *body.PlanuojamosPajamos
	}
	if body.PlanuojamosIslaidos != nil {
		budget.PlanuojamosIslaidos = *body.PlanuojamosIslaidos
	}
	if body.DataNuo != nil {
		fromDate, err := time.Parse("2006-01-02", *body.DataNuo)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Incorrect date format for DataNuo",
			})
		}
		budget.LaikotarpioPradzia = fromDate
	}
	if body.DataIki != nil {
		toDate, err := time.Parse("2006-01-02", *body.DataIki)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Incorrect date format for DataIki",
			})
		}
		budget.LaikotarpioPabaiga = toDate
	}
	if body.Statusas != nil {
		budget.Statusas = *body.Statusas
	}

	if err := initializers.DB.Save(&budget).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update budget",
		})
	}

	return c.JSON(fiber.Map{
		"biudzetas": budget,
	})
}

func DeleteBudget(c *fiber.Ctx) error {
	groupID := c.Query("grupe_id")
	budgetID := c.Params("id")

	var budget models.Biudzetas
	query := initializers.DB.Where("id = ?", budgetID)
	if groupID != "" {
		query = query.Where("grupe_id = ?", groupID)
	} else {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Group ID is required",
		})
	}

	if err := query.First(&budget).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Budget not found",
		})
	}

	if err := initializers.DB.Delete(&budget).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete budget",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Budget deleted successfully",
	})
}
