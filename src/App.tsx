import { useEffect, useState } from "react";
import AdventurePage from "./math/AdventurePage";
import ReadingPage from "./ReadingPage";
import { parseRoute, type Route } from "./route";

declare global {
  interface Window {
    render_game_to_text: () => string;
    advanceTime: (milliseconds: number) => void;
  }
}

function readScene(stage: Element | null): unknown {
  const holder = stage?.querySelector<HTMLElement>("[data-scene]");
  try {
    return holder ? JSON.parse(holder.dataset.scene ?? "null") : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    // Text snapshot of the screen for automated browser checks.
    window.render_game_to_text = () => {
      const stage = document.querySelector(".game-stage");
      return JSON.stringify({
        route,
        step: stage?.getAttribute("data-step") ?? null,
        engine: stage?.getAttribute("data-engine") ?? null,
        instruction: stage?.querySelector(".instruction")?.textContent?.trim() ?? null,
        hint: stage?.querySelector(".m-hint.is-visible, .mistake-feedback.is-visible")?.textContent?.trim() ?? null,
        scene: readScene(stage),
        availableActions: [...(stage ?? document).querySelectorAll("button:not([disabled])")]
          .map((button) => button.getAttribute("aria-label") || button.textContent?.trim())
          .filter(Boolean),
      });
    };
    window.advanceTime = (milliseconds: number) => {
      window.dispatchEvent(new CustomEvent("learning-games:advance-time", { detail: milliseconds }));
    };
  }, [route]);

  const openStep = (stepId: string | null) => {
    window.location.hash = stepId ? `#maths/${encodeURIComponent(stepId)}` : "#maths";
  };

  const tab = (href: string, label: string, active: boolean, icon?: string) => (
    <a href={href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </a>
  );

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#maths" aria-label="Dix sur dix, accueil">
          <span className="brand-mark" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => <i key={index} />)}
          </span>
          <span><strong>Dix sur dix</strong><small>Jouer · comprendre · grandir</small></span>
        </a>
        <a className="source-link" href="https://github.com/schiste/learning-games">Projet libre <span aria-hidden="true">↗</span></a>
      </header>

      <nav className="topic-switch" aria-label="Choisir un parcours">
        {tab("#maths", "Maths", route.topic === "maths", "🔢")}
        {tab("#lecture", "Lire", route.topic === "reading", "📖")}
      </nav>

      <main>
        {route.topic === "maths" && <AdventurePage stepId={route.stepId} onOpen={openStep} />}
        {route.topic === "reading" && <ReadingPage />}
      </main>

      <footer>
        <p>Des jeux gratuits, sans publicité et sans compte. Les étoiles restent dans ce navigateur.</p>
        <p>Code partagé sous licence <a href="https://www.gnu.org/licenses/agpl-3.0.html">AGPL-3.0</a>.</p>
      </footer>
    </div>
  );
}
