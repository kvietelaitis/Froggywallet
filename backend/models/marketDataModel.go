package models

import (
	"time"

	"gorm.io/gorm"
)

type RinkosDuomenys struct {
	gorm.Model
	ID              uint      `gorm:"primaryKey"`
	//InvesticijaID   uint      `gorm:"not null"`
	Pavadinimas     string    `gorm:"not null"`                  // Name
	Kaina           float64   `gorm:"not null"`                  // Price
	AtnaujinimoData time.Time `gorm:"default:CURRENT_TIMESTAMP"` //Update date
	// Relationships
	//Investicija Investicija `gorm:"foreignKey:InvesticijaID"`
}
