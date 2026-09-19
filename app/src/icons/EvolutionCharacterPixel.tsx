import { EVOLUTION_SPRITES, EVOLUTION_VIEWBOX, type EvolutionStageKey } from './evolutionData';

interface EvolutionCharacterPixelProps {
  stage: EvolutionStageKey;
  width?: number;
  height?: number;
  glow?: boolean;
}

export function EvolutionCharacterPixel({ stage, width = 88, height = 88, glow = false }: EvolutionCharacterPixelProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={EVOLUTION_VIEWBOX}
      shapeRendering="crispEdges"
      style={{ flex: 'none', filter: glow ? 'drop-shadow(0 0 5px rgba(246,207,92,0.65))' : undefined }}
      dangerouslySetInnerHTML={{ __html: EVOLUTION_SPRITES[stage] }}
    />
  );
}
