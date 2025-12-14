package models

import "gorm.io/gorm"

type Investicija struct {
	gorm.Model
	NarysID      uint      `json:"narys_id"`
	Pavadinimas  string    `json:"pavadinimas"`
	Kiekis       int       `json:"kiekis"`
	PirkimoKaina float64   `json:"pirkimo_kaina"`
	PirkimoData  time.Time `json:"pirkimo_data"`
	SektoriusID  uint      `json:"sektorius_id"`
	
	SektoriusObj *Sektorius `gorm:"foreignKey:SektoriusID" json:"SektoriusObj,omitempty"`
}
