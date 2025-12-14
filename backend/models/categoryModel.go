package models

import (
	"gorm.io/gorm"
)

// Kategorija (Category for expenses)
type Kategorija struct {
	gorm.Model
	ID          uint   `gorm:"primaryKey"`
	Pavadinimas string `gorm:"not null"` // Name

	// Relationships
	Islaidos []Islaida `gorm:"foreignKey:KategorijaID"`
	Ribos    []Riba    `gorm:"foreignKey:KategorijaID"`
}
