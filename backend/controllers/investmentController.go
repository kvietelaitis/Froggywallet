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
	NarysID      uint    `json:"narys_id"`
}

/* =======================
   INVESTMENT CONTROLLERS
======================= */

func CreateInvestment(c *fiber.Ctx) error {
    var body CreateInvestmentRequest

    if err := c.BodyParser(&body); err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Neteisingi duomenys"})
    }

    if body.Pavadinimas == "" || body.Kiekis <= 0 || body.PirkimoKaina <= 0 || body.PirkimoData == "" || body.SektoriusID == 0 {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Prašome užpildyti visus laukus"})
    }

    purchaseDate, err := time.Parse("2006-01-02", body.PirkimoData)
    if err != nil {
        return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Neteisingas datos formatas"})
    }

	userID, ok := c.Locals("userID").(uint)

	investment := models.Investicija{
		Pavadinimas:  body.Pavadinimas,
		Kiekis:       body.Kiekis,
		PirkimoKaina: body.PirkimoKaina,
		PirkimoData:  purchaseDate,
		SektoriusID:  body.SektoriusID,
		NarysID: func() *uint {
			if ok && userID != 0 {
				return &userID
			}
			return nil
		}(),
	}

    if err := initializers.DB.Create(&investment).Error; err != nil {
        return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Nepavyko sukurti investicijos"})
    }

    return c.Status(fiber.StatusCreated).JSON(fiber.Map{
        "status":  "success",
        "message": "Investicija sukurta sėkmingai",
        "data":    investment,
    })
}


// GetInvestments – get only investments of the logged-in user
func GetInvestments(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uint)
	var investments []models.Investicija

	if err := initializers.DB.Preload("SektoriusObj").
		Where("narys_id = ?", userID).Find(&investments).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko gauti investicijų",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   investments,
	})
}


// DeleteInvestment – pašalinti investicija
func DeleteInvestment(c *fiber.Ctx) error {
	id := c.Params("id")
	var investment models.Investicija

	if err := initializers.DB.First(&investment, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "investicija nerasta",
		})
	}

	if err := initializers.DB.Delete(&investment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko pašalinti investicijos",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Investicija pašalinta sėkmingai",
	})
}

func GetSektoriai(c *fiber.Ctx) error {
	var sektoriai []models.Sektorius
	if err := initializers.DB.Find(&sektoriai).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status": "error",
			"error":  err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   sektoriai,
	})
}