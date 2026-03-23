package repositories

import (
	"fmt"
	"time"
)

func GenerateID(prefix string) string {
	return fmt.Sprintf("%s-%d", prefix, time.Now().UnixNano())
}
