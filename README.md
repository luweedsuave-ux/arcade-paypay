# PAY-PAY Arcade · V3

## Jogar

Extraia o ZIP e abra `index.html` no Chrome, Edge ou outro navegador moderno. Mantenha os arquivos e a pasta `Assets/` juntos. A partida funciona com os arquivos locais.

- **Totem e celular** — toque nas setas ou deslize na área da partida na direção desejada. O personagem vira assim que o caminho permitir. Use o ícone de tela cheia onde o navegador oferecer esse recurso.
- **Computador** — use as setas do teclado, WASD ou os botões na tela.
- **Som** — começa desligado. O ícone de alto-falante ativa os efeitos.

## Partida

São três vidas e 90 segundos de jogo. Cada bud vale 10 pontos. Os joints valem 100 pontos. O leque vale 50 pontos e deixa os fantasmas vulneráveis por cinco segundos. Capturar um fantasma nesse intervalo vale 150 pontos.

Escolha a rã ou o morcego ao começar cada partida. O personagem escolhido segue com você nas quatro fases. Recolha todos os buds para avançar por GoGreen, Origin, Classic e Premium. Cada labirinto concluído vale 200 pontos. Ao zerar o arcade, cada segundo restante vale cinco pontos extras.

O ranking registra as dez melhores partidas neste navegador. Os números de jogador são automáticos. Os empates são decididos por labirintos concluídos, menor tempo de jogo e ordem de registro. Em navegadores que restringem o armazenamento ao abrir arquivos locais, o placar pode durar só até o fechamento da página. Para manter o ranking entre sessões de evento, use o mesmo navegador e endereço publicado.

## Publicar no GitHub e na Vercel

Envie o conteúdo desta pasta à raiz do repositório, incluindo `Assets/`. Na Vercel, importe o repositório como projeto estático, usando a raiz que contém `index.html` e sem comando de build.

## Atualizar

- `index.html` contém as telas e os controles.
- `Style.css` contém o layout 9:16 e as cores da interface.
- `script.js` contém regras, pontuação, fases e ranking. A ordem, os mapas e as paletas do labirinto ficam em `STAGES`.
- `Assets/` contém logos, fundos, a arte Mixtray e o desenho dos sprites. Os efeitos sonoros são sintetizados localmente pelo jogo.
