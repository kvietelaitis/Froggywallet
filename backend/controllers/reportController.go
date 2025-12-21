package controllers

import (
	"fmt"
	"strconv"
	"time"

	"github.com/KvietelaitisMartynas/froggywallet/backend/helpers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

type ReportRequest struct {
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

func getUserIDFromLocals(c *fiber.Ctx) uint {
	var userID uint
	if uid := c.Locals("userID"); uid != nil {
		switch v := uid.(type) {
		case uint:
			userID = v
		case int:
			userID = uint(v)
		case float64:
			userID = uint(v)
		case string:
			if id64, err := strconv.ParseUint(v, 10, 64); err == nil {
				userID = uint(id64)
			}
		}
	}
	if userID == 0 {
		if u := c.Locals("user"); u != nil {
			switch v := u.(type) {
			case *models.Narys:
				userID = v.ID
			case models.Narys:
				userID = v.ID
			}
		}
	}
	return userID
}

// GET /api/reports/group/:groupId?start=YYYY-MM-DD&end=YYYY-MM-DD
// also accepts POST with JSON { "start_date": "...", "end_date": "..." }
func GenerateGroupReport(c *fiber.Ctx) error {
	groupParam := c.Params("groupId")
	if groupParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing Group ID"})
	}
	gid64, err := strconv.ParseUint(groupParam, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid Group ID"})
	}
	groupID := uint(gid64)

	// read dates: prefer query params, fallback to body JSON
	startStr := c.Query("start")
	endStr := c.Query("end")

	if startStr == "" && endStr == "" {
		var req ReportRequest
		_ = c.BodyParser(&req) // ignore error, fields may be empty
		startStr = req.StartDate
		endStr = req.EndDate
	}

	var start, end time.Time
	if startStr != "" {
		if t, err := time.Parse("2006-01-02", startStr); err == nil {
			start = t
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid start date format"})
		}
	}
	if endStr != "" {
		if t, err := time.Parse("2006-01-02", endStr); err == nil {
			end = t
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid end date format"})
		}
	}
	if start.IsZero() || end.IsZero() {
		now := time.Now()
		start = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
		end = now
	}

	// validate group exists
	var group models.Grupe
	if err := initializers.DB.First(&group, groupID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "group not found"})
	}

	// get requesting user (to include in report)
	userID := getUserIDFromLocals(c)
	if userID == 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized"})
	}
	var user models.Narys
	if err := initializers.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	}

	// fetch incomes for group in range
	var incomes []models.Pajama
	if err := initializers.DB.Where("grupe_id = ? AND data BETWEEN ? AND ?", groupID, start, end).Find(&incomes).Error; err != nil {
		// fallback: incomes linked to budgets of the group
		var budgetIds []uint
		if pErr := initializers.DB.Model(&models.Biudzetas{}).Where("grupe_id = ?", groupID).Pluck("id", &budgetIds).Error; pErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not query budgets"})
		}
		if len(budgetIds) == 0 {
			incomes = []models.Pajama{}
		} else {
			if pErr := initializers.DB.Where("biudzetas_id IN ? AND data BETWEEN ? AND ?", budgetIds, start, end).Find(&incomes).Error; pErr != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not fetch incomes"})
			}
		}
	}

	// fetch expenses for group in range (expense table uses group_id)
	var expenses []models.Islaida
	if err := initializers.DB.Where("group_id = ? AND data BETWEEN ? AND ?", groupID, start, end).Find(&expenses).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not fetch expenses"})
	}

	// build pdf data
	pdfData := helpers.PDFData{
		User: helpers.PDFUser{
			FirstName: user.Vardas,
			LastName:  user.Pavarde,
			Email:     user.ElPastas,
			Username:  user.VartotojoVardas,
		},
		Group: helpers.PDFGroup{
			ID:          group.ID,
			Name:        group.Pavadinimas,
			Description: group.Aprasymas,
			CreatedAt:   group.SukurimoData.Format("2006-01-02"),
		},
		ReportDate: time.Now().Format("2006-01-02"),
	}

	for _, inc := range incomes {
		pdfData.Incomes = append(pdfData.Incomes, helpers.PDFIncome{
			Amount:      inc.Suma,
			Date:        inc.Data.Format("2006-01-02"),
			Description: inc.Aprasymas,
			Currency:    inc.Valiuta,
		})
	}
	for _, ex := range expenses {
		pdfData.Expenses = append(pdfData.Expenses, helpers.PDFExpense{
			Amount:  ex.Suma,
			Date:    ex.Data.Format("2006-01-02"),
			Name:    ex.Pavadinimas,
			Comment: ex.Komentaras,
			GroupID: ex.GroupID,
		})
	}

	pdfURL, err := helpers.GeneratePDF(pdfData)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": fmt.Sprintf("generate pdf: %v", err)})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"pdf_url": pdfURL})
}
