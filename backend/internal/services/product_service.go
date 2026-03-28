package services

import (
	"errors"
	"strings"

	"backend/internal/models"
	"backend/internal/repositories"

	"gorm.io/gorm"
)

type ProductService struct {
	repo *repositories.ProductRepository
}

func NewProductService(repo *repositories.ProductRepository) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) List() ([]models.Product, error) {
	return s.repo.List()
}

func (s *ProductService) Get(id string) (models.Product, error) {
	id = strings.TrimSpace(id)
	if id == "" {
		return models.Product{}, errors.New("invalid product id")
	}
	return s.repo.GetByID(id)
}

func (s *ProductService) Create(product models.Product) (models.Product, error) {
	if product.ID == "" {
		product.ID = repositories.GenerateID("p")
	}
	if err := validateProductPayload(&product); err != nil {
		return models.Product{}, err
	}
	catID, err := s.repo.FindCategoryIDByName(product.Category)
	if err != nil {
		return models.Product{}, err
	}
	product.CategoryID = catID
	if err := s.repo.Create(&product); err != nil {
		return models.Product{}, err
	}
	return s.repo.GetByID(product.ID)
}

func (s *ProductService) Update(id string, payload models.Product) (models.Product, models.Product, error) {
	current, err := s.Get(id)
	if err != nil {
		return models.Product{}, models.Product{}, err
	}
	prev := current

	current.Name = strings.TrimSpace(payload.Name)
	current.Category = strings.TrimSpace(payload.Category)
	current.Price = payload.Price
	current.OriginalPrice = payload.OriginalPrice
	current.Image = strings.TrimSpace(payload.Image)
	current.Description = strings.TrimSpace(payload.Description)
	current.Dimensions = strings.TrimSpace(payload.Dimensions)
	current.Material = strings.TrimSpace(payload.Material)
	current.Stock = payload.Stock
	current.SKU = strings.TrimSpace(payload.SKU)
	current.Featured = payload.Featured
	current.Rating = payload.Rating
	current.Reviews = payload.Reviews
	current.IsActive = payload.IsActive

	if err := validateProductPayload(&current); err != nil {
		return models.Product{}, models.Product{}, err
	}

	catID, err := s.repo.FindCategoryIDByName(current.Category)
	if err != nil {
		return models.Product{}, models.Product{}, err
	}
	current.CategoryID = catID
	if err := s.repo.Update(&current); err != nil {
		return models.Product{}, models.Product{}, err
	}
	updated, err := s.repo.GetByID(current.ID)
	if err != nil {
		return models.Product{}, models.Product{}, err
	}
	return prev, updated, nil
}

func (s *ProductService) Delete(id string) error {
	if strings.TrimSpace(id) == "" {
		return errors.New("invalid product id")
	}
	return s.repo.Delete(id)
}

func validateProductPayload(product *models.Product) error {
	if strings.TrimSpace(product.Name) == "" {
		return errors.New("name is required")
	}
	if strings.TrimSpace(product.Category) == "" {
		return errors.New("category is required")
	}
	if strings.TrimSpace(product.Image) == "" {
		return errors.New("image is required")
	}
	if strings.TrimSpace(product.SKU) == "" {
		return errors.New("sku is required")
	}
	if product.Price < 0 {
		return errors.New("price must be >= 0")
	}
	if product.Stock < 0 {
		return errors.New("stock must be >= 0")
	}
	if product.Reviews < 0 {
		return errors.New("reviews must be >= 0")
	}
	if product.Rating < 0 || product.Rating > 5 {
		return errors.New("rating must be between 0 and 5")
	}
	if product.OriginalPrice != nil && *product.OriginalPrice < product.Price {
		return errors.New("originalPrice must be >= price")
	}
	return nil
}

func IsNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}
