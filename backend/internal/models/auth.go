package models

type AdminUser struct {
	ID    string   `json:"id"`
	Email string   `json:"email"`
	Name  string   `json:"name"`
	Role  RoleName `json:"role"`
}

type LoginResponse struct {
	User  AdminUser `json:"user"`
	Token string    `json:"token"`
}
