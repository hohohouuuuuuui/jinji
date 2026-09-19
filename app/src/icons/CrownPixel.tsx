const INNER = `<rect x="0" y="0" width="2" height="2" fill="#F6CF5C"/><rect x="5" y="0" width="2" height="2" fill="#F6CF5C"/><rect x="10" y="0" width="2" height="2" fill="#F6CF5C"/><rect x="0" y="2" width="12" height="2" fill="#F6CF5C"/><rect x="0" y="4" width="12" height="1" fill="#C9992E"/><rect x="3" y="3" width="1" height="1" fill="#FF3B5C"/><rect x="8" y="3" width="1" height="1" fill="#8ED4F0"/>`;

// 전설의 진지충 전용 작은 왕관 장식 — 캐릭터 머리 위에 얹는 용도.
export function CrownPixel({ width = 36, height = 15 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 12 5"
      shapeRendering="crispEdges"
      style={{ flex: 'none' }}
      dangerouslySetInnerHTML={{ __html: INNER }}
    />
  );
}
