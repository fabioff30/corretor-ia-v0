# Plano de Migração: Julinho WhatsApp - N8N para Código Nativo

## 📋 Visão Geral

Este documento detalha o plano completo para migrar o assistente de IA **Julinho** do ambiente N8N para uma aplicação Node.js nativa, rodando no VPS KVM 2 da Hostinger existente, com sistema completo de relatórios e analytics.

## 🎯 Objetivo

Converter o workflow atual do N8N em uma aplicação standalone que:
- Mantenha toda funcionalidade existente
- Adicione sistema de relatórios detalhados 
- Rode eficientemente no VPS existente
- Forneça controle total sobre o código e dados

## 📊 Análise do Workflow N8N Atual

### Componentes do Workflow Original:
1. **Webhook2**: Recebe mensagens do WhatsApp via Z-API
2. **Prepare WhatsApp data**: Extrai phone, text, messageId
3. **Rpush**: Buffer Redis para agrupar mensagens
4. **Redis Set**: Sistema de "sentinela" anti-spam (TTL 8s)
5. **Wait**: Aguarda 9 segundos para agrupar mensagens
6. **Checar Sentinela**: Verifica se deve processar
7. **If1**: Condição para prosseguir ou parar
8. **Ler & esvaziar buffer**: Pop das mensagens agrupadas
9. **Montar prompt**: Junta mensagens em prompt único
10. **AI Agent**: OpenAI com prompt específico do Julinho
11. **Redis Chat Memory**: Memória de conversa persistente
12. **Brevo Tools**: Captura de leads (upsert + get contact)
13. **Enviar Mensagem**: Resposta via Z-API

### Fluxo Atual:
```
WhatsApp → Z-API → N8N Webhook → Buffer Redis → 
Aguarda 9s → Verifica Sentinela → Processa com IA → 
Resposta WhatsApp + Captura Lead
```

### APIs e Integrações Atuais:
- **Z-API**: WhatsApp Business (instância 3D4C2EFCAA8430675B4E4EBC1C61B2E7)
- **OpenAI**: GPT-4.1 (via OpenRouter backup)
- **Redis**: Buffer + memória de conversas
- **Brevo**: Email marketing e lead capture

## 🖥️ Infraestrutura Alvo

### VPS Hostinger KVM 2:
- **CPU**: 2 vCPUs
- **RAM**: 8GB
- **Storage**: 100GB NVMe
- **Bandwidth**: 8TB/mês
- **OS**: Ubuntu 22.04 LTS (recomendado)

### Distribuição de Recursos:
- **Node.js App**: ~500MB RAM, 0.5 vCPU
- **PostgreSQL**: ~1GB RAM, 0.3 vCPU
- **Redis**: ~500MB RAM, 0.1 vCPU
- **Sistema**: ~2GB RAM, 0.2 vCPU
- **Reserva**: ~4GB RAM, 0.9 vCPU

## 🏗️ Arquitetura da Nova Aplicação

### Stack Tecnológica:
```
┌─ Nginx (Proxy Reverso + SSL)
├─ Node.js + Express (API Principal)
├─ Redis (Cache + Memória Conversas)
├─ PostgreSQL (Analytics + Relatórios)
└─ PM2 (Process Manager)
```

### Estrutura do Projeto:
```
/opt/julinho/
├── app/
│   ├── src/
│   │   ├── api/
│   │   │   ├── webhook.js          # Substitui N8N Webhook2
│   │   │   ├── health.js           # Health checks
│   │   │   └── reports.js          # Dashboard API
│   │   ├── services/
│   │   │   ├── whatsapp.service.js # Z-API integration
│   │   │   ├── ai.service.js       # OpenAI + prompt Julinho
│   │   │   ├── memory.service.js   # Redis chat memory
│   │   │   ├── buffer.service.js   # Substitui sistema N8N buffer
│   │   │   ├── analytics.service.js# Sistema de métricas
│   │   │   └── leads.service.js    # Integração Brevo
│   │   ├── models/
│   │   │   ├── conversation.js     # Schema conversas
│   │   │   ├── message.js          # Schema mensagens
│   │   │   └── analytics.js        # Schema métricas
│   │   ├── middleware/
│   │   │   ├── auth.js             # Autenticação dashboard
│   │   │   ├── rateLimit.js        # Rate limiting
│   │   │   └── validation.js       # Validação dados
│   │   └── utils/
│   │       ├── redis.js            # Cliente Redis
│   │       ├── database.js         # PostgreSQL connection
│   │       ├── logger.js           # Logging system
│   │       └── constants.js        # Prompt + configs
│   ├── dashboard/                  # Interface relatórios
│   │   ├── public/
│   │   │   ├── index.html
│   │   │   ├── dashboard.js
│   │   │   └── styles.css
│   │   └── views/
│   │       ├── overview.html       # KPIs principais
│   │       ├── conversations.html  # Lista conversas
│   │       ├── analytics.html      # Gráficos detalhados
│   │       └── leads.html          # Funil captura
│   ├── config/
│   │   ├── nginx.conf              # Configuração Nginx
│   │   ├── ecosystem.config.js     # PM2 config
│   │   ├── database.sql            # Schema PostgreSQL
│   │   └── redis.conf              # Redis config
│   └── scripts/
│       ├── setup.sh                # Instalação automatizada
│       ├── backup.sh               # Backup automático
│       ├── monitor.sh              # Monitoring
│       └── migrate-n8n.js          # Script migração dados N8N
├── logs/                           # Logs aplicação
├── backups/                        # Backups automáticos
└── .env                            # Variáveis ambiente
```

## 🔄 Conversão do Workflow N8N

### Mapeamento Direto:

| Componente N8N | Equivalente Node.js |
|----------------|-------------------|
| Webhook2 | `POST /api/webhook/whatsapp` |
| Prepare WhatsApp data | `whatsapp.service.js:parseMessage()` |
| Rpush | `buffer.service.js:addMessage()` |
| Redis Set (sentinela) | `buffer.service.js:setSentinel()` |
| Wait 9s | `setTimeout()` + queue system |
| Checar Sentinela | `buffer.service.js:checkSentinel()` |
| If1 | Conditional logic em JS |
| Ler & esvaziar buffer | `buffer.service.js:popMessages()` |
| Montar prompt | `ai.service.js:buildPrompt()` |
| AI Agent | `ai.service.js:processWithAI()` |
| Redis Chat Memory | `memory.service.js:getContext()` |
| Brevo Tools | `leads.service.js:upsertContact()` |
| Enviar Mensagem | `whatsapp.service.js:sendMessage()` |

### Sistema Anti-Spam (Replicando N8N Logic):
```javascript
// buffer.service.js
class BufferService {
  async addMessage(phone, text, messageId) {
    // Replica "Rpush" do N8N
    await redis.lpush(`chat:${phone}`, text);
    
    // Replica "Redis Set" do N8N (sentinela)
    await redis.setex(`typing:${phone}`, 8, '1');
    
    // Replica "Wait" do N8N
    setTimeout(() => {
      this.processBuffer(phone);
    }, 9000);
  }

  async processBuffer(phone) {
    // Replica "Checar Sentinela" + "If1" do N8N
    const sentinel = await redis.get(`typing:${phone}`);
    if (!sentinel) return; // Evita processamento duplicado
    
    // Replica "Ler & esvaziar buffer" do N8N
    const messages = await redis.lrange(`chat:${phone}`, 0, -1);
    await redis.del(`chat:${phone}`);
    
    // Replica "Montar prompt" do N8N
    const prompt = messages.join(' ');
    
    // Processa com IA
    await this.aiService.process(phone, prompt);
  }
}
```

### Prompt do Julinho (Exato do N8N):
```javascript
const JULINHO_PROMPT = `
Você é o Julinho, o melhor e mais gente boa professor de português do Brasil. 
Sua personalidade é informal, direta, simpática e didática, como se estivesse 
trocando uma ideia no WhatsApp.

Suas respostas devem ser curtas, claras e sem enrolação.

### 🧱 Regras Essenciais:

1. **Foco Total em Português:** Só responda a dúvidas sobre a língua portuguesa 
   (gramática, ortografia, clareza, etc.). Se a pergunta for sobre outro tema, 
   responda de forma educada que seu foco é só esse. Ex: "Opa, essa aí eu vou 
   ficar te devendo! Minha praia é só o português mesmo. Manda a dúvida da nossa 
   língua que eu te ajudo! 😉"

2. **Sempre em Português:** Todas as suas respostas, sem exceção, devem ser em 
   português do Brasil.

3. **Estilo de Correção:** Ao corrigir textos, mantenha o tom original da pessoa. 
   Corrija apenas o necessário (erros de gramática e ortografia) para não mudar 
   o estilo dela.

4. **Validação de Textos Sem Erros:** Quando um texto enviado para correção 
   estiver correto, sua missão é elogiar o usuário de forma genuína. Você pode 
   sugerir para ele a possibilidade de reescrever também. Exemplo:
   > "Manda muito! Revisei aqui e seu texto tá perfeito. 👏, mas se você quiser 
   > posso reescrever o texto. Vamos?"

### 🔁 Fluxo da Conversa:

**Passo 1: Ajudar Primeiro (Gerar Valor)**
- Quando a pessoa mandar a primeira dúvida ou texto, ajude-a imediatamente.

**Passo 2: Coletar Dados (APÓS a primeira ajuda)**
- Depois de entregar a primeira ajuda e a pessoa interagir positivamente, 
  inicie a coleta de dados de forma natural.
- **Frase para pedir os dados:** "Que bom que ajudei! Pra gente não perder o 
  contato e eu poder te mandar umas dicas exclusivas de vez em quando, qual 
  seu nome e seu melhor e-mail?"

**Passo 3: Sugerir a Doação (No final da conversa)**
- Quando a pessoa indicar que não tem mais dúvidas, finalize com o pedido de apoio.
- **Frase de encerramento:** "Fechou! Se curtiu a ajuda e quiser dar uma força 
  pra manter o Julinho no ar, qualquer valor já ajuda demais. É só mandar um 
  pix para: \`contato@corretordetextoonline.com.br\` 💙"
`;
```

## 📊 Sistema de Relatórios e Analytics

### Métricas Coletadas:

#### Conversas:
- Total de conversas iniciadas
- Conversas únicas (usuários únicos)
- Conversas por período (hora/dia/semana/mês)
- Duração média das conversas
- Taxa de retorno de usuários

#### Mensagens:
- Total mensagens enviadas/recebidas
- Mensagens por conversa (média)
- Tipos de dúvidas mais comuns
- Tempo de resposta do Julinho
- Taxa de satisfação (baseada em reações)

#### Leads:
- Contatos capturados
- Taxa de conversão (conversa → lead)
- Leads por fonte/período
- Integração com Brevo stats

#### Performance:
- Latência API (WhatsApp → Resposta)
- Uso de recursos (CPU/RAM)
- Erros por endpoint
- Uptime do sistema

### Dashboard Web:

#### Página Principal (Overview):
```html
<!-- /dashboard/ -->
<div class="dashboard-grid">
  <!-- KPIs Principais -->
  <div class="kpi-cards">
    <div class="kpi">
      <h3>Conversas Hoje</h3>
      <span class="number">127</span>
      <span class="change">+12%</span>
    </div>
    <div class="kpi">
      <h3>Mensagens Enviadas</h3>
      <span class="number">394</span>
      <span class="change">+8%</span>
    </div>
    <div class="kpi">
      <h3>Leads Capturados</h3>
      <span class="number">23</span>
      <span class="change">+18%</span>
    </div>
    <div class="kpi">
      <h3>Tempo Médio Resposta</h3>
      <span class="number">2.3s</span>
      <span class="change">-5%</span>
    </div>
  </div>
  
  <!-- Gráficos -->
  <div class="charts">
    <canvas id="conversationsChart"></canvas>
    <canvas id="messagesChart"></canvas>
  </div>
  
  <!-- Últimas Conversas -->
  <div class="recent-conversations">
    <h3>Conversas Recentes</h3>
    <div class="conversation-list">
      <!-- Lista das últimas conversas -->
    </div>
  </div>
</div>
```

#### APIs de Relatórios:
```javascript
// GET /api/reports/overview
{
  "period": "today",
  "conversations": {
    "total": 127,
    "unique_users": 89,
    "avg_duration": "4.2 min"
  },
  "messages": {
    "sent": 394,
    "received": 127,
    "avg_response_time": "2.3s"
  },
  "leads": {
    "captured": 23,
    "conversion_rate": "18.1%"
  },
  "performance": {
    "uptime": "99.8%",
    "avg_latency": "157ms",
    "errors": 2
  }
}

// GET /api/reports/conversations?period=7d
{
  "total": 856,
  "by_day": [
    {"date": "2024-01-20", "count": 127},
    {"date": "2024-01-21", "count": 134}
  ],
  "top_users": [
    {"phone": "5584999...", "count": 12, "last_seen": "2024-01-21"}
  ]
}
```

## ⚙️ Configuração do Ambiente

### 1. Setup Inicial do VPS:
```bash
#!/bin/bash
# scripts/setup.sh

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Instalar PostgreSQL 14
apt install -y postgresql postgresql-contrib

# Instalar Redis
apt install -y redis-server

# Instalar Nginx
apt install -y nginx

# Instalar PM2
npm install -g pm2

# Configurar PostgreSQL
sudo -u postgres createdb julinho
sudo -u postgres createuser --pwprompt julinho_user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE julinho TO julinho_user;"

# Configurar Redis
systemctl enable redis-server
systemctl start redis-server

# Configurar Nginx
systemctl enable nginx
systemctl start nginx

# Instalar Certbot (SSL)
apt install -y certbot python3-certbot-nginx

echo "Setup inicial concluído!"
```

### 2. Configuração PostgreSQL:
```sql
-- config/database.sql

-- Tabela de conversas
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  lead_captured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de mensagens
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  phone VARCHAR(20) NOT NULL,
  message_id VARCHAR(100),
  content TEXT NOT NULL,
  direction ENUM('inbound', 'outbound') NOT NULL,
  processed_at TIMESTAMP,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de leads
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(100),
  email VARCHAR(100),
  brevo_contact_id INTEGER,
  captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de analytics
CREATE TABLE analytics_daily (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  conversations_total INTEGER DEFAULT 0,
  conversations_unique INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date)
);

-- Índices para performance
CREATE INDEX idx_conversations_phone ON conversations(phone);
CREATE INDEX idx_conversations_started_at ON conversations(started_at);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_analytics_date ON analytics_daily(date);
```

### 3. Configuração PM2:
```javascript
// config/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'julinho-api',
    script: 'src/app.js',
    instances: 1,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'julinho',
      DB_USER: 'julinho_user',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379
    },
    log_file: '/opt/julinho/logs/combined.log',
    out_file: '/opt/julinho/logs/out.log',
    error_file: '/opt/julinho/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### 4. Configuração Nginx:
```nginx
# config/nginx.conf
server {
    listen 80;
    server_name julinho.seudominio.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name julinho.seudominio.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/julinho.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/julinho.seudominio.com/privkey.pem;
    
    # Proxy to Node.js app
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Dashboard static files
    location / {
        root /opt/julinho/app/dashboard/public;
        try_files $uri $uri/ /index.html;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

## 🔐 Segurança e Monitoramento

### Segurança:
```bash
# Configurar UFW
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS

# Instalar Fail2ban
apt install -y fail2ban

# Configurar SSH key-only
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

### Monitoramento:
```bash
#!/bin/bash
# scripts/monitor.sh

# Check disk space
df -h | awk '$5 > 80 { print "ALERT: Disk " $1 " is " $5 " full" }'

# Check memory usage
free -m | awk 'NR==2{printf "Memory Usage: %s/%sMB (%.2f%%)\n", $3,$2,$3*100/$2 }'

# Check CPU usage
top -bn1 | grep "Cpu(s)" | awk '{print "CPU Usage: " $2}'

# Check PM2 status
pm2 status

# Check services
systemctl is-active --quiet postgresql && echo "PostgreSQL: OK" || echo "PostgreSQL: ERROR"
systemctl is-active --quiet redis && echo "Redis: OK" || echo "Redis: ERROR"
systemctl is-active --quiet nginx && echo "Nginx: OK" || echo "Nginx: ERROR"
```

## 🔄 Script de Migração

### Migração de Dados do N8N:
```javascript
// scripts/migrate-n8n.js
const redis = require('redis');
const { Pool } = require('pg');

class N8NMigration {
  constructor() {
    this.redis = redis.createClient();
    this.db = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
  }

  async migrateRedisMemories() {
    console.log('Migrando memórias de conversa do Redis...');
    
    // Buscar todas as chaves de memória do N8N
    const keys = await this.redis.keys('wa:*');
    
    for (const key of keys) {
      const phone = key.replace('wa:', '');
      const messages = await this.redis.lrange(key, 0, -1);
      
      // Criar conversa no novo sistema
      const conversationResult = await this.db.query(
        'INSERT INTO conversations (phone, started_at, message_count) VALUES ($1, NOW(), $2) RETURNING id',
        [phone, messages.length]
      );
      
      const conversationId = conversationResult.rows[0].id;
      
      // Inserir mensagens
      for (const message of messages) {
        await this.db.query(
          'INSERT INTO messages (conversation_id, phone, content, direction) VALUES ($1, $2, $3, $4)',
          [conversationId, phone, message, 'inbound']
        );
      }
    }
    
    console.log(`Migradas ${keys.length} conversas do N8N`);
  }

  async generateInitialAnalytics() {
    console.log('Gerando analytics iniciais...');
    
    // Calcular estatísticas dos últimos 30 dias
    await this.db.query(`
      INSERT INTO analytics_daily (date, conversations_total, conversations_unique, messages_received)
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as conversations_total,
        COUNT(DISTINCT phone) as conversations_unique,
        SUM(message_count) as messages_received
      FROM conversations 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ON CONFLICT (date) DO UPDATE SET
        conversations_total = EXCLUDED.conversations_total,
        conversations_unique = EXCLUDED.conversations_unique,
        messages_received = EXCLUDED.messages_received
    `);
  }
}

// Executar migração
const migration = new N8NMigration();
migration.migrateRedisMemories()
  .then(() => migration.generateInitialAnalytics())
  .then(() => console.log('Migração concluída!'))
  .catch(console.error);
```

## 📈 Cronograma de Implementação

### Semana 1: Setup e Migração Core
- **Dias 1-2**: Setup do VPS (PostgreSQL, Redis, Nginx, PM2)
- **Dias 3-4**: Desenvolvimento da API webhook + integração Z-API
- **Dias 5-7**: Implementação do sistema de buffer (anti-spam)

### Semana 2: IA e Integrações
- **Dias 1-2**: Integração OpenAI com prompt exato do Julinho
- **Dias 3-4**: Sistema de memória Redis (contexto conversas)
- **Dias 5-7**: Integração Brevo (captura de leads)

### Semana 3: Analytics e Dashboard
- **Dias 1-2**: Schema PostgreSQL + coleta de métricas
- **Dias 3-5**: Dashboard web básico (overview + relatórios)
- **Dias 6-7**: APIs de relatórios + exportação dados

### Semana 4: Otimização e Deploy
- **Dias 1-2**: Testes de carga + otimização performance
- **Dias 3-4**: Sistema de backup + monitoramento
- **Dias 5-7**: Deploy produção + migração dados N8N

## 💰 Análise de Custos

### Custos Atuais (N8N):
- N8N Cloud: ~$20-50/mês (estimado)
- APIs: OpenAI + Z-API + Brevo (mantidos)

### Custos Nova Solução:
- **VPS**: $0 (já pago)
- **Domínio SSL**: ~$10/ano (se necessário)
- **APIs**: Mantidos (OpenAI + Z-API + Brevo)
- **Economia**: $240-600/ano

### ROI:
- **Economia Imediata**: $20-50/mês
- **Controle Total**: Debugging, customização, performance
- **Analytics**: Insights valiosos para otimização
- **Escalabilidade**: Sem limitações de plataforma

## ✅ Checklist de Validação

### Funcionalidades Core (Paridade N8N):
- [ ] Webhook WhatsApp funcional
- [ ] Sistema anti-spam (buffer + sentinela)
- [ ] Processamento IA com prompt Julinho
- [ ] Memória de contexto persistente
- [ ] Captura de leads Brevo
- [ ] Envio de respostas Z-API

### Novas Funcionalidades:
- [ ] Dashboard analytics web
- [ ] APIs de relatórios
- [ ] Sistema de backup automático
- [ ] Monitoramento de recursos
- [ ] Logs estruturados

### Performance:
- [ ] Latência < 5s (webhook → resposta)
- [ ] Uso RAM < 4GB
- [ ] Uso CPU < 60% média
- [ ] Uptime > 99%

### Segurança:
- [ ] HTTPS obrigatório
- [ ] Rate limiting implementado
- [ ] Firewall configurado
- [ ] Backups funcionais

## 📞 Contatos e Recursos

### APIs Utilizadas:
- **Z-API**: https://z-api.io (instância existente)
- **OpenAI**: https://platform.openai.com
- **Brevo**: https://brevo.com (conta existente)

### Repositórios:
- **Projeto Principal**: A ser criado
- **Backup Configs**: A ser criado (privado)

### Suporte:
- **VPS**: Hostinger Support
- **Domain**: Registro atual
- **SSL**: Let's Encrypt (gratuito)

---

**Observação**: Este plano deve ser usado como referência completa para implementação. Todos os códigos, configurações e scripts mencionados devem ser adaptados conforme necessário durante o desenvolvimento.