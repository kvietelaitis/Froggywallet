package controllers

import (
	"time"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

type IncomeInput struct {
	Name     string  `json:"name"`
	Amount   float64 `json:"amount"`
	Date     string  `json:"date"`
	Currency string  `json:"currency"`
}

func CreateIncome(c *fiber.Ctx) error {
	var input IncomeInput

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	parsedDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid date format",
		})
	}

	income := models.Pajama{
		Aprasymas: input.Name,
		Suma:      input.Amount,
		Data:      parsedDate,
		Valiuta:   input.Currency,
	}

	if result := initializers.DB.Create(&income); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not create income",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Income created successfully",
		"income":  income,
	})
}
