package ai

import (
	"os"
	"path/filepath"
	"testing"
	"time"
)

func sampleData() []Sample {
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	rows := []Sample{}
	for c := uint(1); c <= 2; c++ {
		for i := 0; i < 12; i++ {
			rows = append(rows, Sample{CategoryID: c, Date: now.AddDate(0, i, 0), SoldQty: float64(10 + i + int(c))})
		}
	}
	return rows
}

func TestTrainReturnsMetrics(t *testing.T) {
	artifact := Train(sampleData())
	if len(artifact.Models) == 0 {
		t.Fatalf("expected models")
	}
	if artifact.MAE < 0 || artifact.RMSE < 0 {
		t.Fatalf("metrics must be non-negative")
	}
}

func TestPredictLength(t *testing.T) {
	artifact := Train(sampleData())
	pred := Predict(artifact, 1, 6, time.Now())
	if len(pred) != 6 {
		t.Fatalf("expected 6 values, got %d", len(pred))
	}
}

func TestSaveAndLoad(t *testing.T) {
	artifact := Train(sampleData())
	path := filepath.Join(t.TempDir(), "model.json")
	if err := Save(path, artifact); err != nil {
		t.Fatalf("save failed: %v", err)
	}
	loaded, err := Load(path)
	if err != nil {
		t.Fatalf("load failed: %v", err)
	}
	if len(loaded.Models) != len(artifact.Models) {
		t.Fatalf("models mismatch")
	}
}

func TestLoadMissingFile(t *testing.T) {
	_, err := Load(filepath.Join(t.TempDir(), "missing.json"))
	if err == nil {
		t.Fatalf("expected missing file error")
	}
	if !os.IsNotExist(err) {
		t.Fatalf("expected not-exist error")
	}
}
