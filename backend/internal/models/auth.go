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

type TokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int64  `json:"expires_in"`
}
