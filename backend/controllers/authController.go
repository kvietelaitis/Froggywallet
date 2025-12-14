package controllers

import (
	"os"
	"time"

	"github.com/KvietelaitisMartynas/froggywallet/backend/helpers"
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
	FirstName string `json:"vardas"`
	LastName  string `json:"pavarde"`
	Email     string `json:"el_pastas"`
	Password  string `json:"slaptazodis"`
	Username  string `json:"vartotojo_vardas"`
}

type UserDTO struct {
	ID        uint   `json:"id"`
	Email     string `json:"el_pastas"`
	FirstName string `json:"vardas"`
	LastName  string `json:"pavarde"`
	Username  string `json:"vartotojo_vardas"`
}

type Verify2FARequest struct {
	UserID uint   `json:"userId"`
	Code   string `json:"code"`
}

type Login2FARequest struct {
	UserID uint   `json:"userId"`
	Code   string `json:"code"`
}

func toDTO(u models.Narys) UserDTO {
	return UserDTO{
		ID:        u.ID,
		Email:     u.ElPastas,
		FirstName: u.Vardas,
		LastName:  u.Pavarde,
		Username:  u.VartotojoVardas,
	}
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

	if err := bcrypt.CompareHashAndPassword([]byte(user.Slaptazodis), []byte(body.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{
			"status":  "error",
			"message": "Invalid credentials",
		})
	}

	return c.JSON(fiber.Map{
		"status": "2fa_required",
		"data": fiber.Map{
			"userId": user.ID,
		},
	})
}

func Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    "",
		HTTPOnly: true,
		Secure:   os.Getenv("ENV") == "production",
		SameSite: "Lax",
		Expires:  time.Now().Add(-1 * time.Hour),
	})

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Logged Out",
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
	if err := initializers.DB.Where("el_pastas = ?", body.Email).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "El. paštas jau naudojamas.",
		})
	}

	if err := initializers.DB.Where("vartotojo_vardas = ?", body.Username).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Vartotojo vardas jau naudojamas.",
		})
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko užregistruoti vartotojo",
		})
	}

	tx := initializers.DB.Begin()
	if tx.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko sukurti vartotojo",
		})
	}

	user := models.Narys{
		Vardas:          body.FirstName,
		Pavarde:         body.LastName,
		ElPastas:        body.Email,
		Slaptazodis:     string(hashed),
		VartotojoVardas: body.Username,
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko sukurti vartotojo",
		})
	}

	// Check for pending invites
	var invites []models.Pakvietimas
	if err := tx.Where("el_pastas = ? AND busena = ?", user.ElPastas, models.BusenaLaukiamas).
		Find(&invites).Error; err == nil && len(invites) > 0 {

		// Assign user to the first invited group
		for _, inv := range invites {
			if inv.GrupeID != nil {
				user.GrupeID = inv.GrupeID
				break
			}
		}

		// Mark all invites as accepted
		for i := range invites {
			invites[i].PakvietePriimeID = &user.ID
			invites[i].Busena = models.BusenaPatvirtintas
			if err := tx.Save(&invites[i]).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"error": "failed to process invite"})
			}
		}

		// Assign role based on whether user joined via invite
		var role models.Role
		if user.GrupeID != nil {
			// Invited user gets Member role
			if err := tx.FirstOrCreate(&role, models.Role{RolesPavadinimas: "Member"}).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"error": "failed to create role"})
			}
		} else {
			// No valid group in invites, create personal group
			group := models.Grupe{Pavadinimas: "Personal - " + user.VartotojoVardas}
			if err := tx.Create(&group).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"error": "failed to create group"})
			}
			user.GrupeID = &group.ID

			if err := tx.FirstOrCreate(&role, models.Role{RolesPavadinimas: "Admin"}).Error; err != nil {
				tx.Rollback()
				return c.Status(500).JSON(fiber.Map{"error": "failed to create role"})
			}
		}

		user.RoleID = &role.ID
		if err := tx.Save(&user).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "failed to save user"})
		}

	} else {
		// No invites: create personal group and admin role
		group := models.Grupe{Pavadinimas: "Personal - " + user.VartotojoVardas}
		if err := tx.Create(&group).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "failed to create group"})
		}

		role := models.Role{}
		if err := tx.FirstOrCreate(&role, models.Role{RolesPavadinimas: "Admin"}).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "failed to create role"})
		}

		user.GrupeID = &group.ID
		user.RoleID = &role.ID
		if err := tx.Save(&user).Error; err != nil {
			tx.Rollback()
			return c.Status(500).JSON(fiber.Map{"error": "failed to save user"})
		}
	}

	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko užbaigti registracijos",
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

	env := os.Getenv("ENV")
	if env == "" {
		env = os.Getenv("ENVIRONMENT")
	}
	allowAny := env != "prod" && os.Getenv("ALLOW_ANY_2FA") == "true"

	var valid bool
	if allowAny {
		valid = true
	} else {
		valid = totp.Validate(body.Code, user.TwoFactorSecret)
	}

	if !valid {
		return c.Status(400).JSON(fiber.Map{
			"status": "error",
			"error":  "Invalid Code",
		})
	}

	token, err := helpers.CreateToken(user.ID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create token"})
	}

	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    token,
		HTTPOnly: true,
		Secure:   os.Getenv("ENV") == "production",
		SameSite: "Lax",
		Expires:  time.Now().Add(24 * time.Hour),
	})

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Login successful",
		"data":    toDTO(user),
	})
}

func Me(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	var user models.Narys
	if err := initializers.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   toDTO(user),
	})
}
