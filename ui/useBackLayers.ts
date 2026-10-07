import { useEffect, useRef } from 'react';

/**
 * Faz o botão "voltar" (do navegador, do celular ou do controle remoto)
 * desfazer UMA tela de cada vez, na ordem em que a pessoa entrou:
 *
 *   início → categoria (página 3) → detalhes → episódios → player
 *
 * Cada tela aberta soma +1 em `depth` (e cada página da categoria também).
 * O hook mantém o histórico do navegador com exatamente essa quantidade de
 * entradas:
 *   • abriu mais uma tela        → empilha uma entrada (pushState);
 *   • fechou por botão da tela   → desempilha (history.go) sem fechar nada de novo;
 *   • apertou "voltar"           → chama `closeTop()` pra fechar a tela de cima.
 *
 * REGRA PEDIDA: nada disso é salvo. O estado das telas vive só na memória —
 * se a pessoa sair do site/app (ou recarregar) sem voltar pelas telas
 * anteriores, na próxima vez começa tudo de novo pela tela inicial.
 */
export function useBackLayers(depth: number, closeTop: () => void) {
  const pushedRef = useRef(0);      // entradas de histórico que NÓS criamos
  const skipPopRef = useRef(0);     // popstates causados por nós mesmos (ignorar)
  const closeTopRef = useRef(closeTop);
  closeTopRef.current = closeTop;

  // Sincroniza o histórico com a quantidade de telas abertas
  useEffect(() => {
    const pushed = pushedRef.current;
    if (depth > pushed) {
      for (let i = pushed; i < depth; i++) {
        try { window.history.pushState({ peakLayer: i + 1 }, ''); } catch { /* ignora */ }
      }
    } else if (depth < pushed) {
      // Telas fechadas pela própria interface (botão X, Voltar da tela...)
      skipPopRef.current += 1; // history.go(-n) dispara UM popstate
      try { window.history.go(-(pushed - depth)); } catch { skipPopRef.current -= 1; }
    }
    pushedRef.current = depth;
  }, [depth]);

  // "Voltar" feito pela pessoa
  useEffect(() => {
    const onPop = () => {
      if (skipPopRef.current > 0) {
        skipPopRef.current -= 1;
        return;
      }
      if (pushedRef.current <= 0) return; // nada nosso aberto: deixa o navegador agir
      pushedRef.current -= 1;             // a entrada já foi consumida pelo "voltar"
      closeTopRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
