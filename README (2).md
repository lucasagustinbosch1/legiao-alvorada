# Legião Alvorada: servidor online (sem cadastro para os jogadores)

Os jogadores só abrem o endereço, tocam em JOGAR ONLINE e criam uma sala (recebem um código de 4 letras)
ou entram com um código / em uma sala aberta. Até 4 jogadores por sala.

## Rodar no computador
    npm install
    npm start        # abre em http://localhost:3000

## Colocar na internet (grátis, uma vez só)
1. Suba esta pasta para um repositório no GitHub.
2. Em render.com: New > Web Service > escolha o repositório.
   Build Command: `npm install`  ·  Start Command: `npm start`
3. O Render dá um endereço https. Esse é o link do jogo para todos (funciona em celular, tela cheia).
   (Railway, Fly.io, Glitch e Replit funcionam do mesmo jeito.)

Obs.: no plano grátis do Render o servidor "dorme" após alguns minutos sem uso e leva ~30 s para acordar.

## Conversa por voz
Dentro da sala há um botão de microfone (canto superior direito; tecla V no computador).
Quem liga o microfone passa a ser ouvido pelos outros jogadores da sala. Exige https (o Render já fornece)
e a permissão de microfone do navegador. A voz vai direto entre os celulares (WebRTC); o servidor só faz a ligação inicial.
