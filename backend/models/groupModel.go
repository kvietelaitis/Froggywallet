package models

import (
	"time"

	"gorm.io/gorm"
)

type Grupe struct {
	gorm.Model
	ID                 uint      `gorm:"primaryKey"`
	Pavadinimas        string    `gorm:"not null"`                  // Name
	SukurimoData       time.Time `gorm:"default:CURRENT_TIMESTAMP"` // Created date
	Aprasymas          string    // Description
	PiktogramosNuoroda string    // Icon/Picture URL

	// Relationships
	Nariai      []Narys       `gorm:"foreignKey:GrupeID"`
	Pakvietimai []Pakvietimas `gorm:"foreignKey:GrupeID"`
	Biudzetai   []Biudzetas   `gorm:"foreignKey:GrupeID"`
}
