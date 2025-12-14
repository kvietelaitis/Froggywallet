package models

import "gorm.io/gorm"

type Sektorius struct {
	gorm.Model
	ID          uint          `gorm:"primaryKey" json:"id"`
	Pavadinimas string        `gorm:"not null" json:"pavadinimas"`
	
	Investicijos []Investicija `gorm:"foreignKey:SektoriusID" json:"investicijos"`
}