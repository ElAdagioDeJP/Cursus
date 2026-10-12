/** Tecla de atajo: usa el token .cursus-kbd de globals.css. */
export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="cursus-kbd">{children}</kbd>;
}
