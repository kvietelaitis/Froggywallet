package controllers

import (
	"time"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

/* =======================
   REQUEST STRUCTS
======================= */

type CreateExpenseRequest struct {
	Pavadinimas        string  `json:"pavadinimas"`
	Suma               float64 `json:"suma"`
	Data               string  `json:"data"`
	MokejimoBudas      string  `json:"mokejimo_budas"`
	Komentaras         string  `json:"komentaras"`
	KategorijaID       *uint   `json:"kategorija_id"`
	PasikartojimoTipas string  `json:"pasikartojimo_tipas"`
	GroupID            *uint   `json:"group_id"`
}

type UpdateExpenseRequest struct {
	Pavadinimas        string  `json:"pavadinimas"`
	Suma               float64 `json:"suma"`
	Data               string  `json:"data"`
	MokejimoBudas      string  `json:"mokejimo_budas"`
	Komentaras         string  `json:"komentaras"`
	KategorijaID       *uint   `json:"kategorija_id"`
	PasikartojimoTipas string  `json:"pasikartojimo_tipas"`
	GroupID            *uint   `json:"group_id"`
}

/* =======================
   EXPENSE CONTROLLERS
======================= */

// GetExpenses – gauti visas išlaidas
func GetExpenses(c *fiber.Ctx) error {
	groupID := c.Query("group_id")

	// Match groupController pattern: use "userID" key and cast to uint
	userLoc := c.Locals("userID")
	var userID uint
	if userLoc != nil {
		userID = userLoc.(uint)
	}

	var expenses []models.Islaida

	query := initializers.DB.
		Preload("Kategorija").
		Order("created_at DESC")

	if groupID != "" {
		query = query.Where("group_id = ?", groupID)
	} else if userID != 0 {
		query = query.Where("narys_id = ?", userID) // Filter by user if no group
	} else {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	if err := query.Find(&expenses).Error; err != nil {

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko gauti išlaidų",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   expenses,
	})
}

// GetExpense – gauti vieną išlaidą
func GetExpense(c *fiber.Ctx) error {
	id := c.Params("id")
	var expense models.Islaida

	if err := initializers.DB.
		Preload("Kategorija").
		First(&expense, id).Error; err != nil {

		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Išlaida nerasta",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   expense,
	})
}

// CreateExpense – sukurti naują išlaidą
func CreateExpense(c *fiber.Ctx) error {
	var body CreateExpenseRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingi duomenys",
		})
	}

	// Match groupController pattern: use "userID" key and cast to uint
	userLoc := c.Locals("userID")
	if userLoc == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	expenseDate, err := time.Parse("2006-01-02", body.Data)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingas datos formatas",
		})
	}

	expense := models.Islaida{
		Pavadinimas:        body.Pavadinimas,
		Suma:               body.Suma,
		Data:               expenseDate,
		MokejimoBudas:      body.MokejimoBudas,
		Komentaras:         body.Komentaras,
		KategorijaID:       body.KategorijaID,
		PasikartojimoTipas: body.PasikartojimoTipas,
		GroupID:            body.GroupID,
	}

	if err := initializers.DB.Create(&expense).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko sukurti išlaidos",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"status":  "success",
		"message": "Išlaida sukurta sėkmingai",
		"data":    expense,
	})
}

// UpdateExpense – atnaujinti išlaidą
func UpdateExpense(c *fiber.Ctx) error {
	id := c.Params("id")
	var expense models.Islaida

	if err := initializers.DB.First(&expense, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Išlaida nerasta",
		})
	}

	var body UpdateExpenseRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingi duomenys",
		})
	}

	expenseDate, err := time.Parse("2006-01-02", body.Data)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingas datos formatas",
		})
	}

	expense.Pavadinimas = body.Pavadinimas
	expense.Suma = body.Suma
	expense.Data = expenseDate
	expense.MokejimoBudas = body.MokejimoBudas
	expense.Komentaras = body.Komentaras
	expense.KategorijaID = body.KategorijaID
	expense.PasikartojimoTipas = body.PasikartojimoTipas
	expense.GroupID = body.GroupID

	if err := initializers.DB.Save(&expense).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko atnaujinti išlaidos",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Išlaida atnaujinta sėkmingai",
		"data":    expense,
	})
}

// DeleteExpense – pašalinti išlaidą
func DeleteExpense(c *fiber.Ctx) error {
	id := c.Params("id")
	var expense models.Islaida

	if err := initializers.DB.First(&expense, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Išlaida nerasta",
		})
	}

	if err := initializers.DB.Delete(&expense).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko pašalinti išlaidos",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Išlaida pašalinta sėkmingai",
	})
}
