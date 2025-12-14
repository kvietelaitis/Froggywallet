package controllers

import (
	"time"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

type CreateInvestmentRequest struct {
	Pavadinimas  string  `json:"pavadinimas"`
	Kiekis       int     `json:"kiekis"`
	PirkimoKaina float64 `json:"pirkimo_kaina"`
	PirkimoData  string  `json:"pirkimo_data"`
	SektoriusID  uint    `json:"sektorius_id"`
}

type UpdateInvestmentRequest struct {
	Pavadinimas  string  `json:"pavadinimas"`
	Kiekis       int     `json:"kiekis"`
	PirkimoKaina float64 `json:"pirkimo_kaina"`
	PirkimoData  string  `json:"pirkimo_data"`
	SektoriusID  uint    `json:"sektorius_id"`
}

func GetInvestments(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)

	var investments []models.Investicija
	if err := initializers.DB.Preload("SektoriusObj").Where("narys_id = ?", userID).Order("created_at DESC").Find(&investments).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Nepavyko gauti investicijų"})
	}

	return c.JSON(fiber.Map{"status": "success", "data": investments})
}

func GetInvestment(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	id := c.Params("id")

	var investment models.Investicija
	if err := initializers.DB.Preload("SektoriusObj").Where("id = ? AND narys_id = ?", id, userID).First(&investment).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Investicija nerasta"})
	}

	return c.JSON(fiber.Map{"status": "success", "data": investment})
}

func CreateInvestment(c *fiber.Ctx) error {
	var body CreateInvestmentRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Neteisingi duomenys"})
	}

	var sector models.Sektorius
	if err := initializers.DB.First(&sector, body.SektoriusID).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Pasirinktas sektorius neegzistuoja"})
	}

	purchaseDate, err := time.Parse("2006-01-02", body.PirkimoData)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Neteisingas datos formatas"})
	}

	userID := c.Locals("userID").(uint)
	investment := models.Investicija{
		NarysID:      userID,
		Pavadinimas:  body.Pavadinimas,
		Kiekis:       body.Kiekis,
		PirkimoKaina: body.PirkimoKaina,
		PirkimoData:  purchaseDate,
		SektoriusID:  body.SektoriusID,
	}

	if err := initializers.DB.Create(&investment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Nepavyko sukurti investicijos"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"status": "success", "message": "Investicija sukurta sėkmingai", "data": investment})
}

func UpdateInvestment(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	id := c.Params("id")

	var investment models.Investicija
	if err := initializers.DB.Where("id = ? AND narys_id = ?", id, userID).First(&investment).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Investicija nerasta"})
	}

	var body UpdateInvestmentRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Neteisingi duomenys"})
	}

	purchaseDate, err := time.Parse("2006-01-02", body.PirkimoData)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Neteisingas datos formatas"})
	}

	investment.Pavadinimas = body.Pavadinimas
	investment.Kiekis = body.Kiekis
	investment.PirkimoKaina = body.PirkimoKaina
	investment.PirkimoData = purchaseDate
	investment.SektoriusID = body.SektoriusID

	if err := initializers.DB.Save(&investment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Nepavyko atnaujinti investicijos"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "Investicija atnaujinta sėkmingai", "data": investment})
}

func DeleteInvestment(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	id := c.Params("id")

	var investment models.Investicija
	if err := initializers.DB.Where("id = ? AND narys_id = ?", id, userID).First(&investment).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Investicija nerasta"})
	}

	if err := initializers.DB.Delete(&investment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Nepavyko pašalinti investicijos"})
	}

	return c.JSON(fiber.Map{"status": "success", "message": "Investicija pašalinta sėkmingai"})
}

func GetSektoriai(c *fiber.Ctx) error {
	var sektoriai []models.Sektorius
	if err := initializers.DB.Order("id ASC").Find(&sektoriai).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Nepavyko gauti sektorių"})
	}
	return c.JSON(fiber.Map{"status": "success", "data": sektoriai})
}
