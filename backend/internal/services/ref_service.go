package services

import (
	"errors"
	"strings"

	"backend/internal/models"
	"backend/internal/repositories"
)

type ReferenceService struct {
	categories *repositories.CategoryRepository
	customers  *repositories.CustomerRepository
}

func NewReferenceService(categories *repositories.CategoryRepository, customers *repositories.CustomerRepository) *ReferenceService {
	return &ReferenceService{categories: categories, customers: customers}
}

func (s *ReferenceService) ListCategories() ([]models.Category, error) {
	return s.categories.List()
}

func (s *ReferenceService) CreateCategory(name string, parentID *uint) (models.Category, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return models.Category{}, errors.New("name is required")
	}
	item := models.Category{Name: name, ParentID: parentID}
	if err := s.categories.Create(&item); err != nil {
		return models.Category{}, err
	}
	return item, nil
}

func (s *ReferenceService) ListCustomers() ([]models.Customer, error) {
	return s.customers.List()
}

func (s *ReferenceService) CreateCustomer(fullName, phone, email string) (models.Customer, error) {
	fullName = strings.TrimSpace(fullName)
	email = strings.TrimSpace(strings.ToLower(email))
	if fullName == "" {
		return models.Customer{}, errors.New("full_name is required")
	}
	if email == "" {
		return models.Customer{}, errors.New("email is required")
	}
	item := models.Customer{ID: repositories.GenerateID("c"), FullName: fullName, Phone: strings.TrimSpace(phone), Email: email}
	if err := s.customers.Create(&item); err != nil {
		return models.Customer{}, err
	}
	return item, nil
}
