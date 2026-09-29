<script lang="ts">
  // Un compteur du tableau de bord : il défile vers sa valeur au lieu de sauter (fiche, § 6). Un
  // achat le fait descendre, un clic ou un retour d'absence le fait monter, en quelques dixièmes de
  // seconde. Sans mouvement, il saute.
  import { onMount } from "svelte";

  let { valeur, formater }: { valeur: number; formater: (valeur: number) => string } = $props();

  /** Le temps que met l'écart à se réduire d'un facteur e, en secondes. */
  const INERTIE = 0.08;

  // Le compteur part de sa valeur : rien ne défile à l'ouverture.
  // svelte-ignore state_referenced_locally
  let affiche = $state(valeur);
  let mouvement = $state(false);

  onMount(() => {
    mouvement = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!mouvement) return;
    let precedent = performance.now();
    let id = requestAnimationFrame(function image(instant: number) {
      const dt = Math.max(0, instant - precedent) / 1000;
      precedent = instant;
      const ecart = valeur - affiche;
      // Assez près : le compteur rejoint sa valeur, pour ne pas s'en approcher sans fin.
      affiche =
        Math.abs(ecart) <= Math.abs(valeur) * 1e-4 || !Number.isFinite(ecart)
          ? valeur
          : affiche + ecart * (1 - Math.exp(-dt / INERTIE));
      id = requestAnimationFrame(image);
    });
    return () => cancelAnimationFrame(id);
  });
</script>

{formater(mouvement ? affiche : valeur)}
