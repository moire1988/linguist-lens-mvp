/**
 * Subtle graph-paper grid background.
 * Replaces the animated mesh-gradient blobs with a thin line grid
 * to give a "cyber-minimal" tech feel.
 */
export function MeshBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-grid-pattern" />
    </div>
  );
}
