package services

import (
	"errors"
	"strings"
	"time"

	"backend/internal/models"
	"backend/internal/repositories"
	"backend/internal/security"

	"gorm.io/gorm"
)

type AuthService struct {
	users  *repositories.UserRepository
	secret string
	salt   string
}

func NewAuthService(users *repositories.UserRepository, secret string) *AuthService {
	return &AuthService{users: users, secret: secret, salt: "maison-salt"}
}

func (s *AuthService) Login(email, password string) (models.LoginResponse, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || strings.TrimSpace(password) == "" {
		return models.LoginResponse{}, errors.New("email and password are required")
	}

	user, err := s.users.FindByEmail(email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.LoginResponse{}, errors.New("invalid email or password")
		}
		return models.LoginResponse{}, err
	}
	if user.IsBlocked {
		return models.LoginResponse{}, errors.New("user is blocked")
	}
	if !security.VerifyPassword(password, user.PasswordHash, s.salt) {
		return models.LoginResponse{}, errors.New("invalid email or password")
	}

	claims := security.Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role.Name,
		Exp:    time.Now().UTC().Add(12 * time.Hour).Unix(),
	}
	token, err := security.SignToken(s.secret, claims)
	if err != nil {
		return models.LoginResponse{}, err
	}

	return models.LoginResponse{
		User: models.AdminUser{ID: user.ID, Email: user.Email, Name: user.Name, Role: user.Role.Name},
		Token: token,
	}, nil
}

func (s *AuthService) CreateUser(email, password, name string, role models.RoleName) (models.User, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || strings.TrimSpace(password) == "" || strings.TrimSpace(name) == "" {
		return models.User{}, errors.New("email, password and name are required")
	}
	roleRow, err := s.users.FindRoleByName(role)
	if err != nil {
		return models.User{}, err
	}

	user := models.User{
		ID:           repositories.GenerateID("u"),
		Email:        email,
		PasswordHash: security.HashPassword(password, s.salt),
		Name:         strings.TrimSpace(name),
		RoleID:       roleRow.ID,
		IsBlocked:    false,
	}
	if err := s.users.Create(&user); err != nil {
		return models.User{}, err
	}

	created, err := s.users.FindByEmail(email)
	if err != nil {
		return models.User{}, err
	}
	return created, nil
}
