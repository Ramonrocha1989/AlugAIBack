# ✅ Checklist: Setup Testes + CI/CD

## 📋 Passo a Passo

### 1. Instalação (Já feito ✅)
- [x] Dependências instaladas
- [x] Jest configurado
- [x] Scripts adicionados ao package.json

### 2. Testar Localmente

```bash
# Rodar todos os testes
./run-tests.sh
```

**Resultado esperado:**
```
✅ Unit tests passed!
✅ E2E tests passed!
🎉 All tests passed successfully!
```

### 3. Configurar GitHub (5 minutos)

#### 3.1 Proteger Branch Main
1. Vá para: https://github.com/SEU_USUARIO/SEU_REPO/settings/branches
2. Clique em **Add rule**
3. Branch name pattern: `main`
4. Marque:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. Em "Status checks", selecione: **Run Tests**
6. Clique em **Create**

#### 3.2 Verificar Actions
1. Vá para: https://github.com/SEU_USUARIO/SEU_REPO/actions
2. Verifique se o workflow aparece

### 4. Testar CI/CD (10 minutos)

```bash
# 1. Criar branch de teste
git checkout -b test/ci-cd

# 2. Fazer uma mudança simples
echo "# CI/CD Test" >> TEST.md

# 3. Commit e push
git add .
git commit -m "test: verificar CI/CD"
git push origin test/ci-cd

# 4. Criar Pull Request no GitHub
# Aguardar testes rodarem (2-3 min)

# 5. Se passou ✅, fazer merge
git checkout main
git merge test/ci-cd
git push origin main

# 6. Verificar deploy no Railway
```

### 5. Verificar Railway (2 minutos)

1. Acesse: https://railway.app/dashboard
2. Selecione seu projeto
3. Vá para **Deployments**
4. Verifique se o deploy foi feito após o merge

### 6. Monitorar (Contínuo)

#### GitHub Actions
- URL: https://github.com/SEU_USUARIO/SEU_REPO/actions
- Veja todos os testes em tempo real

#### Railway
- URL: https://railway.app/dashboard
- Veja logs e status do deploy

#### Health Check
```bash
curl https://SEU_APP.railway.app/api/health
```

## 🎯 Checklist de Validação

### Testes Locais
- [ ] `npm test` passa
- [ ] `npm run test:e2e` passa
- [ ] `./run-tests.sh` passa
- [ ] Cobertura > 40%

### GitHub
- [ ] Branch main protegida
- [ ] Workflow aparece em Actions
- [ ] PR roda testes automaticamente
- [ ] Merge bloqueado se testes falharem

### Railway
- [ ] Deploy automático após merge
- [ ] Health check funcionando
- [ ] Logs disponíveis
- [ ] App rodando

### Fluxo Completo
- [ ] Feature branch → PR → Testes → Merge → Deploy
- [ ] Testes falhando bloqueiam merge
- [ ] Deploy só acontece com testes passando

## 🚨 Troubleshooting

### Testes falhando localmente
```bash
# Ver detalhes
npm test -- --verbose

# Limpar cache
npm run test -- --clearCache

# Reinstalar
rm -rf node_modules package-lock.json
npm install
```

### GitHub Actions falhando
1. Vá para Actions tab
2. Clique no workflow que falhou
3. Veja os logs
4. Corrija e push novamente

### Railway não fazendo deploy
1. Verifique se está conectado ao GitHub
2. Verifique se a branch é `main`
3. Veja logs no Railway dashboard

## 📞 Suporte

- **Documentação**: [TESTING.md](./TESTING.md)
- **Guia Rápido**: [TESTING_QUICKSTART.md](./TESTING_QUICKSTART.md)
- **Implementação**: [TESTING_IMPLEMENTATION.md](./TESTING_IMPLEMENTATION.md)

## ✨ Pronto!

Após completar este checklist, você terá:
- ✅ Testes automatizados funcionando
- ✅ CI/CD pipeline ativo
- ✅ Deploy seguro e automático
- ✅ Proteção contra bugs em produção

**Tempo total**: ~20 minutos
