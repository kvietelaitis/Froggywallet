package models

import (
	"time"

	"gorm.io/gorm"
)

type Pajama struct {
	gorm.Model
	ID          uint `gorm:"primaryKey"`
	GrupeID     *uint
	Data        time.Time `gorm:"not null"`
	Suma        float64   `gorm:"not null"`
	Aprasymas   string    // Description
	Valiuta     string    `gorm:"default:'EUR'"`             // Currency
	IvedimoData time.Time `gorm:"default:CURRENT_TIMESTAMP"` // Entry date

	// Relationships
	Grupe *Grupe `gorm:"foreignKey:GrupeID"`
}
