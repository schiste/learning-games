export type Route = { topic: "maths"; stepId: string | null } | { topic: "reading" | "decimal" | "core" };

/** `#maths/<step>` opens a step; old links (`#faire-10`, empty hash) land on the adventure map. */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  if (path === "lecture") return { topic: "reading" };
  if (path === "nombres") return { topic: "decimal" };
  if (path === "cycle-2") return { topic: "core" };
  const [head, stepId] = path.split("/");
  return { topic: "maths", stepId: head === "maths" && stepId ? decodeURIComponent(stepId) : null };
}
