package controllers

import (
	"strconv"
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

	var userID uint

	// 1. Try getting full user model from "user" key
	if u := c.Locals("user"); u != nil {
		if usr, ok := u.(*models.Narys); ok {
			userID = usr.ID
		} else if usr, ok := u.(models.Narys); ok {
			userID = usr.ID
		}
	}

	if userID == 0 {
		if uid := c.Locals("userID"); uid != nil {
			if id, ok := uid.(uint); ok {
				userID = id
			} else if id, ok := uid.(float64); ok {
				userID = uint(id)
			}
		}
	}

	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthenticated"})
	}

	income := models.Pajama{
		Aprasymas: input.Name,
		Suma:      input.Amount,
		Data:      parsedDate,
		Valiuta:   input.Currency,
		NarysID:   userID, // Correctly assigned ID
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

func GetIncomes(c *fiber.Ctx) error {
	idParam := c.Params("id")
	if idParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing income id",
		})
	}

	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid id parameter"})
	}

	id := uint(id64)

	var incomes []models.Pajama

	if err := initializers.DB.Where("narys_id = ?", id).Find(&incomes).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not retrieve incomes",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"incomes": incomes,
	})
}

func GetIncome(c *fiber.Ctx) error {
	idParam := c.Params("id")
	if idParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing income id",
		})
	}

	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid id parameter"})
	}

	id := uint(id64)

	var income models.Pajama

	if err := initializers.DB.First(&income, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Income not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"income": income,
	})
}

func UpdateIncome(c *fiber.Ctx) error {
	idParam := c.Params("id")
	if idParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing income id",
		})
	}

	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid id parameter"})
	}

	id := uint(id64)

	var income models.Pajama
	if err := initializers.DB.First(&income, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Income not found",
		})
	}

	var input IncomeInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	var parsedDate time.Time
	if input.Date != "" {
		parsedDate, err = time.Parse("2006-01-02", input.Date)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format"})
		}
	} else {
		parsedDate = income.Data
	}

	updates := map[string]interface{}{
		"Aprasymas": input.Name,
		"Suma":      input.Amount,
		"Data":      parsedDate,
		"Valiuta":   input.Currency,
	}

	if err := initializers.DB.Model(&income).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Could not update income",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Income updated successfully",
		"income":  income,
	})
}
