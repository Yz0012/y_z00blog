export function runHooks(hooks = [], article) {
  for (const hook of hooks) {
    hook(article);
  }
}
