package controllers

import (
	"strconv"
	"time"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

type IncomeInput struct {
	Name        string  `json:"name"`
	Amount      float64 `json:"amount"`
	Date        string  `json:"date"`
	Currency    string  `json:"currency"`
	GrupeID     *uint   `json:"grupe_id,omitempty"`
	BiudzetasID *uint   `json:"biudzetas_id,omitempty"`
}

// POST /api/incomes/create-income
func CreateIncome(c *fiber.Ctx) error {
	var input IncomeInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}
	parsedDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format"})
	}

	// require group either directly or derive from budget
	var grupezPointer *uint
	if input.GrupeID != nil {
		grupezPointer = input.GrupeID
	} else if input.BiudzetasID != nil {
		var b models.Biudzetas
		if err := initializers.DB.First(&b, *input.BiudzetasID).Error; err == nil && b.GrupeID != nil {
			grupezPointer = b.GrupeID
		}
	}
	if grupezPointer == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "GrupeID or BiudzetasID (with group) is required"})
	}

	income := models.Pajama{
		Aprasymas: input.Name,
		Suma:      input.Amount,
		Data:      parsedDate,
		Valiuta:   input.Currency,
		GrupeID:   grupezPointer,
	}

	if result := initializers.DB.Create(&income); result.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create income"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Income created successfully", "income": income})
}

// GET /api/incomes?grupe_id=...
func GetIncomes(c *fiber.Ctx) error {
	groupIDStr := c.Query("grupe_id")
	if groupIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing group id"})
	}
	gid64, err := strconv.ParseUint(groupIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid group id"})
	}
	groupID := uint(gid64)

	// Try direct GrupeID on Pajama first
	var incomes []models.Pajama
	if err := initializers.DB.Where("grupe_id = ?", groupID).Find(&incomes).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve incomes"})
	}
	if len(incomes) > 0 {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"incomes": incomes})
	}

	// Fallback: find budgets for the group and query by BiudzetasID
	var budgetIds []uint
	if err := initializers.DB.Model(&models.Biudzetas{}).Where("grupe_id = ?", groupID).Pluck("id", &budgetIds).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not query budgets"})
	}
	if len(budgetIds) == 0 {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"incomes": []models.Pajama{}})
	}
	if err := initializers.DB.Where("biudzetas_id IN ?", budgetIds).Find(&incomes).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not retrieve incomes"})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"incomes": incomes})
}

// GET /api/incomes/:id?grupe_id=...
func GetIncome(c *fiber.Ctx) error {
	idParam := c.Params("id")
	if idParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing income id"})
	}
	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid id parameter"})
	}
	id := uint(id64)

	groupIDStr := c.Query("grupe_id")
	if groupIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing group id"})
	}
	gid64, err := strconv.ParseUint(groupIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid group id"})
	}
	groupID := uint(gid64)

	var income models.Pajama
	if err := initializers.DB.First(&income, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Income not found"})
	}
	if income.GrupeID == nil || *income.GrupeID != groupID {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Income not found in this group"})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"income": income})
}

// PUT /api/incomes/:id?grupe_id=...
func UpdateIncome(c *fiber.Ctx) error {
	idParam := c.Params("id")
	if idParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing income id"})
	}
	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid id parameter"})
	}
	id := uint(id64)

	groupIDStr := c.Query("grupe_id")
	if groupIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing group id"})
	}
	gid64, err := strconv.ParseUint(groupIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid group id"})
	}
	groupID := uint(gid64)

	var income models.Pajama
	if err := initializers.DB.First(&income, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Income not found"})
	}
	if income.GrupeID == nil || *income.GrupeID != groupID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Income does not belong to this group"})
	}

	var input IncomeInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
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
	if input.BiudzetasID != nil {
		updates["BiudzetasID"] = input.BiudzetasID
		// optionally derive and update GrupeID from BiudzetasID
		var b models.Biudzetas
		if err := initializers.DB.First(&b, *input.BiudzetasID).Error; err == nil && b.GrupeID != nil {
			updates["GrupeID"] = b.GrupeID
		}
	}

	if err := initializers.DB.Model(&income).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not update income"})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Income updated successfully", "income": income})
}

// DELETE /api/incomes/:id?grupe_id=...
func DeleteIncome(c *fiber.Ctx) error {
	idParam := c.Params("id")
	if idParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing income id"})
	}
	id64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid id parameter"})
	}
	id := uint(id64)

	groupIDStr := c.Query("grupe_id")
	if groupIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing group id"})
	}
	gid64, err := strconv.ParseUint(groupIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid group id"})
	}
	groupID := uint(gid64)

	var income models.Pajama
	if err := initializers.DB.First(&income, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Income not found"})
	}
	if income.GrupeID == nil || *income.GrupeID != groupID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Income does not belong to this group"})
	}

	if err := initializers.DB.Delete(&income).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not delete income"})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Income deleted successfully"})
}
