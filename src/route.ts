export type Route = { topic: "maths"; stepId: string | null } | { topic: "reading" };

/** `#maths/<step>` opens a step; old links (`#faire-10`, `#nombres`, `#cycle-2`, empty hash) land on the adventure map. */
export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  if (path === "lecture") return { topic: "reading" };
  const [head, stepId] = path.split("/");
  return { topic: "maths", stepId: head === "maths" && stepId ? decodeURIComponent(stepId) : null };
}
