# Brasa-Club

Cardápio digital de uma hamburgueria fictícia. O cliente escolhe os produtos, revisa o carrinho, informa o endereço e a forma de pagamento e abre o pedido no WhatsApp para enviá-lo à loja.

O destaque da página inicial apresenta os cinco combos em rotação automática com transição lateral a cada cinco segundos, aproximadamente. O botão ao lado dos indicadores permite pausar e retomar. A rotação pausa quando a página está fora de vista, ao abrir um painel e para quem usa a preferência de movimento reduzido.

## Abrir no computador

Abra o arquivo [index.html](./index.html) em um navegador moderno. Mantenha as pastas `assets`, `styles` e `scripts` junto ao arquivo. O catálogo, as fontes e as fotografias são locais. O envio pelo WhatsApp requer internet.

Para desenvolver, use Node.js 22 ou superior e npm. Na pasta do projeto, execute

```sh
npm run dev
```

Abra [localhost na porta 5173](http://localhost:5173). O servidor usa a biblioteca padrão do Node e serve os arquivos diretamente. Recarregue a página para ver suas alterações. Use `Ctrl+C` para encerrá-lo.

## Testar no celular

Conecte o computador e o celular à mesma rede Wi-Fi. No computador, execute

```sh
npm run dev -- --host 0.0.0.0
```

Abra no navegador do celular o endereço com o **IP local do computador** exibido no terminal, por exemplo `http://192.168.1.20:5173`. Se o Windows solicitar acesso à rede, permita a conexão na rede privada em uso. Para escolher outra porta, acrescente `--port 8080`.

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| [index.html](./index.html) | Entrada compartilhada pelos modos arquivo e servidor. |
| [scripts/catalog.js](./scripts/catalog.js) | Configuração da loja, categorias, produtos, preços, combos e ofertas. |
| [scripts/menu.js](./scripts/menu.js) | Navegação, destaques, busca, favoritos e detalhes dos produtos. |
| [scripts/order.js](./scripts/order.js) | Carrinho, cálculo dos descontos, entrega, pagamento e mensagem do pedido. |
| [scripts/ui.js](./scripts/ui.js) | Ícones de interface e formatação de valores em reais. |
| [styles](./styles) | Aparência do cardápio e do painel de pedido, incluindo os layouts para celular. |
| [assets](./assets) | Fotografias, fundo, marca e fontes usadas pela interface. |
| [tools/dev-server.mjs](./tools/dev-server.mjs) | Servidor de desenvolvimento que entrega a página e seus recursos estáticos. |

## Editar o cardápio

O catálogo inicial contém cinco hambúrgueres, cinco pizzas, cinco bebidas, cinco sobremesas, cinco combos e cinco ofertas. Altere os dados em [catalog.js](./scripts/catalog.js).

- **Produto** — use um `id` único e estável. O arquivo de imagem correspondente fica em `assets/food/<id>.webp`. Informe os preços em centavos inteiros. Por exemplo, `3790` representa R$ 37,90.
- **Combo** — em `items`, relacione os IDs de um salgado, uma bebida e uma sobremesa. Defina o preço promocional do trio. O catálogo calcula o preço original pela soma dos produtos.
- **Oferta** — em `item`, vincule o produto original e atribua o preço promocional. Fotos de ofertas e combos ficam em `assets/campaign/<id>.webp`.
- **Dados da loja** — em `service`, configure `whatsapp` com país, DDD e telefone, apenas dígitos, e `estimatedTime` com a estimativa exibida ao cliente. A configuração inicial usa (71) 98378-9492 e 35–50 min.

Os componentes de cada combo entram como linhas individuais no carrinho. O preço do trio é dividido proporcionalmente entre os produtos, com arredondamento em centavos. Se o cliente remover parte do combo, cada trio completo conserva seu desconto e os itens restantes voltam ao preço avulso. O carrinho identifica a origem de cada linha para distinguir uma oferta, um combo e uma compra avulsa do mesmo produto.

As listas e o destaque no celular usam imagens leves em `assets/previews`. A tela de detalhes usa a fotografia em resolução maior. Ao trocar as fotos, as miniaturas podem ser atualizadas executando `python tools/prepare-previews.py` em um ambiente com Pillow instalado. As miniaturas já acompanham o projeto pronto.

## Pedido e armazenamento

Carrinho e favoritos ficam no `localStorage` do navegador, quando disponível. Cada dispositivo e endereço de acesso mantém seus próprios dados. Nome, endereço e forma de pagamento permanecem na memória da página durante o preenchimento.

O MVP funciona sem banco de dados. A última etapa abre uma mensagem com itens, quantidades, descontos, total, entrega e pagamento. O cliente envia a mensagem e a loja confirma o pedido pelo WhatsApp. O tempo exibido é uma estimativa configurada pela loja. O pagamento é combinado na entrega.

## Identidade visual e fontes

As fotografias dos produtos e campanhas e o fundo de brasas foram gerados para este projeto. As três versões monocromáticas do símbolo estão em [assets/brand](./assets/brand). A imagem fornecida em [identidade-visual](./identidade-visual) orientou a direção visual.

A direção das imagens no ImageGen integrado seguiu os ingredientes de cada item do catálogo. Para os [produtos](./assets/food), o pedido foi de fotografia gastronômica de estúdio, com luz quente, textura realista, produto inteiro e fundo transparente. Para os [combos e ofertas](./assets/campaign), as fotos individuais serviram de referência para novos enquadramentos. O fundo panorâmico usa carvão em brasa, fumaça e faíscas âmbar, com a esquerda escura para a leitura do destaque.

DM Sans e Barlow Condensed são distribuídas sob a SIL Open Font License 1.1. Os arquivos das fontes e os respectivos termos acompanham o projeto. [Licença de DM Sans](./assets/fonts/DM-Sans-LICENSE.txt) · [Licença de Barlow Condensed](./assets/fonts/Barlow-Condensed-LICENSE.txt)
