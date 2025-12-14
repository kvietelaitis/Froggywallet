package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth(c *fiber.Ctx) error {
	auth := c.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		auth = strings.TrimPrefix(auth, "Bearer ")
	} else {
		auth = c.Cookies("access_token")
	}

	if auth == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}

	token, err := jwt.Parse(auth, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
	}

	claims := token.Claims.(jwt.MapClaims)

	c.Locals("userID", uint(claims["sub"].(float64)))

	return c.Next()
}
