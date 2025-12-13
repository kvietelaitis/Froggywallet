package controllers

import (
	"time"

	"github.com/KvietelaitisMartynas/froggywallet/backend/initializers"
	"github.com/KvietelaitisMartynas/froggywallet/backend/models"
	"github.com/gofiber/fiber/v2"
)

// Request structs
type CreateLoanRequest struct {
	VisaSkola      float64 `json:"visa_skola"`
	MokejimoKiekis float64 `json:"mokejimo_kiekis"`
	KitasMokejimas string  `json:"kitas_mokejimas"`
	Pajamos        float64 `json:"pajamos"` // Palūkanos
	NarysID        uint    `json:"narys_id"`
}

type UpdateLoanRequest struct {
	VisaSkola      float64 `json:"visa_skola"`
	MokejimoKiekis float64 `json:"mokejimo_kiekis"`
	KitasMokejimas string  `json:"kitas_mokejimas"`
	Pajamos        float64 `json:"pajamos"`
}

type PayLoanRequest struct {
	Suma float64 `json:"suma"`
}

type CreateDebtorRequest struct {
	PaskolaID   uint   `json:"paskola_id"`
	Pavadinimas string `json:"pavadinimas"`
	ElPastas    string `json:"el_pastas"`
	TelNr       string `json:"tel_nr"`
}

type UpdateDebtorRequest struct {
	Pavadinimas string `json:"pavadinimas"`
	ElPastas    string `json:"el_pastas"`
	TelNr       string `json:"tel_nr"`
}

// Loan Controllers

// GetLoans - gauti visas paskolas
func GetLoans(c *fiber.Ctx) error {
	var loans []models.Paskola

	if err := initializers.DB.Preload("Skolininkai").Find(&loans).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko gauti paskolų",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   loans,
	})
}

// GetLoan - gauti vieną paskolą
func GetLoan(c *fiber.Ctx) error {
	id := c.Params("id")
	var loan models.Paskola

	if err := initializers.DB.Preload("Skolininkai").First(&loan, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Paskola nerasta",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   loan,
	})
}

// CreateLoan - sukurti naują paskolą
func CreateLoan(c *fiber.Ctx) error {
	var body CreateLoanRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingi duomenys",
		})
	}

	kitasMokejimas, err := time.Parse("2006-01-02", body.KitasMokejimas)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingas datos formatas",
		})
	}

	loan := models.Paskola{
		VisaSkolaDouble:     body.VisaSkola,
		MokejimoKiekis:      body.MokejimoKiekis,
		KitasMokejimas:      kitasMokejimas,
		PaskutinisMokejimas: time.Time{},
		Pajamos:             body.Pajamos,
	}

	if err := initializers.DB.Create(&loan).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko sukurti paskolos",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"status":  "success",
		"message": "Paskola sukurta sėkmingai",
		"data":    loan,
	})
}

// UpdateLoan - atnaujinti paskolą
func UpdateLoan(c *fiber.Ctx) error {
	id := c.Params("id")
	var loan models.Paskola

	if err := initializers.DB.First(&loan, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Paskola nerasta",
		})
	}

	var body UpdateLoanRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingi duomenys",
		})
	}

	kitasMokejimas, err := time.Parse("2006-01-02", body.KitasMokejimas)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingas datos formatas",
		})
	}

	loan.VisaSkolaDouble = body.VisaSkola
	loan.MokejimoKiekis = body.MokejimoKiekis
	loan.KitasMokejimas = kitasMokejimas
	loan.Pajamos = body.Pajamos

	if err := initializers.DB.Save(&loan).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko atnaujinti paskolos",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Paskola atnaujinta sėkmingai",
		"data":    loan,
	})
}

// DeleteLoan - pašalinti paskolą
func DeleteLoan(c *fiber.Ctx) error {
	id := c.Params("id")
	var loan models.Paskola

	if err := initializers.DB.First(&loan, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Paskola nerasta",
		})
	}

	// Pirmiausia pašaliname susijusius skolininkus
	if err := initializers.DB.Where("paskola_id = ?", id).Delete(&models.Skolininkas{}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko pašalinti skolininkų",
		})
	}

	if err := initializers.DB.Delete(&loan).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko pašalinti paskolos",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Paskola pašalinta sėkmingai",
	})
}

// PayLoan - apmokėti paskolą
func PayLoan(c *fiber.Ctx) error {
	id := c.Params("id")
	var loan models.Paskola

	if err := initializers.DB.First(&loan, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Paskola nerasta",
		})
	}

	var body PayLoanRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingi duomenys",
		})
	}

	if body.Suma <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Mokėjimo suma turi būti teigiama",
		})
	}

	if body.Suma > loan.VisaSkolaDouble {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Mokėjimo suma viršija likusią skolą",
		})
	}

	loan.VisaSkolaDouble -= body.Suma
	loan.PaskutinisMokejimas = time.Now()

	// Apskaičiuojame kitą mokėjimą (pridedame mėnesį)
	loan.KitasMokejimas = time.Now().AddDate(0, 1, 0)

	if err := initializers.DB.Save(&loan).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko atnaujinti paskolos",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Mokėjimas atliktas sėkmingai",
		"data":    loan,
	})
}

// CalculateMonthlyPayment - apskaičiuoti mėnesinę įmoką
func CalculateMonthlyPayment(c *fiber.Ctx) error {
	id := c.Params("id")
	var loan models.Paskola

	if err := initializers.DB.First(&loan, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Paskola nerasta",
		})
	}

	// Jei palūkanos yra 0, paprastas dalijimas
	menesiai := c.QueryInt("menesiai", 12)
	if menesiai <= 0 {
		menesiai = 12
	}

	var menesineImoka float64
	if loan.Pajamos == 0 {
		menesineImoka = loan.VisaSkolaDouble / float64(menesiai)
	} else {
		// Anuiteto formulė: M = P * [r(1+r)^n] / [(1+r)^n - 1]
		// kur P = paskolos suma, r = mėnesinė palūkanų norma, n = mokėjimų skaičius
		menesinesPalukanos := loan.Pajamos / 100 / 12
		daug := 1.0
		for i := 0; i < menesiai; i++ {
			daug *= (1 + menesinesPalukanos)
		}
		menesineImoka = loan.VisaSkolaDouble * (menesinesPalukanos * daug) / (daug - 1)
	}

	visaMokama := menesineImoka * float64(menesiai)
	palukanuSuma := visaMokama - loan.VisaSkolaDouble

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"menesine_imoka":   menesineImoka,
			"menesiai":         menesiai,
			"visa_mokama_suma": visaMokama,
			"palukanu_suma":    palukanuSuma,
			"likusi_skola":     loan.VisaSkolaDouble,
		},
	})
}

// GetUpcomingPayments - gauti artėjančius mokėjimus
func GetUpcomingPayments(c *fiber.Ctx) error {
	days := c.QueryInt("days", 7)
	var loans []models.Paskola

	now := time.Now()
	futureDate := now.AddDate(0, 0, days)

	if err := initializers.DB.Where("kitas_mokejimas BETWEEN ? AND ?", now, futureDate).Find(&loans).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko gauti paskolų",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   loans,
	})
}

// Debtor Controllers

// GetDebtors - gauti visus skolininkus
func GetDebtors(c *fiber.Ctx) error {
	var debtors []models.Skolininkas

	if err := initializers.DB.Preload("Paskola").Find(&debtors).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko gauti skolininkų",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   debtors,
	})
}

// GetDebtorsByLoan - gauti skolininkus pagal paskolą
func GetDebtorsByLoan(c *fiber.Ctx) error {
	loanID := c.Params("loanId")
	var debtors []models.Skolininkas

	if err := initializers.DB.Where("paskola_id = ?", loanID).Find(&debtors).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko gauti skolininkų",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   debtors,
	})
}

// CreateDebtor - sukurti naują skolininką
func CreateDebtor(c *fiber.Ctx) error {
	var body CreateDebtorRequest

	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingi duomenys",
		})
	}

	// Patikriname ar paskola egzistuoja
	var loan models.Paskola
	if err := initializers.DB.First(&loan, body.PaskolaID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Paskola nerasta",
		})
	}

	debtor := models.Skolininkas{
		PaskolaID:   body.PaskolaID,
		Pavadinimas: body.Pavadinimas,
		ElPastas:    body.ElPastas,
		TelNr:       body.TelNr,
	}

	if err := initializers.DB.Create(&debtor).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko sukurti skolininko",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"status":  "success",
		"message": "Skolininkas sukurtas sėkmingai",
		"data":    debtor,
	})
}

// UpdateDebtor - atnaujinti skolininką
func UpdateDebtor(c *fiber.Ctx) error {
	id := c.Params("id")
	var debtor models.Skolininkas

	if err := initializers.DB.First(&debtor, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Skolininkas nerastas",
		})
	}

	var body UpdateDebtorRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Neteisingi duomenys",
		})
	}

	debtor.Pavadinimas = body.Pavadinimas
	debtor.ElPastas = body.ElPastas
	debtor.TelNr = body.TelNr

	if err := initializers.DB.Save(&debtor).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko atnaujinti skolininko",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Skolininkas atnaujintas sėkmingai",
		"data":    debtor,
	})
}

// DeleteDebtor - pašalinti skolininką
func DeleteDebtor(c *fiber.Ctx) error {
	id := c.Params("id")
	var debtor models.Skolininkas

	if err := initializers.DB.First(&debtor, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Skolininkas nerastas",
		})
	}

	if err := initializers.DB.Delete(&debtor).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko pašalinti skolininko",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "Skolininkas pašalintas sėkmingai",
	})
}

// FilterDebtors - filtruoti skolininkus
func FilterDebtors(c *fiber.Ctx) error {
	name := c.Query("pavadinimas")
	email := c.Query("el_pastas")
	phone := c.Query("tel_nr")
	loanID := c.Query("paskola_id")

	query := initializers.DB.Preload("Paskola")

	if name != "" {
		query = query.Where("pavadinimas ILIKE ?", "%"+name+"%")
	}
	if email != "" {
		query = query.Where("el_pastas ILIKE ?", "%"+email+"%")
	}
	if phone != "" {
		query = query.Where("tel_nr ILIKE ?", "%"+phone+"%")
	}
	if loanID != "" {
		query = query.Where("paskola_id = ?", loanID)
	}

	var debtors []models.Skolininkas
	if err := query.Find(&debtors).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Nepavyko gauti skolininkų",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   debtors,
	})
}
