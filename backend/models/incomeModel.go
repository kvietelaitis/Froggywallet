package models

import (
	"time"

	"gorm.io/gorm"
)

type Pajama struct {
	gorm.Model
	ID          uint      `gorm:"primaryKey"`
	NarysID     uint      `gorm:` // Add UserID foreign key
	BiudzetasID *uint     // Optional budget ID
	Data        time.Time `gorm:"not null"`
	Suma        float64   `gorm:"not null"`
	Aprasymas   string    // Description
	Valiuta     string    `gorm:"default:'EUR'"`             // Currency
	IvedimoData time.Time `gorm:"default:CURRENT_TIMESTAMP"` // Entry date

	// Relationships
	Narys     Narys      `gorm:"foreignKey:NarysID"` // Add User relationship
	Biudzetas *Biudzetas `gorm:"foreignKey:BiudzetasID"`
}
