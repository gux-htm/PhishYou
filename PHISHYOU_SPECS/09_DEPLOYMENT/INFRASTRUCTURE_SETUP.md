# PhishYou: Deployment & Infrastructure Setup

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PHISHYOU DEPLOYMENT                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PUBLIC INTERNET                          │
│  (Employees receiving phishing attacks via platforms)       │
└──────────────────────────────────────────────────────────────┘
           ↑                    ↑                    ↑
       (Email)            (WhatsApp/SMS)        (Voice Calls)
           │                    │                    │
┌──────────┴────────┬───────────┴──────┬───────────┴─────────┐
│                   │                  │                     │
│                   ↓                  ↓                     ↓
│           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│           │  SMTP Server │  │ Twilio API   │  │ Twilio API   │
│           │  (Email Out) │  │ (WhatsApp)   │  │ (Voice/SMS)  │
│           └──────────────┘  └──────────────┘  └──────────────┘
│
│  ┌────────────────────────────────────────────────────────┐
│  │          ALIBABA CLOUD ASIA-PACIFIC (VPC)              │
│  │                                                        │
│  │  ┌─────────────────────────────────────────────────┐  │
│  │  │     PHISHYOU API LAYER (FastAPI)                │  │
│  │  │  ┌──────────────────────────────────────────┐   │  │
│  │  │  │ Campaign Orchestration Engine            │   │  │
│  │  │  │ - Message routing                        │   │  │
│  │  │  │ - Platform delivery                      │   │  │
│  │  │  │ - Persistence logic                      │   │  │
│  │  │  └──────────────────────────────────────────┘   │  │
│  │  │                                                  │  │
│  │  │  ┌──────────────────────────────────────────┐   │  │
│  │  │  │ AI Agent (LangChain)                     │   │  │
│  │  │  │ ├─ Conversation orchestration            │   │  │
│  │  │  │ ├─ Behavioral analysis                   │   │  │
│  │  │  │ └─ Trigger selection                     │   │  │
│  │  │  └──────────────────────────────────────────┘   │  │
│  │  │                                                  │  │
│  │  │  ┌──────────────────────────────────────────┐   │  │
│  │  │  │ Media Generation                         │   │  │
│  │  │  │ ├─ Voice synthesis (Qwen TTS)            │   │  │
│  │  │  │ └─ Document generation (Stable Diff)     │   │  │
│  │  │  └──────────────────────────────────────────┘   │  │
│  │  │                                                  │  │
│  │  │  ┌──────────────────────────────────────────┐   │  │
│  │  │  │ Analytics Engine                         │   │  │
│  │  │  │ ├─ Behavioral scoring                    │   │  │
│  │  │  │ ├─ AAR generation                        │   │  │
│  │  │  │ └─ Threat pattern mining                 │   │  │
│  │  │  └──────────────────────────────────────────┘   │  │
│  │  └─────────────────────────────────────────────────┘  │
│  │                                                        │
│  │  ┌─────────────────────────────────────────────────┐  │
│  │  │     ADMIN DASHBOARD (Streamlit/React)           │  │
│  │  │  - Campaign management                          │  │
│  │  │  - Real-time analytics                          │  │
│  │  │  - AAR viewing & export                         │  │
│  │  └─────────────────────────────────────────────────┘  │
│  │                                                        │
│  │  ┌─────────────────────────────────────────────────┐  │
│  │  │     PostgreSQL Database                         │  │
│  │  │  - Campaign state                              │  │
│  │  │  - Message history (immutable)                 │  │
│  │  │  - Audit logs                                  │  │
│  │  │  - Analytics results                           │  │
│  │  └─────────────────────────────────────────────────┘  │
│  │                                                        │
│  │  ┌─────────────────────────────────────────────────┐  │
│  │  │     Alibaba Cloud KMS (Encryption Keys)         │  │
│  │  │  - Data encryption keys                        │  │
│  │  │  - API authentication tokens                   │  │
│  │  └─────────────────────────────────────────────────┘  │
│  │                                                        │
│  └────────────────────────────────────────────────────────┘
│
│  ┌────────────────────────────────────────────────────────┐
│  │     EXTERNAL INTEGRATIONS                              │
│  │                                                        │
│  │  Alibaba Qwen LLM API        (Conversation)           │
│  │  Alibaba Qwen TTS API        (Voice Synthesis)        │
│  │  Twilio SMS/WhatsApp API     (Message Delivery)       │
│  │  Stable Diffusion API        (Image Generation)       │
│  │                                                        │
│  └────────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Deployment on Alibaba Cloud

### 2.1 Prerequisites

```bash
# Install CLI tools
pip install aliyun-python-sdk-core
pip install aliyun-python-sdk-ecs
pip install terraform

# Configure credentials
export ALIBABACLOUD_ACCESS_KEY_ID=<your_access_key>
export ALIBABACLOUD_ACCESS_KEY_SECRET=<your_secret>
export ALIBABACLOUD_REGION=ap-southeast-1  # Singapore (recommended for APAC)
```

### 2.2 Infrastructure as Code (Terraform)

```hcl
# main.tf

provider "alibabacloud" {
  region = "ap-southeast-1"
}

# VPC
resource "alibabacloud_vpc" "phishyou" {
  name              = "phishyou-vpc"
  cidr_block        = "10.0.0.0/16"
  description       = "PhishYou VPC"
}

# Subnet
resource "alibabacloud_vswitch" "phishyou" {
  vpc_id            = alibabacloud_vpc.phishyou.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "ap-southeast-1a"
  name              = "phishyou-subnet"
}

# Security Group
resource "alibabacloud_security_group" "phishyou" {
  vpc_id      = alibabacloud_vpc.phishyou.id
  name        = "phishyou-sg"
  description = "Security group for PhishYou"
}

# Allow HTTPS (443) and SSH (22) for admin
resource "alibabacloud_security_group_rule" "https" {
  type              = "ingress"
  ip_protocol       = "tcp"
  port_range        = "443/443"
  cidr_ip           = "0.0.0.0/0"
  security_group_id = alibabacloud_security_group.phishyou.id
}

# PostgreSQL Database
resource "alibabacloud_db_instance" "phishyou" {
  instance_type    = "rds.mysql.t2.medium"
  engine           = "PostgreSQL"
  engine_version   = "13.0"
  storage          = 100  # GB
  instance_name    = "phishyou-db"
  
  security_groups  = [alibabacloud_security_group.phishyou.id]
  vswitch_id       = alibabacloud_vswitch.phishyou.id
  
  db_name          = "phishyou_prod"
  account_name     = "phishyou_admin"
  account_password = random_password.db_password.result
}

# ECS Instance (API Server)
resource "alibabacloud_instance" "phishyou_api" {
  instance_type     = "ecs.e5.large"  # 2 vCPU, 4 GB RAM
  instance_name     = "phishyou-api-server"
  
  image_id          = "ubuntu_20.04_x64_20G_alibase_20220426.vhd"
  security_groups   = [alibabacloud_security_group.phishyou.id]
  vswitch_id        = alibabacloud_vswitch.phishyou.id
  
  internet_max_bandwidth_out = 10  # Mbps
  
  # Auto-start
  auto_renew_period = 1
  auto_renew        = true
  
  tags = {
    Environment = "production"
    Application = "phishyou"
  }
}

# Load Balancer
resource "alibabacloud_slb" "phishyou" {
  name          = "phishyou-lb"
  address_type  = "internet"
  vswitch_id    = alibabacloud_vswitch.phishyou.id
  specification = "slb.s2.medium"
}

# KMS Key (for encryption)
resource "alibabacloud_kms_key" "phishyou" {
  description             = "KMS key for PhishYou encryption"
  deletion_window_in_days = 10
  key_state               = "Enabled"
}
```

### 2.3 Container Deployment (Docker)

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY phishyou/ .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and push
docker build -t phishyou:latest .
docker tag phishyou:latest registry.ap-southeast-1.aliyuncs.com/phishyou/api:latest
docker push registry.ap-southeast-1.aliyuncs.com/phishyou/api:latest

# Deploy to Container Service
aliyun container create-service \
  --name phishyou-api \
  --image registry.ap-southeast-1.aliyuncs.com/phishyou/api:latest \
  --replicas 2 \
  --cpu 1 \
  --memory 2Gi
```

---

## 3. Environment Configuration

### 3.1 .env File (Secrets)

```bash
# .env.production

# Alibaba Cloud
ALIBABACLOUD_REGION=ap-southeast-1
ALIBABACLOUD_ACCESS_KEY_ID=${VAULT_ALIBABACLOUD_ACCESS_KEY_ID}
ALIBABACLOUD_ACCESS_KEY_SECRET=${VAULT_ALIBABACLOUD_ACCESS_KEY_SECRET}

# Database
DATABASE_URL=postgresql://phishyou_admin:${VAULT_DB_PASSWORD}@db.phishyou.alibaba.com:5432/phishyou_prod
DATABASE_SSL_MODE=require
DATABASE_POOL_SIZE=20

# LLM (Alibaba Qwen)
QWEN_API_KEY=${VAULT_QWEN_API_KEY}
QWEN_API_ENDPOINT=https://qwen-api.alibaba-inc.com/api/v1
QWEN_MODEL_ID=qwen-turbo

# TTS (Alibaba Qwen TTS)
TTS_API_KEY=${VAULT_TTS_API_KEY}
TTS_API_ENDPOINT=https://tts-api.alibaba-inc.com/api/v1

# Third-party APIs
TWILIO_ACCOUNT_SID=${VAULT_TWILIO_ACCOUNT_SID}
TWILIO_AUTH_TOKEN=${VAULT_TWILIO_AUTH_TOKEN}

# Encryption
KMS_KEY_ID=arn:alibabacloud:kms:ap-southeast-1:123456789:key/12345678

# Security
JWT_SECRET_KEY=${VAULT_JWT_SECRET_KEY}
JWT_EXPIRY_SECONDS=3600
ALLOWED_ORIGINS=https://dashboard.phishyou.com,https://api.phishyou.com

# Logging
LOG_LEVEL=INFO
SENTRY_DSN=${VAULT_SENTRY_DSN}
```

### 3.2 Configuration Management

```python
# config.py

from pydantic import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Settings loaded from environment"""
    
    # Alibaba
    alibabacloud_region: str
    alibabacloud_access_key_id: str
    alibabacloud_access_key_secret: str
    
    # Database
    database_url: str
    database_ssl_mode: str = "require"
    database_pool_size: int = 20
    
    # LLM
    qwen_api_key: str
    qwen_api_endpoint: str
    qwen_model_id: str = "qwen-turbo"
    
    # TTS
    tts_api_key: str
    tts_api_endpoint: str
    
    # Twilio
    twilio_account_sid: str
    twilio_auth_token: str
    
    # Security
    jwt_secret_key: str
    jwt_expiry_seconds: int = 3600
    allowed_origins: List[str]
    
    # Logging
    log_level: str = "INFO"
    sentry_dsn: Optional[str] = None
    
    class Config:
        env_file = ".env.production"

@lru_cache()
def get_settings() -> Settings:
    """Singleton pattern for settings"""
    return Settings()
```

---

## 4. Database Initialization

```bash
# Run migrations
cd phishyou/
alembic upgrade head

# Or manually:
psql -h db.phishyou.alibaba.com -U phishyou_admin -d phishyou_prod < schema.sql

# Verify schema
psql -h db.phishyou.alibaba.com -U phishyou_admin -d phishyou_prod -c "\dt"
```

---

## 5. Monitoring & Logging

### 5.1 CloudWatch / Alibaba Cloud Monitoring

```python
# monitoring.py

from aliyun.api import MonitorClient

monitor = MonitorClient()

# Log API latency
monitor.put_metric(
    metric_name="APIResponseTime",
    value=response_time_ms,
    unit="Milliseconds",
    dimensions={
        "endpoint": "/campaigns/send",
        "method": "POST"
    }
)

# Log campaign count
monitor.put_metric(
    metric_name="ActiveCampaigns",
    value=active_campaign_count,
    dimensions={"tier": "A"}
)

# Alert if error rate > 1%
if error_rate > 0.01:
    monitor.put_event_alert(
        alert_name="HighErrorRate",
        severity="CRITICAL",
        message=f"API error rate: {error_rate:.2%}"
    )
```

### 5.2 Logging Configuration

```python
# logging.py

import logging
from pythonjsonlogger import jsonlogger

logger = logging.getLogger()
handler = logging.StreamHandler()

# JSON format for easy parsing
formatter = jsonlogger.JsonFormatter()
handler.setFormatter(formatter)
logger.addHandler(handler)

# Example log
logger.info("Campaign started", extra={
    "campaign_id": "camp_123",
    "target_count": 5,
    "tier": "A",
    "timestamp": datetime.now().isoformat()
})
```

---

## 6. Scaling Strategy

### 6.1 Horizontal Scaling

```bash
# Scale API servers
aliyun ecs describe-instances --query "Instances.Instance[?Tags.Application=='phishyou']"

# Auto-scaling group
aliyun autoscaling create-scaling-group \
  --scaling-group-name phishyou-asg \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 4
```

### 6.2 Database Scaling

```bash
# Read replicas for analytics queries
aliyun rds create-read-only-db-instance \
  --db-instance-id phishyou-db \
  --read-only-db-instance-name phishyou-db-readonly
```

---

## 7. Backup & Disaster Recovery

```bash
# Automated backups (daily)
aliyun rds modify-db-backup-policy \
  --db-instance-id phishyou-db \
  --backup-retention-period 30 \
  --backup-window 03:00Z-04:00Z

# Restore from backup
aliyun rds restore-db-instance \
  --db-instance-id phishyou-db \
  --backup-id backup_12345
```

---

**Document Status:** ✅ COMPLETE  
**Last Updated:** August 24, 2026
