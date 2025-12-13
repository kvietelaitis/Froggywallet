package controllers

import (
	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Vardas          string `json:"vardas"`
	Pavarde         string `json:"pavarde"`
	ElPastas        string `json:"el_pastas"`
	Slaptazodis     string `json:"slaptazodis"`
	VartotojoVardas string `json:"vartotojo_vardas"`
}

type Verify2FARequest struct {
	UserID uint   `json:"userId"`
	Code   string `json:"code"`
}

type Login2FARequest struct {
	UserID uint   `json:"userId"`
	Code   string `json:"code"`
}

func Login(c *fiber.Ctx) error {
	var body LoginRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	var user models.Narys

	if err := initializers.DB.Where("el_pastas = ?", body.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid email or password",
		})
	}

	// Compare password (you'll need to hash passwords when creating users)
	if err := bcrypt.CompareHashAndPassword([]byte(user.Slaptazodis), []byte(body.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid credentials",
		})
	}

	if user.TwoFactorEnabled {
		return c.JSON(fiber.Map{
			"status": "2fa_required",
			"data": fiber.Map{
				"userId": user.ID,
			},
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Login successful",
		"data": fiber.Map{
			"id":      user.ID,
			"email":   user.ElPastas,
			"vardas":  user.Vardas,
			"pavarde": user.Pavarde,
		},
	})
}

func Register(c *fiber.Ctx) error {
	var body RegisterRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot parse JSON",
		})
	}

	var existing models.Narys
	if err := initializers.DB.Where("el_pastas = ?", body.ElPastas).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "El. paštas jau naudojamas.",
		})
	}

	if err := initializers.DB.Where("vartotojo_vardas = ?", body.VartotojoVardas).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Vartotojo vardas jau naudojamas.",
		})
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(body.Slaptazodis), 10)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko užregistruoti vartotojo",
		})
	}

	user := models.Narys{
		Vardas:          body.Vardas,
		Pavarde:         body.Pavarde,
		ElPastas:        body.ElPastas,
		Slaptazodis:     string(hashed),
		VartotojoVardas: body.VartotojoVardas,
	}

	if err := initializers.DB.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko sukurti vartotojo",
		})
	}

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Froggywallet",
		AccountName: user.ElPastas,
	})

	var qrUrl, secret string
	if err == nil {
		user.TwoFactorSecret = key.Secret()
		initializers.DB.Save(&user)

		qrUrl = key.URL()
		secret = key.Secret()
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "User registered successfully",
		"data": fiber.Map{
			"id":      user.ID,
			"email":   user.ElPastas,
			"vardas":  user.Vardas,
			"pavarde": user.Pavarde,
			"qr_url":  qrUrl,
			"secret":  secret,
		},
	})
}

func Generate2FA(c *fiber.Ctx) error {
	var user models.Narys

	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "Froggywallet",
		AccountName: user.ElPastas,
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"status":  "error",
			"message": "Could not generate 2FA key",
			"error":   err.Error(),
		})
	}

	user.TwoFactorSecret = key.Secret()
	initializers.DB.Save(&user)

	return c.JSON(fiber.Map{
		"status": "success",
		"secret": key.Secret(),
		"qr_url": key.URL(),
	})
}

func Verify2FA(c *fiber.Ctx) error {
	var body Verify2FARequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status": "error",
			"error":  "Invalid body",
		})
	}

	var user models.Narys

	if err := initializers.DB.First(&user, body.UserID).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status": "error",
			"error":  "User not found",
		})
	}

	valid := totp.Validate(body.Code, user.TwoFactorSecret)

	if !valid {
		return c.Status(400).JSON(fiber.Map{
			"status": "error",
			"error":  "Invalid Code",
		})
	}

	user.TwoFactorEnabled = true
	initializers.DB.Save(&user)

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "2FA Enabled successfully",
	})
}

func Login2FA(c *fiber.Ctx) error {
	var body Login2FARequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"status": "error",
			"error":  "Invalid body",
		})
	}

	var user models.Narys

	if err := initializers.DB.First(&user, body.UserID).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status": "error",
			"error":  "User not found",
		})
	}

	valid := totp.Validate(body.Code, user.TwoFactorSecret)

	if !valid {
		return c.Status(400).JSON(fiber.Map{
			"status": "error",
			"error":  "Invalid Code",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Login successful",
		"data": fiber.Map{
			"id":      user.ID,
			"email":   user.ElPastas,
			"vardas":  user.Vardas,
			"pavarde": user.Pavarde,
		},
	})
}
