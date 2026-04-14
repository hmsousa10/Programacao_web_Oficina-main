# 🌐 Como Colocar o Site Online — Guia Completo

## O que precisas?

Para o site ir ao ar com um endereço como `www.oficinachaves.pt`, precisas de **duas coisas**:

| | O que é | Exemplo | Custo Anual |
|---|---|---|---|
| **Domínio** | O endereço do site | `oficinachaves.pt` | ~10–15€ |
| **Alojamento** | Onde ficam os ficheiros | Servidor na internet | ~30–60€ |
| **TOTAL** | | | **~40–75€/ano** |

---

## 🏆 Opção 1 — Netlify (GRATUITA — Recomendada para começar)

> [!TIP]
> **Para testar e lançar rapidamente**, o Netlify permite hospedar o teu site de forma **totalmente gratuita** e em menos de 5 minutos. A única limitação é que o domínio fica `oficina-carlos.netlify.app` em vez de `.pt`.

### Passos:
1. Vai a [netlify.com](https://www.netlify.com) e cria conta gratuita (com Google/email)
2. Clica em **"Add new site" → "Deploy manually"**
3. Arrasta a **pasta inteira** da oficina para a caixa que aparece
4. O site fica online em segundos em `xxx.netlify.app`
5. ✅ Já tens HTTPS (cadeado) automático e gratuito

**Custo: 0€/ano**

---

## 🇵🇹 Opção 2 — PTisp (Domínio .pt + Hosting Português)

> [!IMPORTANT]
> Recomendado se queres um `.pt` PROFISSIONAL e suporte em **português**.

**Site:** [ptisp.pt](https://www.ptisp.pt)

| Plano | Espaço | Domínio .pt | Preço/Ano |
|---|---|---|---|
| **Start** | 5 GB | ✅ Incluído 1º ano | **~36€/ano** |
| **Business** | 20 GB | ✅ Incluído | **~60€/ano** |

> O plano **Start** é mais do que suficiente para este site.

### Passos:
1. Vai a [ptisp.pt](https://www.ptisp.pt) → **Alojamento Web**
2. Escolhe o plano **Start** → regista o domínio (ex: `oficinachavescarlos.pt`)
3. Faz o pagamento (aceita MB Way, cartão, transferência)
4. Entra no **cPanel** (painel de controlo)
5. Vai a **"Gestor de Ficheiros"** → pasta `public_html`
6. Clica em **"Upload"** e carrega todos os ficheiros do site
7. Em 5 minutos o site está ao vivo!

---

## 🌍 Opção 3 — Hostinger (Mais Barato do Mercado)

**Site:** [hostinger.pt](https://www.hostinger.pt)

| Plano | Domínio .com | Preço/Ano (promoção) |
|---|---|---|
| **Premium** | ✅ Gratuito 1º ano | **~23–35€/ano** |

> [!WARNING]
> O Hostinger frequentemente tem promoções de até 80% no 1º ano, mas o **preço de renovação** pode ser mais alto (~60€). Verifica sempre o preço de **renovação** antes de comprar.

---

## 🔤 Que Nome de Domínio Escolher?

Sugestões de nomes disponíveis (verificar disponibilidade):

| Domínio | Adequado para |
|---|---|
| `oficinachaves.pt` | ⭐ Ideal — localização clara |
| `carlossilva-oficina.pt` | Nome + serviço |
| `autorepchaves.pt` | Curto e profissional |
| `oficina-m3.pt` | Se a marca "M3" for reconhecida |

> [!NOTE]
> Para registrar um `.pt` precisas de **NIF português**. Se não tens, usa `.com` (qualquer pessoa pode registar).

---

## 📋 Checklist Antes de Publicar

- [ ] Substituir `+351 276 000 000` pelo número real da oficina em todos os ficheiros
- [ ] Substituir os `#` dos links de redes sociais (Facebook/Instagram) pelos links reais
- [ ] Configurar o **EmailJS** para receber emails no Gmail (guia no `script.js`)
- [ ] Substituir `SUA_PUBLIC_KEY_AQUI` pelos dados reais do EmailJS
- [ ] Testar o formulário de contacto após configurar o EmailJS
- [ ] Fazer upload de todas as fotos reais em `assets/`

---

## 💡 Resumo de Custos Anuais

| Opção | Domínio | Hosting | Total/Ano |
|---|---|---|---|
| **Netlify Grátis** | — (sem .pt) | Grátis | **0€** |
| **PTisp Start** | .pt incluído | Incluído | **~36€** |
| **Hostinger Premium** | .com grátis 1º ano | Incluído | **~25–35€** |

> [!TIP]
> **Recomendação:** Começa com **Netlify grátis** para testar, depois migra para **PTisp** quando quiseres o domínio `.pt` profissional. O processo de migração demora menos de 1 hora.
