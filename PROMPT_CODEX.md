# Prompt para o Codex — adaptar a timeline para textos integrais

Você está trabalhando em uma aplicação estática existente, construída apenas com HTML, CSS e JavaScript puro. O projeto exibe uma timeline cronológica comparativa dos Evangelhos em cinco colunas: Evento, Mateus, Marcos, Lucas e João.

## Contexto dos dados

O arquivo `data/events.json` foi atualizado para a versão 2.0.0 e agora contém 163 eventos e os textos integrais de todas as passagens referenciadas.

A estrutura anterior `event.references` foi preservada para compatibilidade. A nova estrutura principal é `event.passages`.

Exemplo simplificado:

```json
{
  "event": "Jesus foi batizado",
  "order": 15,
  "phase": "Preparação e início do ministério",
  "references": {
    "mateus": "Mt 3:13-17",
    "marcos": "Mc 1:9-11",
    "lucas": "Lc 3:21-22",
    "joao": ""
  },
  "passages": {
    "mateus": {
      "reference": "Mt 3:13-17",
      "verseCount": 5,
      "verses": [
        {
          "id": "MAT.3.13",
          "chapter": 3,
          "verse": 13,
          "text": "Texto integral do versículo"
        }
      ],
      "fullText": "13. Texto integral do versículo..."
    },
    "marcos": {},
    "lucas": {},
    "joao": null
  },
  "textStatus": "complete"
}
```

Também existe `data/bible_texts.json`, que contém os 3.522 versículos únicos em uma estrutura sem duplicação. Entretanto, a interface principal deve carregar somente `data/events.json`, porque ele já contém tudo o que é necessário para renderizar cada evento.

## Objetivo

Adapte a aplicação para mostrar o texto completo de todas as passagens diretamente na timeline. Não criar resumo, prévia, modal, acordeão, botão “Ler mais” ou conteúdo recolhido. Todos os versículos devem ficar visíveis assim que a página for carregada.

## Requisitos obrigatórios

1. Preserve a estrutura de cinco colunas:
   - Evento;
   - Mateus;
   - Marcos;
   - Lucas;
   - João.

2. Preserve o alinhamento cronológico:
   - cada evento continua sendo uma linha;
   - passagens paralelas permanecem lado a lado na mesma linha;
   - a altura da linha deve acompanhar a maior passagem daquele evento;
   - todas as células devem começar alinhadas pelo topo.

3. Cabeçalhos:
   - mantenha o cabeçalho geral fixo durante a rolagem vertical;
   - mantenha os nomes Mateus, Marcos, Lucas e João sempre visíveis;
   - mantenha a primeira coluna, Evento, fixa à esquerda durante a rolagem horizontal;
   - ajuste corretamente `z-index`, fundo e bordas para evitar sobreposição visual.

4. Renderização de cada passagem:
   - use `passage.reference` como título da célula;
   - percorra obrigatoriamente `passage.verses`;
   - crie um elemento próprio para cada versículo;
   - mostre o número do versículo usando `<sup>`;
   - mostre o texto integral ao lado do número;
   - não renderize o campo `fullText` como um único bloco quando o array `verses` estiver disponível;
   - não use `innerHTML` com conteúdo vindo do JSON. Crie os elementos com `document.createElement()` e atribua texto com `textContent`.

5. Evangelho sem registro:
   - quando `event.passages[book] === null`, mostrar “Não relatado neste Evangelho”;
   - aplicar estilo discreto e claramente diferente de uma passagem existente;
   - não mostrar apenas um traço.

6. Não truncar textos:
   - remover qualquer `line-clamp`;
   - não usar `max-height` com `overflow: hidden` nas passagens;
   - não usar reticências automáticas;
   - não ocultar versículos em hover, tooltip, modal ou expansão.

7. Rolagem e largura:
   - a timeline deve ter rolagem vertical normal;
   - o quadro deve aceitar rolagem horizontal em telas menores;
   - cada coluna de Evangelho deve ter largura mínima confortável para leitura, entre aproximadamente 340 e 420 pixels;
   - a coluna Evento deve ter largura mínima entre aproximadamente 240 e 300 pixels;
   - não comprimir as cinco colunas até deixar o texto ilegível.

8. Pesquisa e filtros:
   - preservar os filtros atuais por fase e passagens paralelas;
   - atualizar a pesquisa para procurar também dentro de `passage.verses[].text`;
   - a busca deve continuar procurando pelo nome do evento, fase e referência;
   - pesquisar sem diferenciar maiúsculas, minúsculas ou acentos;
   - quando a pesquisa encontrar uma palavra no texto bíblico, manter o evento inteiro visível. Não remover outros Evangelhos da mesma linha.

9. Contadores:
   - preservar o contador de eventos exibidos;
   - preservar o contador de eventos paralelos;
   - opcionalmente, adicionar um contador de versículos atualmente exibidos, desde que não altere a simplicidade da interface.

10. Desempenho:
    - o JSON tem aproximadamente 1,5 MB e 3.637 ocorrências de versículos;
    - use `DocumentFragment` na montagem da timeline;
    - evite recalcular `countReferences()` e textos pesquisáveis repetidamente dentro de loops internos;
    - ao aplicar os dados, crie previamente uma propriedade interna de pesquisa normalizada para cada evento, sem alterar o JSON original;
    - considere `content-visibility: auto` e `contain-intrinsic-size` nas linhas para melhorar a rolagem;
    - não implemente virtualização que remova eventos do DOM, porque isso prejudicaria impressão, busca do navegador e comparação geral.

11. Responsividade:
    - desktop: manter as cinco colunas e permitir rolagem horizontal;
    - tablet: manter a tabela horizontal, sem reduzir excessivamente a fonte;
    - celular: cada evento pode virar um bloco vertical, mantendo a ordem Evento, Mateus, Marcos, Lucas e João;
    - no celular, identificar claramente o nome de cada Evangelho dentro da própria seção;
    - não usar abas no celular, pois o texto integral precisa permanecer visível.

12. Tipografia e leitura:
    - usar tamanho mínimo confortável para o texto bíblico;
    - aplicar `line-height` entre aproximadamente 1.55 e 1.75;
    - não justificar o texto se isso gerar espaços exagerados;
    - separar visualmente os versículos sem criar grandes vazios;
    - deixar a referência visualmente destacada no início da célula;
    - preservar uma aparência sóbria, editorial e adequada a estudo bíblico.

13. Impressão:
    - criar ou revisar `@media print`;
    - imprimir todos os textos completos;
    - remover controles, barra lateral, botões e elementos de navegação;
    - impedir que uma referência fique separada dos primeiros versículos quando possível;
    - não ocultar eventos ou passagens;
    - permitir quebra de página entre eventos.

14. Acessibilidade:
    - manter HTML semântico;
    - identificar cada passagem com `aria-label` contendo Evangelho e referência;
    - preservar navegação por teclado nos controles;
    - garantir contraste adequado;
    - não depender apenas de cores para indicar passagem paralela ou ausência de registro.

## Alterações esperadas por arquivo

### `js/app.js`

- substituir a renderização atual de `reference-card` pela renderização integral de `event.passages`;
- criar funções pequenas e separadas, por exemplo:
  - `renderPassage(passage, book)`;
  - `renderVerse(verse)`;
  - `createMissingPassage(book)`;
  - `buildSearchIndex(event)`;
  - `countDisplayedVerses(events)`;
- manter a validação de compatibilidade com `references`;
- ampliar `validateData()` para confirmar que, quando existe uma referência, existe uma passagem com `verses` não vazio;
- mostrar erro compreensível caso o JSON esteja incompleto.

### `css/styles.css`

- adaptar o grid para textos longos;
- garantir `align-items: stretch` nas linhas e alinhamento superior no conteúdo;
- criar classes como:
  - `.passage-card`;
  - `.passage-reference`;
  - `.passage-verses`;
  - `.verse`;
  - `.verse-number`;
  - `.passage-missing`;
- revisar cabeçalho fixo e primeira coluna fixa;
- implementar responsividade e impressão;
- não usar truncamento.

### `index.html`

- alterar o template da linha somente se necessário;
- manter os controles atuais;
- atualizar textos de ajuda para informar que a timeline exibe os versículos integrais;
- não escrever eventos ou textos bíblicos diretamente no HTML.

### `README.md`

- documentar a versão 2.0 do JSON;
- explicar a estrutura `passages`;
- informar que `references` foi preservado por compatibilidade;
- informar que a aplicação deve ser executada via servidor HTTP local;
- documentar que `bible_texts.json` é uma base deduplicada auxiliar.

## Validações finais

Antes de concluir, confirme por código que:

- existem exatamente 163 eventos;
- todos os eventos estão ordenados por `order`;
- toda referência não vazia possui uma passagem correspondente;
- toda passagem possui pelo menos um versículo;
- nenhum versículo possui texto vazio;
- o evento 15 mostra Mateus 3:13-17, Marcos 1:9-11 e Lucas 3:21-22;
- o evento 59 mostra os quatro Evangelhos lado a lado;
- o evento 105 mostra João 10:22-39 integralmente;
- o evento 137 mostra as quatro predições da negação de Pedro;
- o evento 154 mostra os quatro relatos do túmulo vazio;
- o evento 162 mostra Mateus 28:16-20 e Marcos 16:15-18;
- a pesquisa encontra palavras presentes somente no texto dos versículos;
- a impressão não corta o texto por causa de `overflow` ou altura máxima.

## Restrições

- não alterar a ordem, os títulos, as fases ou as referências dos 163 eventos;
- não corrigir ou modernizar o texto bíblico durante a implementação;
- não buscar textos em APIs externas;
- não adicionar framework, biblioteca, backend ou etapa de build;
- não duplicar manualmente conteúdo no HTML ou no JavaScript;
- não remover os filtros, a navegação por fases ou os indicadores existentes;
- não entregar apenas uma proposta: implemente as alterações diretamente nos arquivos do projeto e apresente um resumo dos arquivos modificados e dos testes realizados.
