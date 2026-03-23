package services

import (
	"errors"
	"strings"

	"backend/internal/models"
	"backend/internal/repositories"
)

type UserService struct {
	repo *repositories.UserRepository
	auth *AuthService
}

func NewUserService(repo *repositories.UserRepository, auth *AuthService) *UserService {
	return &UserService{repo: repo, auth: auth}
}

func (s *UserService) List() ([]models.User, error) {
	return s.repo.List()
}

func (s *UserService) Create(email, password, name string, role models.RoleName) (models.User, error) {
	return s.auth.CreateUser(email, password, name, role)
}

func (s *UserService) SetBlocked(id string, blocked bool) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("user id is required")
	}
	return s.repo.SetBlocked(id, blocked)
}
