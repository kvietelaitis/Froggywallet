package models

import (
	"gorm.io/gorm"
)

type Sektorius struct {
	gorm.Model
	ID          uint   `gorm:"primaryKey"`
	NarysID     uint   `gorm:"not null"`
	Pavadinimas string `gorm:"not null"` // Name

	// Relationships
	Narys        Narys         `gorm:"foreignKey:NarysID"`
	Investicijos []Investicija `gorm:"foreignKey:SektoriusID"`
}
