package services

import (
	"errors"
	"strings"
	"time"

	"backend/internal/models"
	"backend/internal/repositories"
)

type AuditService struct {
	repo *repositories.AuditRepository
}

func NewAuditService(repo *repositories.AuditRepository) *AuditService {
	return &AuditService{repo: repo}
}

func (s *AuditService) List() ([]models.AuditLog, error) {
	return s.repo.List()
}

func (s *AuditService) Create(log models.AuditLog) (models.AuditLog, error) {
	log.Action = strings.TrimSpace(log.Action)
	log.User = strings.TrimSpace(log.User)
	log.Details = strings.TrimSpace(log.Details)
	if log.Action == "" {
		return models.AuditLog{}, errors.New("action is required")
	}
	if log.User == "" {
		return models.AuditLog{}, errors.New("user is required")
	}
	if log.Details == "" {
		return models.AuditLog{}, errors.New("details are required")
	}
	if !models.IsValidAuditCategory(log.Category) {
		return models.AuditLog{}, errors.New("invalid category")
	}
	if !models.IsValidAuditSeverity(log.Severity) {
		return models.AuditLog{}, errors.New("invalid severity")
	}
	if log.ID == "" {
		log.ID = repositories.GenerateID("log")
	}
	if log.Timestamp.IsZero() {
		log.Timestamp = time.Now().UTC()
	}
	if strings.TrimSpace(log.Result) == "" {
		log.Result = "ok"
	}
	if err := s.repo.Create(&log); err != nil {
		return models.AuditLog{}, err
	}
	return log, nil
}
