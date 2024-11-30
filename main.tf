terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.92.0"
    }
  }

  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
}


resource "azurerm_resource_group" "front_end_rg" {
  name     = var.fe_resource_group_name
  location = var.location
}

resource "azurerm_storage_account" "front_end_storage_account" {
  name                     = "stgsandfrontendne008"
  location                 = var.location

  account_replication_type = "LRS"
  account_tier             = "Standard"
  account_kind             = "StorageV2"
  resource_group_name      = azurerm_resource_group.front_end_rg.name

  static_website {
    index_document = "index.html"
  }
}

resource "azurerm_resource_group" "product_service_rg" {
  location = var.location
  name     = "rg-product-service-sand-ne-008"
}

resource "azurerm_storage_account" "products_service_fa" {
  name     = "stgsangproductsfane008"
  location = var.location

  account_replication_type = "LRS"
  account_tier             = "Standard"
  account_kind             = "StorageV2"

  resource_group_name = azurerm_resource_group.product_service_rg.name
}

resource "azurerm_storage_share" "products_service_fa" {
  name  = "fa-products-service-share"
  quota = 2

  storage_account_name = azurerm_storage_account.products_service_fa.name
}

resource "azurerm_service_plan" "product_service_plan" {
  name     = "asp-product-service-sand-ne-008"
  location = var.location

  os_type  = "Windows"
  sku_name = "Y1"

  resource_group_name = azurerm_resource_group.product_service_rg.name
}

resource "azurerm_application_insights" "products_service_fa" {
  name             = "appins-fa-products-service-sand-ne-008"
  application_type = "web"
  location         = var.location


  resource_group_name = azurerm_resource_group.product_service_rg.name
}

resource "azurerm_app_configuration" "shared_config" {
  location            = var.location
  name                = "appconfig-shared-config-sand-ne-008"
  resource_group_name = azurerm_resource_group.product_service_rg.name
  
  sku = "free"
}

resource "azurerm_windows_function_app" "products_service-008" {
  name     = "fa-products-service-sand-ne-008"
  location = var.location

  service_plan_id     = azurerm_service_plan.product_service_plan.id
  resource_group_name = azurerm_resource_group.product_service_rg.name

  storage_account_name       = azurerm_storage_account.products_service_fa.name
  storage_account_access_key = azurerm_storage_account.products_service_fa.primary_access_key

  functions_extension_version = "~4"
  builtin_logging_enabled     = false

  site_config {
    always_on = false

    application_insights_key               = azurerm_application_insights.products_service_fa.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.products_service_fa.connection_string

    # For production systems set this to false, but consumption plan supports only 32bit workers
    use_32_bit_worker = true

    # Enable function invocations from Azure Portal.
    cors {
      allowed_origins = ["https://portal.azure.com"]
    }

    application_stack {
      node_version = "~16"
    }
  }

  app_settings = {
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = azurerm_storage_account.products_service_fa.primary_connection_string
    WEBSITE_CONTENTSHARE                     = azurerm_storage_share.products_service_fa.name
  }

  # The app settings changes cause downtime on the Function App. e.g. with Azure Function App Slots
  # Therefore it is better to ignore those changes and manage app settings separately off the Terraform.
  lifecycle {
    ignore_changes = [
      app_settings,
      site_config["application_stack"], // workaround for a bug when azure just "kills" your app
      tags["hidden-link: /app-insights-instrumentation-key"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-conn-string"]
    ]
  }
}

resource "azurerm_resource_group" "import_service_rg" {
  location = var.location
  name     = "rg-import-service-sand-ne-008"
}

resource "azurerm_storage_account" "import_service_fa" {
  name     = "stgsangimportfane008"
  location = var.location

  account_replication_type = "LRS"
  account_tier             = "Standard"
  account_kind             = "StorageV2"

  resource_group_name = azurerm_resource_group.import_service_rg.name

  blob_properties{
    cors_rule{
        allowed_headers = ["*"]
        allowed_methods = ["PUT"]
        allowed_origins = ["*"]
        exposed_headers = ["*"]
        max_age_in_seconds = 3600
        }
    }
}

resource "azurerm_storage_share" "import_service_fa" {
  name  = "fa-import-service-share"
  quota = 2

  storage_account_name = azurerm_storage_account.import_service_fa.name
}

resource "azurerm_storage_container" "uploaded_storage_container" {
  name                  = "uploaded"
  storage_account_name  = azurerm_storage_account.import_service_fa.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "parsed_storage_container" {
  name                  = "parsed"
  storage_account_name  = azurerm_storage_account.import_service_fa.name
  container_access_type = "private"
}

resource "azurerm_service_plan" "import_service_plan" {
  name     = "asp-import-service-sand-ne-008"
  location = var.location

  os_type  = "Windows"
  sku_name = "Y1"

  resource_group_name = azurerm_resource_group.import_service_rg.name
}

resource "azurerm_application_insights" "import_service_fa" {
  name             = "appins-fa-import-service-sand-ne-008"
  application_type = "web"
  location         = var.location


  resource_group_name = azurerm_resource_group.import_service_rg.name
}

resource "azurerm_windows_function_app" "import_service-008" {
  name     = "fa-import-service-sand-ne-008"
  location = var.location

  service_plan_id     = azurerm_service_plan.import_service_plan.id
  resource_group_name = azurerm_resource_group.import_service_rg.name

  storage_account_name       = azurerm_storage_account.import_service_fa.name
  storage_account_access_key = azurerm_storage_account.import_service_fa.primary_access_key

  functions_extension_version = "~4"
  builtin_logging_enabled     = false

  site_config {
    always_on = false

    application_insights_key               = azurerm_application_insights.import_service_fa.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.import_service_fa.connection_string

    # For production systems set this to false, but consumption plan supports only 32bit workers
    use_32_bit_worker = true

    # Enable function invocations from Azure Portal.
    cors {
      allowed_origins = ["https://portal.azure.com"]
    }

    application_stack {
      node_version = "~16"
    }
  }

  app_settings = {
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = azurerm_storage_account.import_service_fa.primary_connection_string
    WEBSITE_CONTENTSHARE                     = azurerm_storage_share.import_service_fa.name
  }

  # The app settings changes cause downtime on the Function App. e.g. with Azure Function App Slots
  # Therefore it is better to ignore those changes and manage app settings separately off the Terraform.
  lifecycle {
    ignore_changes = [
      app_settings,
      site_config["application_stack"], // workaround for a bug when azure just "kills" your app
      tags["hidden-link: /app-insights-instrumentation-key"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-conn-string"]
    ]
  }
}

# CosmosDB
resource "azurerm_cosmosdb_account" "cosmos_account" {
  location            = var.location
  name                = var.cosmosdb_account_name
  offer_type          = "Standard"
  resource_group_name = azurerm_resource_group.product_service_rg.name
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Eventual"
  }

  capabilities {
    name = "EnableServerless"
  }

  geo_location {
    failover_priority = 0
    location          = "North Europe"
  }
}

resource "azurerm_cosmosdb_sql_database" "products_app" {
  account_name        = azurerm_cosmosdb_account.cosmos_account.name
  name                = "products-db"
  resource_group_name = azurerm_resource_group.product_service_rg.name
}

resource "azurerm_cosmosdb_sql_container" "products" {
  account_name        = azurerm_cosmosdb_account.cosmos_account.name
  database_name       = azurerm_cosmosdb_sql_database.products_app.name
  name                = "products"
  partition_key_path  = "/id"
  resource_group_name = azurerm_resource_group.product_service_rg.name

  # Cosmos DB supports TTL for the records
  default_ttl = -1

  indexing_policy {
    excluded_path {
      path = "/*"
    }
  }
}

resource "azurerm_cosmosdb_sql_container" "stocks" {
  account_name        = azurerm_cosmosdb_account.cosmos_account.name
  database_name       = azurerm_cosmosdb_sql_database.products_app.name
  name                = "stocks"
  partition_key_path  = "/id"
  resource_group_name = azurerm_resource_group.product_service_rg.name

  # Cosmos DB supports TTL for the records
  default_ttl = -1

  indexing_policy {
    excluded_path {
      path = "/*"
    }
  }
}

resource "azurerm_servicebus_namespace" "products_servicebus" {
  name                = "sb-products-service-008"
  location            = var.location
  resource_group_name = azurerm_resource_group.product_service_rg.name
  sku                 = "Standard"
}

resource "azurerm_servicebus_queue" "products_queue" {
  name           = "products-import-queue"
  namespace_id   = azurerm_servicebus_namespace.products_servicebus.id
}


resource "azurerm_servicebus_topic" "products_topic" {
  name           = "products-topic"
  namespace_id   = azurerm_servicebus_namespace.products_servicebus.id
}

resource "azurerm_servicebus_subscription" "subscription_all" {
  name           = "all-products"
  max_delivery_count = 1
  topic_id       = azurerm_servicebus_topic.products_topic.id
}

resource "azurerm_servicebus_subscription_rule" "filter_rule" {
  name                = "filter-by-property"
  subscription_id     = azurerm_servicebus_subscription.subscription_all.id

  filter_type = "SqlFilter"
  sql_filter  = "property = 'value'"
}

resource "azurerm_resource_group" "chatbot_rg" {
  name     = "${var.unique_resource_id_prefix}-rg-chatbot"
  location = var.location
}

resource "azurerm_container_registry" "chatbot_acr" {
  name                = "${var.unique_resource_id_prefix}chatbotacr"
  resource_group_name = azurerm_resource_group.chatbot_rg.name
  location            = azurerm_resource_group.chatbot_rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_log_analytics_workspace" "chatbot_log_analytics_workspace" {
  name                = "${var.unique_resource_id_prefix}-log-analytics-chatbot"
  location            = azurerm_resource_group.chatbot_rg.location
  resource_group_name = azurerm_resource_group.chatbot_rg.name
}

resource "azurerm_container_app_environment" "chatbot_cae" {
  name                       = "${var.unique_resource_id_prefix}-cae-chatbot"
  location                   = azurerm_resource_group.chatbot_rg.location
  resource_group_name        = azurerm_resource_group.chatbot_rg.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.chatbot_log_analytics_workspace.id
}

resource "azurerm_container_app" "chatbot_ca_docker_hub" {
  name                         = "${var.unique_resource_id_prefix}-chatbot-ca-dh"
  container_app_environment_id = azurerm_container_app_environment.chatbot_cae.id
  resource_group_name          = azurerm_resource_group.chatbot_rg.name
  revision_mode                = "Single"

  registry {
    server               = "docker.io"
    username             = var.docker_hub_username
    password_secret_name = "docker-io-pass"
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }

  }

  template {
    container {
      name   = "${var.unique_resource_id_prefix}-chatbot-container-dh"
      image  = "${var.docker_hub_registry_name}/${var.chatbot_container_name}:${var.chatbot_container_tag_dh}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "CONTAINER_REGISTRY_NAME"
        value = "Docker Hub"
      }
    }
  }

  secret {
    name  = "docker-io-pass"
    value = var.docker_hub_password
  }
}

resource "azurerm_container_app" "chatbot_ca_docker_acr" {
  name                         = "${var.unique_resource_id_prefix}-chatbot-ca-acr"
  container_app_environment_id = azurerm_container_app_environment.chatbot_cae.id
  resource_group_name          = azurerm_resource_group.chatbot_rg.name
  revision_mode                = "Single"

  registry {
    server               = azurerm_container_registry.chatbot_acr.login_server
    username             = azurerm_container_registry.chatbot_acr.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }

  }

  template {
    container {
      name   = "${var.unique_resource_id_prefix}-chatbot-container-acr"
      image  = "${azurerm_container_registry.chatbot_acr.login_server}/${var.chatbot_container_name}:${var.chatbot_container_tag_acr}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "CONTAINER_REGISTRY_NAME"
        value = "Azure Container Registry"
      }
    }
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.chatbot_acr.admin_password
  }
}
