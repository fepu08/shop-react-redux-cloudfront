variable "fe_resource_group_name" {
  description = "Resource group name"
  type        = string
	default 		= "rg-frontend-sand-ne-008"
}

variable "imported_files_rg_name" {
  description = "Resource group name"
  type        = string
	default 		= "rg-imported-files-sand-ne-008"
}

variable "location" {
  description = "Location for the resources"
  type        = string
  default     = "northeurope"
}

variable "cosmosdb_account_name" {
  description = "Cosmos DB account name"
  type        = string
	default 		= "cos-product-service-sand-ne-008"
}

variable "database_name" {
  description = "Cosmos DB database name"
  type        = string
	default 		= "products-db"
}

variable "product_container_name" {
  description = "Cosmos DB Product container name"
  type        = string
  default     = "Product"
}

variable "stock_container_name" {
  description = "Cosmos DB Stock container name"
  type        = string
  default     = "Stock"
}
