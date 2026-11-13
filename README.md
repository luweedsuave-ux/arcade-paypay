# PAY-PAY Arcade · V8

## Jogar

Extraia o ZIP e abra `index.html` no Chrome, Edge ou outro navegador moderno. Mantenha os arquivos e a pasta `Assets/` juntos. A partida funciona com os arquivos locais.

- **Totem e celular** — toque nas setas ou deslize na área da partida na direção desejada. O personagem vira assim que o caminho permitir. Use o ícone de tela cheia onde o navegador oferecer esse recurso.
- **Computador** — use as setas do teclado, WASD ou os botões na tela.
- **Som** — começa desligado. O ícone de alto-falante ativa os efeitos.

## Partida

São três vidas e 2 minutos e 30 segundos para a partida inteira. Cada bud vale 10 pontos. O leque vale 50 pontos e deixa os fantasmas vulneráveis por cinco segundos. Capturar um fantasma nesse intervalo vale 150 pontos.

Há um baseado em cada fase principal e dois no Hardcore. Cada um vale 100 pontos e sorteia lentidão por 6 segundos, invencibilidade com salto ou sobrevoo por 6 segundos ou uma larica que fica disponível por até 10 segundos. Pegue a larica para ganhar uma vida extra. A mensagem pausa o jogo por um instante e o tempo do efeito começa a correr quando a partida volta. Se você pegar o segundo baseado com um efeito ativo, o novo efeito substitui o anterior.

Escolha a rã ou o morcego ao começar cada partida. O personagem escolhido segue com você nas quatro fases. Recolha todos os buds para avançar por GoGreen (30), Origin (42), Classic (54) e Premium (66). Cada labirinto concluído vale 200 pontos. Ao zerar o arcade, cada segundo restante vale cinco pontos extras.

Cada linha tem uma paleta própria. GoGreen é verde, Origin é marrom, Classic combina azul com amarelo PAY-PAY e Premium combina preto com branco.

Na vitória das quatro fases, você pode salvar seu nome no ranking e abrir o Hardcore. O Hardcore é um labirinto bônus com 55 segundos, uma vida inicial e cinco fantasmas mais rápidos. Ele usa a mesma rã ou morcego que você escolheu na partida principal.

O ranking registra as dez melhores partidas do modo principal neste navegador. Fora do top 10, a vitória nomeada mais recente recebe destaque abaixo da lista. Os empates são decididos por labirintos concluídos, menor tempo de jogo e ordem de registro. Em navegadores que restringem o armazenamento ao abrir arquivos locais, o placar pode durar só até o fechamento da página. Para manter o ranking entre sessões de evento, use o mesmo navegador e endereço publicado.

## Publicar no GitHub e na Vercel

Envie o conteúdo desta pasta à raiz do repositório, incluindo `Assets/`. Na Vercel, importe o repositório como projeto estático, usando a raiz que contém `index.html` e sem comando de build.

## Atualizar

- `index.html` contém as telas e os controles.
- `Style.css` contém o layout 9:16 e as cores da interface.
- `script.js` contém regras, pontuação, fases e ranking. A ordem, os mapas e as paletas do labirinto ficam em `STAGES`.
- `Assets/` contém logos, fundos, a arte Mixtray e o desenho dos sprites. Os efeitos sonoros são sintetizados localmente pelo jogo.
