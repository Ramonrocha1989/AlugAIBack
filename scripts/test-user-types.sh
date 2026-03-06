#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "🧪 Testando diferenciação de Pessoa Física vs Empresa"
echo ""

# Teste 1: Cadastro de Pessoa Física
echo "1️⃣ Testando cadastro de PESSOA FÍSICA..."
INDIVIDUAL_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "INDIVIDUAL",
    "fullName": "João Silva",
    "cpf": "12345678901",
    "phone": "51999887766",
    "email": "joao.silva@email.com",
    "password": "MinhaSenh@123"
  }')

echo "Resposta: $INDIVIDUAL_RESPONSE"
echo ""

# Teste 2: Cadastro de Empresa
echo "2️⃣ Testando cadastro de EMPRESA..."
COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "COMPANY",
    "companyName": "Empresa LTDA",
    "cnpj": "12345678000199",
    "responsibleName": "Maria Santos",
    "phone": "51999887755",
    "email": "empresa@email.com",
    "password": "MinhaSenh@123"
  }')

echo "Resposta: $COMPANY_RESPONSE"
echo ""

# Teste 3: Validação - Pessoa Física sem fullName
echo "3️⃣ Testando validação - INDIVIDUAL sem fullName (deve falhar)..."
VALIDATION_ERROR=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "INDIVIDUAL",
    "phone": "51999887744",
    "email": "teste@email.com",
    "password": "MinhaSenh@123"
  }')

echo "Resposta: $VALIDATION_ERROR"
echo ""

# Teste 4: Validação - Empresa sem responsibleName
echo "4️⃣ Testando validação - COMPANY sem responsibleName (deve falhar)..."
VALIDATION_ERROR2=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "COMPANY",
    "companyName": "Outra Empresa",
    "phone": "51999887733",
    "email": "outra@email.com",
    "password": "MinhaSenh@123"
  }')

echo "Resposta: $VALIDATION_ERROR2"
echo ""

echo "✅ Testes concluídos!"
