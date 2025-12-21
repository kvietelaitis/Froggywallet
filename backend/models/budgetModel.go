package models

import (
	"time"

	"gorm.io/gorm"
)

// Biudzetas (Budget)

type Biudzetas struct {
	gorm.Model
	ID                  uint      `gorm:"primaryKey"`
	GrupeID             *uint     // Optional group ID
	Pavadinimas         string    `gorm:"not null"`                  // Name
	LaikotarpioPradzia  time.Time `gorm:"not null"`                  // Period start
	LaikotarpioPabaiga  time.Time `gorm:"not null"`                  // Period end
	PlanuojamosPajamos  float64   `gorm:"default:0"`                 // Planned income
	PlanuojamosIslaidos float64   `gorm:"default:0"`                 // Planned expenses
	SukurimoData        time.Time `gorm:"default:CURRENT_TIMESTAMP"` // Created date
	Statusas            string    // Status

	// Relationships
	Grupe *Grupe `gorm:"foreignKey:GrupeID"`
	Ribos []Riba `gorm:"foreignKey:BiudzetasID"`
}
