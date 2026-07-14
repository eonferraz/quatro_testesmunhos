# Timeline

Aplicação estática em HTML, CSS e JavaScript puro que apresenta, em ordem cronológica, os textos integrais de Mateus, Marcos, Lucas e João. Cada evento ocupa uma linha e mantém as passagens paralelas lado a lado.

## Como executar

O navegador normalmente bloqueia o carregamento de JSON por `fetch` quando o `index.html` é aberto diretamente por `file://`. Por isso, execute o projeto por um servidor HTTP local.

No Windows, dê dois cliques em `abrir-servidor.bat` e acesse `http://localhost:8000`. É necessário ter Python instalado. Como alternativa, em um terminal na pasta do projeto, execute:

```sh
python -m http.server 8000
```

### Flask

Instale as dependências e inicie a aplicação:

```sh
python -m pip install -r requirements.txt
python app.py
```

A aplicação usa a variável de ambiente `PORT` quando ela estiver definida e expõe
`GET /health` para verificações de disponibilidade. Em produção, o ponto de entrada
WSGI é `app:app`; o `Procfile` e o `Dockerfile` já iniciam o Gunicorn com esse objeto.

Para executar em um ambiente compatível com Docker, incluindo o Runway:

```sh
docker build -t timeline-evangelhos .
docker run --rm -p 8000:8000 -e PORT=8000 timeline-evangelhos
```

Os dados são carregados automaticamente, inclusive ao abrir `index.html` diretamente. O arquivo
`data/events-data.js` é a cópia compatível com `file://`; ao atualizar `data/events.json`, essa cópia
também deve ser regenerada.

## Dados — versão 2.0

O arquivo principal `data/events.json` contém 163 eventos e todo o conteúdo necessário à interface. A aplicação carrega somente esse arquivo.

Cada evento possui esta estrutura essencial:

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
      "verses": [{ "id": "MAT.3.13", "chapter": 3, "verse": 13, "text": "Texto integral" }],
      "fullText": "13. Texto integral..."
    },
    "joao": null
  },
  "textStatus": "complete"
}
```

- `order` determina a posição cronológica.
- `phase` cria os agrupamentos, o filtro e a navegação lateral.
- `passages` é a fonte principal de renderização. A interface percorre `verses` e não usa `fullText` como bloco único.
- Uma passagem `null` indica que o evento não foi relatado naquele Evangelho.
- `references` foi preservado para compatibilidade e também é validado no carregamento.
- O campo opcional `note` registra observações de harmonização.

## Arquivos auxiliares

- `data/bible_texts.json`: base auxiliar deduplicada com os 3.522 versículos únicos; não é carregada pela interface.
- `data/events.references-only.json`: cópia do formato anterior, sem textos incorporados.
- `data/validation-report.json`: relatório de cobertura dos textos.

## Recursos

- cinco colunas no desktop e tablet, com rolagem horizontal e primeira coluna fixa;
- apresentação vertical no celular, identificando cada Evangelho;
- textos integrais sempre visíveis, sem expansão, modal ou truncamento;
- pesquisa sem distinção de caixa ou acentos por evento, fase, referência e texto dos versículos;
- filtros por fase e por eventos paralelos;
- contadores de eventos, paralelos e versículos visíveis;
- navegação lateral pelas fases;
- impressão de todos os textos.

## Edição

Edite `data/events.json` sem alterar a estrutura das passagens. Toda referência não vazia deve possuir uma passagem correspondente, com `reference` idêntica e pelo menos um item em `verses`; cada versículo precisa de número e texto não vazio. Não duplique os textos no HTML ou no JavaScript.
