package models

type AdminUser struct {
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}
