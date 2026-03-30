package models

type RolePermissionView struct {
	Role        RoleName `json:"role"`
	Action      string   `json:"action"`
	Resource    string   `json:"resource"`
	Effect      string   `json:"effect"`
	Description string   `json:"description"`
}
